"""PlatformIO Device Tool — local HTTP server.

Features:
  * list / read / write src/configs/*.h
  * parsed macro view (grouped) for every scanned file
  * build / upload / upload fs via PlatformIO, output streamed with SSE
  * serial monitor as SSE + POST send
  * device reset (DTR/RTS pulse)
  * list PlatformIO environments and serial ports

Dependencies: stdlib + pyserial (already in use by run.py).
Run from repo root:  python3 dev_tool/server.py [--port 8765]
Then open http://127.0.0.1:8765/
"""
from __future__ import annotations

import argparse
import configparser
import glob
import ipaddress
import json
import mimetypes
import os
import queue
import re
import shlex
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.request
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

try:
    import serial  # type: ignore
except ImportError:  # pragma: no cover - optional at import time
    serial = None  # type: ignore

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
PROJECTS_ROOT = os.path.abspath(os.path.join(REPO, ".."))
sys.path.insert(0, HERE)
from parser import scan, group_by_file  # noqa: E402
from module_schema import list_all as list_all_modules, inspect as inspect_module  # noqa: E402

CONFIGS_DIR = os.path.join(REPO, "src", "configs")
SCAN_TARGETS = ["config.h", "src/configs", "src/module", "src/base"]


def configure_project(path: str) -> dict:
    """Switch the active PlatformIO project within the configured projects root."""
    global REPO, CONFIGS_DIR, PIO_INI, WEB_APP_DIR, COMMON_FILE, READABLE_ROOTS
    candidate = os.path.realpath(os.path.abspath(os.path.expanduser(path)))
    if candidate != PROJECTS_ROOT and candidate not in {
        os.path.realpath(os.path.join(PROJECTS_ROOT, name))
        for name in os.listdir(PROJECTS_ROOT)
        if os.path.isdir(os.path.join(PROJECTS_ROOT, name))
    }:
        raise ValueError("project must be in the projects root or one level below it")
    if not os.path.isfile(os.path.join(candidate, "platformio.ini")):
        raise ValueError("platformio.ini not found in project")
    REPO = candidate
    CONFIGS_DIR = os.path.join(REPO, "src", "configs")
    PIO_INI = os.path.join(REPO, "platformio.ini")
    WEB_APP_DIR = os.path.join(REPO, "web_app")
    COMMON_FILE = os.path.join(REPO, "config.h")
    READABLE_ROOTS = [os.path.abspath(os.path.join(REPO, p)) for p in ("src", "config.h")]
    return {"name": os.path.basename(REPO), "path": REPO}


def project_info(path: str) -> dict:
    project = os.path.realpath(path)
    text = ""
    try:
        with open(os.path.join(project, "platformio.ini"), "r", encoding="utf-8", errors="replace") as f:
            text = f.read().lower()
    except OSError:
        pass
    is_esp = bool(re.search(r"(?:platform|board)\s*=.*(?:espressif|esp32|esp8266)", text))
    return {"name": os.path.basename(project), "path": project, "is_esp": is_esp}


def list_projects() -> list[dict]:
    candidates = [PROJECTS_ROOT]
    candidates.extend(os.path.join(PROJECTS_ROOT, name) for name in sorted(os.listdir(PROJECTS_ROOT)))
    return [project_info(path) for path in candidates
            if os.path.isfile(os.path.join(path, "platformio.ini"))]

# ---------- event bus ----------------------------------------------------------


class Channel:
    """Fan-out message queue for SSE subscribers."""

    def __init__(self, name: str, history: int = 500) -> None:
        self.name = name
        self._subs: list[queue.Queue[str]] = []
        self._lock = threading.Lock()
        self._history: list[str] = []
        self._history_size = history

    def subscribe(self) -> queue.Queue[str]:
        q: queue.Queue[str] = queue.Queue()
        with self._lock:
            for item in self._history:
                q.put(item)
            self._subs.append(q)
        return q

    def unsubscribe(self, q: queue.Queue[str]) -> None:
        with self._lock:
            if q in self._subs:
                self._subs.remove(q)

    def publish(self, data: dict | str) -> None:
        payload = data if isinstance(data, str) else json.dumps(data, ensure_ascii=False)
        with self._lock:
            self._history.append(payload)
            if len(self._history) > self._history_size:
                self._history = self._history[-self._history_size :]
            subs = list(self._subs)
        for q in subs:
            try:
                q.put_nowait(payload)
            except queue.Full:  # pragma: no cover
                pass


BUILD_CH = Channel("build")
SERIAL_CH = Channel("serial", history=2000)


# ---------- serial monitor -----------------------------------------------------


class SerialMonitor:
    def __init__(self) -> None:
        self._ser: "serial.Serial | None" = None
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()
        self._lock = threading.Lock()
        self.port: str | None = None
        self.baud: int = 115200

    def status(self) -> dict:
        return {"open": self._ser is not None, "port": self.port, "baud": self.baud}

    def open(self, port: str, baud: int = 115200) -> None:
        if serial is None:
            raise RuntimeError("pyserial is not installed; run: pip install pyserial")
        with self._lock:
            self.close_locked()
            self._ser = serial.Serial(port, baud, timeout=0.2)
            self.port = port
            self.baud = baud
            self._stop.clear()
            self._thread = threading.Thread(target=self._reader, daemon=True)
            self._thread.start()
            SERIAL_CH.publish({"type": "status", "open": True, "port": port, "baud": baud})

    def close_locked(self) -> None:
        self._stop.set()
        if self._ser is not None:
            try:
                self._ser.close()
            except Exception:
                pass
        self._ser = None

    def close(self) -> None:
        with self._lock:
            self.close_locked()
        SERIAL_CH.publish({"type": "status", "open": False, "port": self.port, "baud": self.baud})

    def write(self, data: str | bytes) -> None:
        with self._lock:
            if self._ser is None:
                raise RuntimeError("serial not open")
            payload = data if isinstance(data, bytes) else data.encode("utf-8", errors="replace")
            self._ser.write(payload)

    def reset(self) -> None:
        """Pulse DTR/RTS to reboot ESP."""
        with self._lock:
            if self._ser is None:
                raise RuntimeError("serial not open")
            self._ser.setDTR(False)
            self._ser.setRTS(True)
            time.sleep(0.1)
            self._ser.setRTS(False)
            time.sleep(0.05)
        SERIAL_CH.publish({"type": "info", "text": "-- reset pulse --"})

    def _reader(self) -> None:
        buf = b""
        last_data = time.time()
        while not self._stop.is_set() and self._ser is not None:
            try:
                chunk = self._ser.read(256)
            except Exception as e:
                SERIAL_CH.publish({"type": "error", "text": f"serial read: {e}"})
                with self._lock:
                    ser = self._ser
                    self._ser = None
                    self._stop.set()
                if ser is not None:
                    try:
                        ser.close()
                    except Exception:
                        pass
                SERIAL_CH.publish({"type": "status", "open": False,
                                   "port": self.port, "baud": self.baud})
                break
            if chunk:
                if self.baud in (2400, 4800, 9600):
                    SERIAL_CH.publish({"type": "line", "text": "< " + chunk.hex(" ")})
                    continue
                buf += chunk
                last_data = time.time()
                while b"\n" in buf:
                    line, buf = buf.split(b"\n", 1)
                    SERIAL_CH.publish({"type": "line",
                        "text": line.decode("utf-8", "replace").rstrip("\r")})
                # If the chunk didn't end with newline and buf grew big, flush now.
                if len(buf) > 1024:
                    SERIAL_CH.publish({"type": "line",
                        "text": buf.decode("utf-8", "replace")})
                    buf = b""
            else:
                # Timed read returned empty: flush partial line after 500 ms so
                # devices that don't terminate every write with \n still show.
                if buf and time.time() - last_data > 0.5:
                    SERIAL_CH.publish({"type": "line",
                        "text": buf.decode("utf-8", "replace")})
                    buf = b""
                    last_data = time.time()
        SERIAL_CH.publish({"type": "info", "text": "-- reader stopped --"})


MONITOR = SerialMonitor()


# ---------- platformio ---------------------------------------------------------


PIO_INI = os.path.join(REPO, "platformio.ini")


def list_envs() -> list[str]:
    cp = configparser.ConfigParser()
    cp.read(PIO_INI)
    return sorted(s[4:] for s in cp.sections() if s.startswith("env:"))


def _read_cp() -> configparser.ConfigParser:
    cp = configparser.ConfigParser()
    cp.read(PIO_INI)
    return cp


def read_pio_section(section: str) -> dict:
    cp = _read_cp()
    if section not in cp:
        return {"section": section, "exists": False, "items": {}}
    return {"section": section, "exists": True, "items": dict(cp.items(section))}


def list_pio_sections() -> list[str]:
    cp = _read_cp()
    return list(cp.sections())


def resolve_pio_chain(section: str) -> list[str]:
    """Follow `extends` from `section`, returning the chain in order."""
    cp = _read_cp()
    chain, seen = [], set()
    cur = section
    while cur and cur not in seen and cur in cp:
        chain.append(cur); seen.add(cur)
        cur = cp[cur].get("extends", "").strip()
    return chain


def write_pio_section(section: str, items: dict) -> None:
    """Rewrite just one section while preserving the rest of the file.

    configparser rewrites would strip comments and reflow — unacceptable for a
    file people edit by hand. Instead patch the section's text block.
    """
    with open(PIO_INI, "r", encoding="utf-8") as f:
        text = f.read()
    header = f"[{section}]"
    lines = text.splitlines()
    start = None
    for i, ln in enumerate(lines):
        if ln.strip() == header:
            start = i
            break
    body = []
    for key, val in items.items():
        if val is None or val == "":
            continue
        if "\n" in str(val):
            body.append(f"{key} =")
            for part in str(val).strip().splitlines():
                body.append("  " + part.strip())
        else:
            body.append(f"{key} = {val}")
    if start is None:
        new = text.rstrip() + "\n\n" + header + "\n" + "\n".join(body) + "\n"
    else:
        end = start + 1
        while end < len(lines) and not lines[end].lstrip().startswith("["):
            end += 1
        new = "\n".join(lines[:start + 1] + body + ([""] if end < len(lines) else []) + lines[end:])
        if not new.endswith("\n"):
            new += "\n"
    with open(PIO_INI, "w", encoding="utf-8", newline="\n") as f:
        f.write(new)


_MODULE_META_PATH = os.path.join(HERE, "module_meta.json")


def _load_module_meta() -> dict:
    try:
        with open(_MODULE_META_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def default_subnet() -> str:
    """Guess the local /24 subnet by looking at a UDP route."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        parts = ip.split(".")
        return ".".join(parts[:3]) + ".0/24"
    except Exception:
        return "192.168.1.0/24"


def _probe_device(ip: str, timeout: float = 0.6, want_error: bool = False):
    """GET /info on <ip>. Returns the parsed dict, or (None, "reason") when
    want_error=True so callers can surface why it failed."""
    req = urllib.request.Request(f"http://{ip}/info",
                                 headers={"User-Agent": "myhome-devtool/1.0",
                                          "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = r.read().decode("utf-8", "replace")
        info = json.loads(data)
        info["ip"] = ip
        return info
    except socket.timeout:
        err = "timeout"
    except urllib.error.HTTPError as e:
        err = f"HTTP {e.code}"
    except urllib.error.URLError as e:
        err = f"url error: {e.reason}"
    except (json.JSONDecodeError, ValueError):
        err = "bad JSON response"
    except Exception as e:
        err = str(e)
    return (None, err) if want_error else None


def scan_subnet(subnet: str, max_hosts: int = 256, timeout: float = 2.5) -> list[dict]:
    """Hit /info on every host in `subnet` in parallel. Returns responders.

    Devices with a busy main loop can take up to ~1 s to answer, so the per-host
    timeout is generous; the join waits a bit longer than that.
    """
    try:
        net = ipaddress.ip_network(subnet, strict=False)
    except ValueError:
        return []
    hosts = [str(h) for h in net.hosts()][:max_hosts]
    found: list[dict] = []
    lock = threading.Lock()

    def worker(ip: str) -> None:
        info = _probe_device(ip, timeout=timeout)
        if info:
            with lock: found.append(info)

    threads = [threading.Thread(target=worker, args=(ip,), daemon=True) for ip in hosts]
    for t in threads: t.start()
    for t in threads: t.join(timeout=timeout + 0.5)
    found.sort(key=lambda d: tuple(int(x) for x in d["ip"].split(".")))
    return found


SSDP_ADDR = ("239.255.255.250", 1900)
SSDP_SEARCH = (
    "M-SEARCH * HTTP/1.1\r\n"
    "HOST: 239.255.255.250:1900\r\n"
    'MAN: "ssdp:discover"\r\n'
    "MX: 2\r\n"
    "ST: ssdp:all\r\n"
    "USER-AGENT: myhome-devtool/1.0\r\n"
    "\r\n"
).encode()


def ssdp_discover(timeout: float = 3.0) -> list[dict]:
    """Send M-SEARCH, collect every responder, follow LOCATION, then /info."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    s.settimeout(0.6)
    raw: dict[str, dict] = {}
    try:
        for _ in range(3):   # retransmit to cover packet loss
            s.sendto(SSDP_SEARCH, SSDP_ADDR)
        end = time.time() + timeout
        while time.time() < end:
            try:
                data, (ip, _) = s.recvfrom(2048)
            except socket.timeout:
                continue
            headers = {}
            for ln in data.decode("utf-8", "replace").splitlines()[1:]:
                if ":" in ln:
                    k, _, v = ln.partition(":")
                    headers[k.strip().upper()] = v.strip()
            raw.setdefault(ip, {"ip": ip, "ssdp": headers})
    finally:
        s.close()

    out = []
    for ip, meta in raw.items():
        info = _probe_device(ip, timeout=5.0) or {"ip": ip}
        info["ssdp"] = {k: meta["ssdp"].get(k) for k in ("SERVER", "LOCATION", "ST", "USN") if meta["ssdp"].get(k)}
        # If /info gave us nothing useful, borrow name/version from SSDP SERVER:
        #   "Arduino/1.0 UPNP/1.1 MHOME/<version>" — the project's main_info prefix.
        if not info.get("version"):
            server = info["ssdp"].get("SERVER", "")
            m = re.search(r"MHOME/([\w.\-]+)", server)
            if m: info.setdefault("version", m.group(1))
            m = re.search(r"\b([A-Za-z][\w\-]+)/([\w.\-]+)\s*$", server)
            if m and "fr_name" not in info: info["fr_name"] = m.group(1)
        out.append(info)
    out.sort(key=lambda d: tuple(int(x) for x in d["ip"].split(".")))
    return out


def activate_ota(ip: str, timeout: float = 2.0) -> bool:
    try:
        with urllib.request.urlopen(f"http://{ip}/wifi_ota", timeout=timeout) as r:
            r.read(1024)
        return True
    except Exception:
        return False


def wait_for_device_online(ip: str, max_wait: float = 30.0, poll_interval: float = 1.0) -> bool:
    """Poll /wifi_ota until the device answers, with a shared timeout.
    Returns True once it responds; False if we hit the deadline or a cancel.
    """
    deadline = time.monotonic() + max_wait
    attempt = 0
    while time.monotonic() < deadline:
        if cancel_requested():
            return False
        attempt += 1
        if activate_ota(ip, timeout=2.0):
            BUILD_CH.publish({"type": "line",
                              "text": f"[chain] device online after {attempt} attempt(s)"})
            return True
        time.sleep(poll_interval)
    BUILD_CH.publish({"type": "line",
                      "text": f"[chain] device did not come online within {max_wait:.0f}s"})
    return False


def list_modules() -> list[dict]:
    """Rich list with inferred enable/params/description per module.

    Merges hand-curated `module_meta.json`: `parallel` groups let the UI edit
    several arrays-shaped #defines (e.g. ADS1115_ADDR/NAME/MODE) as one table.
    """
    meta = _load_module_meta()
    module_dir = os.path.join(REPO, "src", "module")
    out = list_all_modules(REPO) if os.path.isdir(module_dir) else []
    for mod in out:
        extra = meta.get(mod["name"]) or {}
        for k, v in extra.items():
            if k.startswith("_"):
                continue
            # Meta.description overrides scan only when non-empty; preserve the
            # auto one if meta leaves it blank.
            if k == "description" and not v:
                continue
            mod[k] = v
    return out


def list_ports() -> list[str]:
    if serial is None:
        return []
    patterns = ["/dev/ttyUSB*", "/dev/ttyACM*", "/dev/tty.*", "COM*"]
    found: list[str] = []
    for p in patterns:
        found.extend(glob.glob(p))
    return sorted(set(found))


# Tracks the currently running pio subprocess so /api/stop can signal it.
# Access guarded by _proc_lock; writes always paired with the start/clear calls
# in run_pio so stop_running_proc() never finds a stale handle.
_proc_lock = threading.Lock()
_current_proc: subprocess.Popen | None = None
_current_label: str | None = None
_cancel_requested = False


def _set_current_proc(proc: subprocess.Popen | None, label: str | None = None) -> None:
    global _current_proc, _current_label, _cancel_requested
    with _proc_lock:
        _current_proc = proc
        _current_label = label if proc is not None else None
        if proc is None:
            _cancel_requested = False


def stop_running_proc() -> dict:
    """Terminate the currently running pio subprocess (if any). Returns a status dict."""
    global _cancel_requested
    with _proc_lock:
        proc = _current_proc
        label = _current_label
        if proc is None or proc.poll() is not None:
            return {"ok": False, "error": "no task running"}
        _cancel_requested = True
    BUILD_CH.publish({"type": "line", "text": f"[stop] signalling {label or 'pio'} (pid {proc.pid})"})
    try:
        # Kill the whole process group so pio's child toolchain dies too.
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
    except ProcessLookupError:
        return {"ok": False, "error": "process gone"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

    def _reap() -> None:
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
            except Exception:
                pass

    threading.Thread(target=_reap, daemon=True).start()
    return {"ok": True}


def run_pio(args: list[str], label: str | None = None, env_extra: dict | None = None) -> int:
    """Run a pio command, stream output to BUILD_CH, close serial first.
    Returns the exit code (negative for signals / spawn failures)."""
    was_open = MONITOR.status()["open"]
    port, baud = MONITOR.port, MONITOR.baud
    if was_open:
        MONITOR.close()
    cmd = "pio " + " ".join(args)
    BUILD_CH.publish({"type": "start", "cmd": cmd, "label": label or cmd})
    env = os.environ.copy()
    if env_extra:
        env.update(env_extra)
    try:
        proc = subprocess.Popen(
            ["pio", *args],
            cwd=REPO,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            text=True,
            env=env,
            start_new_session=True,  # own process group so SIGTERM reaches children
        )
    except FileNotFoundError:
        BUILD_CH.publish({"type": "error", "text": "pio executable not found in PATH"})
        BUILD_CH.publish({"type": "end", "code": -1})
        return -1
    _set_current_proc(proc, label or cmd)
    try:
        assert proc.stdout is not None
        for line in proc.stdout:
            BUILD_CH.publish({"type": "line", "text": line.rstrip("\n")})
        code = proc.wait()
    finally:
        _set_current_proc(None)
    BUILD_CH.publish({"type": "end", "code": code})
    if was_open and port:
        try:
            MONITOR.open(port, baud)
        except Exception as e:
            SERIAL_CH.publish({"type": "error", "text": f"reopen: {e}"})
    return code


def cancel_requested() -> bool:
    with _proc_lock:
        return _cancel_requested


def run_shell(cmd: str, label: str, cwd: str | None = None,
              env_extra: dict | None = None) -> int:
    """Run a shell pipeline via `bash -lc`, stream output to BUILD_CH.
    Mirrors run_pio's process tracking so /api/stop can interrupt it."""
    BUILD_CH.publish({"type": "start", "cmd": cmd, "label": label})
    env = os.environ.copy()
    if env_extra:
        env.update(env_extra)
    try:
        proc = subprocess.Popen(
            # Not a login shell — we don't want ~/.bashrc side effects
            # (e.g. auto-sourcing esp-idf/export.sh) in build output.
            ["bash", "-c", cmd],
            cwd=cwd or REPO,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            text=True,
            env=env,
            start_new_session=True,
        )
    except FileNotFoundError:
        BUILD_CH.publish({"type": "error", "text": "bash not found"})
        BUILD_CH.publish({"type": "end", "code": -1})
        return -1
    _set_current_proc(proc, label)
    try:
        assert proc.stdout is not None
        for line in proc.stdout:
            BUILD_CH.publish({"type": "line", "text": line.rstrip("\n")})
        code = proc.wait()
    finally:
        _set_current_proc(None)
    BUILD_CH.publish({"type": "end", "code": code})
    return code


def spawn_shell(cmd: str, label: str, cwd: str | None = None,
                env_extra: dict | None = None) -> bool:
    if not _build_lock.acquire(blocking=False):
        return False

    def _runner() -> None:
        try:
            run_shell(cmd, label, cwd=cwd, env_extra=env_extra)
        finally:
            _build_lock.release()

    threading.Thread(target=_runner, daemon=True).start()
    return True


# ---------- nvm / web_app ------------------------------------------------------

NVM_DIR = os.environ.get("NVM_DIR") or os.path.expanduser("~/.nvm")
WEB_APP_DIR = os.path.join(REPO, "web_app")


def list_node_versions() -> dict:
    """Return installed node versions under $NVM_DIR and the default alias."""
    root = os.path.join(NVM_DIR, "versions", "node")
    versions: list[str] = []
    if os.path.isdir(root):
        for name in os.listdir(root):
            if name.startswith("v"):
                versions.append(name)
    versions.sort(key=lambda s: [int(x) for x in s.lstrip("v").split(".") if x.isdigit()])
    default = None
    alias = os.path.join(NVM_DIR, "alias", "default")
    if os.path.isfile(alias):
        try:
            with open(alias, "r", encoding="utf-8") as f:
                default = f.read().strip()
        except OSError:
            pass
    return {"versions": versions, "default": default,
            "nvm_dir": NVM_DIR, "available": bool(versions)}


_build_lock = threading.Lock()


def spawn_pio(args: list[str], label: str | None = None, env_extra: dict | None = None) -> bool:
    return spawn_pio_steps([(args, label, env_extra)])


def spawn_pio_steps(steps: list[tuple[list[str], str | None, dict | None]]) -> bool:
    """Run several pio commands sequentially under the one build lock. Stops on
    the first non-zero exit so uploadfs+upload doesn't flash firmware over a
    half-written filesystem."""
    if not _build_lock.acquire(blocking=False):
        return False

    def _runner() -> None:
        try:
            for args, label, env_extra in steps:
                if cancel_requested():
                    BUILD_CH.publish({"type": "line", "text": "[stop] cancelled before next step"})
                    break
                code = run_pio(args, label=label, env_extra=env_extra)
                if code != 0:
                    if len(steps) > 1:
                        BUILD_CH.publish({"type": "line",
                                          "text": f"[chain] aborted — previous step exited {code}"})
                    break
        finally:
            _build_lock.release()

    threading.Thread(target=_runner, daemon=True).start()
    return True


def spawn_ota(ip: str, env: str, fs: bool, both: bool = False) -> bool:
    """Hit /wifi_ota first, then launch pio upload over OTA.
    If both=True, uploadfs then upload (fs flag is ignored)."""
    if not _build_lock.acquire(blocking=False):
        return False

    def _runner() -> None:
        try:
            targets = ["uploadfs", "upload"] if both else [("uploadfs" if fs else "upload")]
            label_suffix = "FS+FW" if both else targets[0]
            env_extra = {
                "PLATFORMIO_UPLOAD_PROTOCOL": "espota",
                "PLATFORMIO_UPLOAD_PORT": ip,
            }
            for i, target in enumerate(targets):
                if cancel_requested():
                    BUILD_CH.publish({"type": "line", "text": "[stop] cancelled before OTA step"})
                    break
                BUILD_CH.publish({"type": "start",
                                  "cmd": f"GET http://{ip}/wifi_ota",
                                  "label": f"OTA {target} {env} → {ip}"
                                           + (f" (step {i+1}/{len(targets)} of {label_suffix})" if both else "")})
                ok = activate_ota(ip)
                BUILD_CH.publish({"type": "line",
                                  "text": "activate /wifi_ota: " + ("ok" if ok else "no response (continuing)")})
                time.sleep(1.0)  # give the device time to switch into OTA mode
                args = ["run", "-t", target, "-e", env, "--upload-port", ip]
                code = run_pio(args, label=f"OTA {target} {env} → {ip}", env_extra=env_extra)
                if code != 0:
                    if both:
                        BUILD_CH.publish({"type": "line",
                                          "text": f"[chain] aborted — {target} exited {code}"})
                    break
                if both and i == 0:
                    # Device reboots after uploadfs; wait until it is back on
                    # the network before firing the firmware step. On ESP32 +
                    # LAN8720 the PHY+DHCP bring-up alone can take 5-10s, so a
                    # fixed sleep is unreliable.
                    BUILD_CH.publish({"type": "line",
                                      "text": "[chain] waiting for device to reboot before firmware upload"})
                    time.sleep(2.0)  # don't poll before the device has even dropped the old socket
                    if not wait_for_device_online(ip, max_wait=45.0):
                        BUILD_CH.publish({"type": "line",
                                          "text": "[chain] aborted — device offline after uploadfs"})
                        break
        finally:
            _build_lock.release()

    threading.Thread(target=_runner, daemon=True).start()
    return True


# ---------- http handler -------------------------------------------------------


def safe_config_path(name: str) -> str:
    if "/" in name or "\\" in name or ".." in name or not name.endswith(".h"):
        raise ValueError("invalid config filename")
    full = os.path.join(CONFIGS_DIR, name)
    if not os.path.abspath(full).startswith(os.path.abspath(CONFIGS_DIR) + os.sep):
        raise ValueError("escape")
    return full


COMMON_FILE = os.path.join(REPO, "config.h")
READABLE_ROOTS = [os.path.abspath(os.path.join(REPO, p)) for p in ("src", "config.h")]


def safe_source_path(rel: str) -> str:
    """Read-only path check: file must live under src/ or be the top-level config.h."""
    if ".." in rel.split("/"):
        raise ValueError("escape")
    full = os.path.abspath(os.path.join(REPO, rel))
    if not (full.endswith(".h") or full.endswith(".hpp")):
        raise ValueError("not a header")
    for root in READABLE_ROOTS:
        if full == root or full.startswith(root + os.sep):
            if os.path.isfile(full):
                return full
    raise ValueError("not readable")


class Handler(BaseHTTPRequestHandler):
    server_version = "MYHOME-DevTool/1.0"

    # noise-free log
    def log_message(self, fmt: str, *args) -> None:  # pragma: no cover
        if os.environ.get("DEVTOOL_VERBOSE"):
            super().log_message(fmt, *args)

    # ---- helpers ----
    def _send_json(self, obj, status: int = 200) -> None:
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _send_text(self, text: str, status: int = 200, ctype: str = "text/plain") -> None:
        body = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", f"{ctype}; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        n = int(self.headers.get("Content-Length") or "0")
        if n <= 0:
            return {}
        return json.loads(self.rfile.read(n).decode("utf-8"))

    # ---- SSE ----
    def _stream_sse(self, channel: Channel) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        q = channel.subscribe()
        try:
            while True:
                try:
                    payload = q.get(timeout=15)
                    data = f"data: {payload}\n\n".encode("utf-8")
                    self.wfile.write(data)
                    self.wfile.flush()
                except queue.Empty:
                    try:
                        self.wfile.write(b": keep-alive\n\n")
                        self.wfile.flush()
                    except (BrokenPipeError, ConnectionResetError):
                        break
                except (BrokenPipeError, ConnectionResetError):
                    break
        finally:
            channel.unsubscribe(q)

    # ---- routes ----
    def do_GET(self) -> None:
        url = urlparse(self.path)
        path = url.path
        q = parse_qs(url.query)

        if path == "/":
            return self._serve_static("index.html")
        if path.startswith("/static/"):
            return self._serve_static(path[len("/static/"):])

        if path == "/api/project":
            return self._send_json({"project": project_info(REPO)})
        if path == "/api/projects":
            return self._send_json({"projects": list_projects(),
                                    "current": project_info(REPO)})
        if path == "/api/envs":
            return self._send_json({"envs": list_envs()})
        if path == "/api/ports":
            return self._send_json({"ports": list_ports(), "status": MONITOR.status()})
        if path == "/api/configs":
            names = sorted(os.listdir(CONFIGS_DIR)) if os.path.isdir(CONFIGS_DIR) else []
            names = [n for n in names if n.endswith(".h")]
            return self._send_json({"configs": names})
        if path.startswith("/api/configs/"):
            name = path[len("/api/configs/"):]
            try:
                full = safe_config_path(name)
            except ValueError as e:
                return self._send_json({"error": str(e)}, 400)
            if not os.path.isfile(full):
                return self._send_json({"error": "not found"}, 404)
            with open(full, "r", encoding="utf-8", errors="replace") as f:
                src = f.read()
            return self._send_json({"name": name, "content": src})
        if path == "/api/parse":
            defs = scan(REPO, SCAN_TARGETS)
            return self._send_json({"groups": group_by_file([d for d in defs])})
        if path == "/api/common":
            if not os.path.isfile(COMMON_FILE):
                return self._send_json({"name": "config.h", "content": ""})
            with open(COMMON_FILE, "r", encoding="utf-8", errors="replace") as f:
                return self._send_json({"name": "config.h", "content": f.read()})
        if path == "/api/pio":
            with open(PIO_INI, "r", encoding="utf-8", errors="replace") as f:
                return self._send_json({"content": f.read()})
        if path.startswith("/api/pio/env/"):
            env = path[len("/api/pio/env/"):]
            sect = "env:" + env
            chain = resolve_pio_chain(sect)
            sections = [read_pio_section(s) for s in chain]
            return self._send_json({"section": sect, "chain": chain,
                                    "sections": sections,
                                    "all_sections": list_pio_sections()})
        if path == "/api/pio/sections":
            return self._send_json({"sections": list_pio_sections()})
        if path.startswith("/api/pio/section/"):
            name = path[len("/api/pio/section/"):]
            return self._send_json(read_pio_section(name))
        if path == "/api/modules":
            return self._send_json({"modules": list_modules()})
        if path == "/api/net/subnet":
            return self._send_json({"subnet": default_subnet()})
        if path.startswith("/api/net/probe/"):
            ip = path[len("/api/net/probe/"):]
            # /info builds a large JSON with lots of ESP calls — can take seconds.
            res = _probe_device(ip, timeout=6.0, want_error=True)
            if isinstance(res, tuple):
                return self._send_json({"info": None, "error": res[1]})
            return self._send_json({"info": res})
        if path == "/api/firmware/known":
            # List built artifacts for freshness checks.
            out = []
            root = os.path.join(REPO, ".pio", "build")
            if os.path.isdir(root):
                for env in sorted(os.listdir(root)):
                    bin_ = os.path.join(root, env, "firmware.bin")
                    if os.path.isfile(bin_):
                        st = os.stat(bin_)
                        out.append({"env": env, "mtime": int(st.st_mtime), "size": st.st_size})
            return self._send_json({"firmware": out})
        if path == "/api/enums":
            # Merge enum groups across all module/base headers.
            from module_schema import _collect_enums  # type: ignore
            buckets: dict[str, set] = {}
            for root in (os.path.join(REPO, "src", "module"), os.path.join(REPO, "src", "base")):
                if not os.path.isdir(root):
                    continue
                for fn in os.listdir(root):
                    if not fn.endswith(".h"): continue
                    with open(os.path.join(root, fn), "r", encoding="utf-8", errors="replace") as f:
                        for p, names in _collect_enums(f.read()).items():
                            buckets.setdefault(p, set()).update(names)
            return self._send_json({"enums": {p: sorted(v) for p, v in buckets.items()}})
        if path.startswith("/api/source/"):
            rel = path[len("/api/source/"):]
            try:
                full = safe_source_path(rel)
            except ValueError as e:
                return self._send_json({"error": str(e)}, 400)
            with open(full, "r", encoding="utf-8", errors="replace") as f:
                return self._send_json({"path": rel, "content": f.read()})
        if path == "/api/stream/build":
            return self._stream_sse(BUILD_CH)
        if path == "/api/web/node-versions":
            info = list_node_versions()
            info["has_web_app"] = os.path.isdir(WEB_APP_DIR)
            return self._send_json(info)
        if path == "/api/stream/serial":
            return self._stream_sse(SERIAL_CH)
        return self._send_json({"error": "not found", "path": path}, 404)

    def do_PUT(self) -> None:
        url = urlparse(self.path)
        if url.path.startswith("/api/configs/"):
            name = url.path[len("/api/configs/"):]
            try:
                full = safe_config_path(name)
            except ValueError as e:
                return self._send_json({"error": str(e)}, 400)
            data = self._read_json()
            content = data.get("content", "")
            with open(full, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
            return self._send_json({"ok": True, "bytes": len(content)})
        if url.path == "/api/common":
            data = self._read_json()
            content = data.get("content", "")
            with open(COMMON_FILE, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
            return self._send_json({"ok": True, "bytes": len(content)})
        if url.path == "/api/pio":
            data = self._read_json()
            content = data.get("content", "")
            with open(PIO_INI, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
            return self._send_json({"ok": True})
        if url.path.startswith("/api/pio/env/"):
            env = url.path[len("/api/pio/env/"):]
            data = self._read_json()
            items = data.get("items") or {}
            write_pio_section("env:" + env, items)
            return self._send_json({"ok": True})
        if url.path.startswith("/api/pio/section/"):
            name = url.path[len("/api/pio/section/"):]
            data = self._read_json()
            items = data.get("items") or {}
            write_pio_section(name, items)
            return self._send_json({"ok": True})
        return self._send_json({"error": "not found"}, 404)

    def do_POST(self) -> None:
        url = urlparse(self.path)
        path = url.path

        if path == "/api/project":
            if _build_lock.locked():
                return self._send_json({"error": "build or upload is running"}, 409)
            data = self._read_json()
            try:
                project = configure_project(str(data.get("path") or ""))
            except (TypeError, ValueError) as e:
                return self._send_json({"error": str(e)}, 400)
            if MONITOR.status()["open"]:
                MONITOR.close()
            return self._send_json({"ok": True, "project": project})

        if path == "/api/configs":
            data = self._read_json()
            name = (data.get("name") or "").strip()
            if not name.endswith(".h"):
                name += ".h"
            try:
                full = safe_config_path(name)
            except ValueError as e:
                return self._send_json({"error": str(e)}, 400)
            if os.path.exists(full):
                return self._send_json({"error": "exists"}, 409)
            stem = name[:-2]
            template = (
                data.get("content")
                or f'#define CONFIG_FILE "{stem}"\n\n// ---- modules ----\n\n'
            )
            with open(full, "w", encoding="utf-8", newline="\n") as f:
                f.write(template)
            if data.get("pio_env"):
                extends = data.get("pio_extends") or "env:esp32"
                write_pio_section("env:" + stem, {
                    "extends": extends,
                    "build_flags": f"\n-include src/configs/{stem}.h",
                })
            return self._send_json({"ok": True, "name": name})

        if path == "/api/build":
            data = self._read_json()
            env = data.get("env")
            if not env:
                return self._send_json({"error": "env required"}, 400)
            if not spawn_pio(["run", "-e", env], label=f"build {env}"):
                return self._send_json({"error": "build already running"}, 409)
            return self._send_json({"ok": True})

        if path == "/api/upload":
            data = self._read_json()
            env = data.get("env")
            fs = bool(data.get("fs"))
            both = bool(data.get("both"))
            if not env:
                return self._send_json({"error": "env required"}, 400)
            if (fs or both) and not project_info(REPO)["is_esp"]:
                return self._send_json({"error": "Upload FS is available only for ESP projects"}, 400)
            port = data.get("port")
            if both:
                # One pio invocation flashes FS first, then firmware — pio
                # chains the targets in-order and aborts if uploadfs fails.
                args = ["run", "-t", "uploadfs", "-t", "upload", "-e", env]
                if port:
                    args += ["--upload-port", port]
                label = f"uploadfs+upload {env}"
                if not spawn_pio(args, label=label):
                    return self._send_json({"error": "task already running"}, 409)
            else:
                target = "uploadfs" if fs else "upload"
                args = ["run", "-t", target, "-e", env]
                if port:
                    args += ["--upload-port", port]
                if not spawn_pio(args, label=f"{target} {env}"):
                    return self._send_json({"error": "task already running"}, 409)
            return self._send_json({"ok": True})

        if path == "/api/stop":
            return self._send_json(stop_running_proc())

        if path == "/api/web/build":
            if not os.path.isdir(WEB_APP_DIR):
                return self._send_json({"error": "web_app/ not found"}, 400)
            info = list_node_versions()
            if not info["available"]:
                return self._send_json({"error": "no node versions installed under nvm"}, 400)
            data = self._read_json()
            node = (data.get("node") or info["default"] or "").strip()
            if not node:
                return self._send_json({"error": "node version required"}, 400)
            if node not in info["versions"] and ("v" + node) not in info["versions"]:
                return self._send_json({"error": f"node version '{node}' not installed"}, 400)
            script = (data.get("script") or "build:esp").strip()
            rebuild = bool(data.get("rebuild"))
            # Source nvm, pick the version, run the build. Fail fast on any step.
            # node-sass has native bindings tied to a specific Node ABI, so we
            # rebuild it on request (or whenever the Node major differs from
            # the one that compiled the current binding).
            # Ask node itself whether node-sass loads under the current ABI.
            # Any failure (missing binding, wrong ABI, missing module) → rebuild.
            rebuild_step = (
                'if [ -d node_modules/node-sass ]; then '
                '  if ! node -e "require(\'node-sass\')" >/dev/null 2>&1; then '
                '    echo "[fix] node-sass binding mismatch — rebuilding"; '
                '    npm rebuild node-sass || exit 1; '
                '  else echo "[ok] node-sass binding matches current Node"; '
                '  fi; '
                'fi; '
            )
            if rebuild:
                rebuild_step = (
                    'echo "[fix] forced rebuild of node-sass"; '
                    'npm rebuild node-sass || exit 1; '
                )
            cmd = (
                f'export NVM_DIR="{NVM_DIR}" && '
                f'[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && '
                f'nvm use {shlex.quote(node)} && '
                f'node -v && npm -v && '
                f'{rebuild_step}'
                f'npm run {shlex.quote(script)}'
            )
            label = f"web_app: npm run {script} (node {node})"
            if not spawn_shell(cmd, label=label, cwd=WEB_APP_DIR):
                return self._send_json({"error": "task already running"}, 409)
            return self._send_json({"ok": True, "node": node, "script": script})

        if path == "/api/net/scan":
            data = self._read_json()
            subnet = data.get("subnet") or default_subnet()
            devices = scan_subnet(subnet)
            return self._send_json({"subnet": subnet, "devices": devices})

        if path == "/api/net/ssdp":
            data = self._read_json()
            timeout = float(data.get("timeout") or 3.0)
            devices = ssdp_discover(timeout=timeout)
            return self._send_json({"devices": devices})

        if path == "/api/ota":
            data = self._read_json()
            ip = (data.get("ip") or "").strip()
            env = data.get("env")
            fs = bool(data.get("fs"))
            both = bool(data.get("both"))
            if not ip or not env:
                return self._send_json({"error": "ip and env required"}, 400)
            if not project_info(REPO)["is_esp"]:
                return self._send_json({"error": "OTA is available only for ESP projects"}, 400)
            if not spawn_ota(ip, env, fs, both=both):
                return self._send_json({"error": "task already running"}, 409)
            return self._send_json({"ok": True})

        if path == "/api/ota/activate":
            data = self._read_json()
            ip = (data.get("ip") or "").strip()
            if not ip:
                return self._send_json({"error": "ip required"}, 400)
            ok = activate_ota(ip)
            return self._send_json({"ok": ok})

        if path == "/api/clean":
            data = self._read_json()
            env = data.get("env")
            args = ["run", "-t", "clean"] + (["-e", env] if env else [])
            if not spawn_pio(args, label=f"clean {env or 'all'}"):
                return self._send_json({"error": "task already running"}, 409)
            return self._send_json({"ok": True})

        if path == "/api/serial/open":
            data = self._read_json()
            port = data.get("port")
            baud = int(data.get("baud") or 115200)
            if not port:
                return self._send_json({"error": "port required"}, 400)
            try:
                MONITOR.open(port, baud)
            except Exception as e:
                return self._send_json({"error": str(e)}, 400)
            return self._send_json({"ok": True, "status": MONITOR.status()})

        if path == "/api/serial/close":
            MONITOR.close()
            return self._send_json({"ok": True})

        if path == "/api/serial/send":
            data = self._read_json()
            text = data.get("text", "")
            if data.get("newline", True) and not text.endswith("\n"):
                text += "\n"
            try:
                MONITOR.write(text)
            except Exception as e:
                return self._send_json({"error": str(e)}, 400)
            SERIAL_CH.publish({"type": "sent", "text": text.rstrip("\n")})
            return self._send_json({"ok": True})

        if path == "/api/serial/send_hex":
            data = self._read_json()
            raw = str(data.get("hex", ""))
            try:
                payload = bytes.fromhex(raw)
                if not payload:
                    raise ValueError("hex payload is empty")
                MONITOR.write(payload)
            except Exception as e:
                return self._send_json({"error": str(e)}, 400)
            SERIAL_CH.publish({"type": "sent", "text": payload.hex(" ")})
            return self._send_json({"ok": True})

        if path == "/api/serial/reset":
            try:
                MONITOR.reset()
            except Exception as e:
                return self._send_json({"error": str(e)}, 400)
            return self._send_json({"ok": True})

        return self._send_json({"error": "not found", "path": path}, 404)

    # ---- static ----
    def _serve_static(self, rel: str) -> None:
        if ".." in rel or rel.startswith("/"):
            return self._send_json({"error": "bad path"}, 400)
        full = os.path.join(HERE, "web", rel)
        if not os.path.isfile(full):
            return self._send_json({"error": "not found"}, 404)
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        with open(full, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    global PROJECTS_ROOT
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--project", default=REPO,
                    help="PlatformIO project directory (default: MY_HOME)")
    ap.add_argument("--projects-root", default=PROJECTS_ROOT,
                    help="directory containing projects (itself or one level below may contain platformio.ini)")
    args = ap.parse_args()
    PROJECTS_ROOT = os.path.realpath(os.path.abspath(os.path.expanduser(args.projects_root)))
    try:
        configure_project(args.project)
    except ValueError as e:
        ap.error(str(e))
    srv = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"PlatformIO Device Tool: http://{args.host}:{args.port}/")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("stopping…")
    finally:
        MONITOR.close()
        srv.server_close()


if __name__ == "__main__":
    main()
