"""Static-scan a module header and infer its configuration surface.

Produces, per module:
    {
      "name": "my_485",
      "path": "src/module/my_485.h",
      "description": "...",           # from the leading comment block
      "enable": "MY_485_SERIAL",      # required macro that gates the file
      "params": [                     # optional macros owned by this module
         {"name": "MY_485_RX_PIN", "type": "pin", "default": "", "comment": ""},
         ...
      ],
      "deps": ["HA_DISCOVERY", "MQTT_CLIENT"],  # referenced macros from other modules
      "prefix": "MY_485",             # used by UI to group existing defines
    }

Type hints are heuristic — enough to pick a reasonable input widget.
"""
from __future__ import annotations

import os
import re

MOD_DIR = "src/module"
GUARD_SUFFIXES = ("_H", "_HPP")

IFDEF_RE = re.compile(r"#\s*if(?:n?def|\s+defined\s*\(|\s+!\s*defined\s*\()\s*([A-Z_][A-Z0-9_]*)")
DEFINED_RE = re.compile(r"defined\s*\(\s*([A-Z_][A-Z0-9_]*)\s*\)")
IFNDEF_DEFINE_RE = re.compile(
    r"#\s*ifndef\s+([A-Z_][A-Z0-9_]*)\s*\n\s*#\s*define\s+\1\s+([^\n]*)"
)


def _description(src: str) -> str:
    """Pick the leading doc comment of the module, after header/includes.

    Only trusts text at the top of the file — comments elsewhere are usually
    attached to specific code and would be misleading as a module summary.
    """
    lines = src.splitlines()
    i = 0
    while i < len(lines) and (
        not lines[i].strip()
        or lines[i].strip().startswith(("#ifndef", "#define", "#pragma", "#include"))
    ):
        i += 1
    if i >= len(lines):
        return ""
    line = lines[i].lstrip()
    if line.startswith("/*"):
        buf, j = [], i
        while j < len(lines):
            s = lines[j].strip()
            s = s.replace("/*", "").replace("*/", "").lstrip("* ").rstrip()
            buf.append(s)
            if "*/" in lines[j]: break
            j += 1
        return _trim_doc("\n".join(buf))
    if line.startswith("//"):
        out = []
        while i < len(lines) and lines[i].lstrip().startswith("//"):
            out.append(lines[i].lstrip().lstrip("/").strip())
            i += 1
        return _trim_doc("\n".join(out))
    return ""


def _trim_doc(text: str) -> str:
    """Keep only the description paragraph(s). Drop auto-generated structural
    sections (`Parameters:`, `Dependencies:`, `@generated-doc` marker)."""
    out = []
    for line in text.splitlines():
        s = line.rstrip()
        low = s.lstrip().lower()
        if low.startswith(("parameters:", "dependencies:", "@generated-doc")):
            break
        out.append(s)
    # collapse runs of blank lines
    cleaned = re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip()
    return cleaned


def _guess_type(name: str, default: str = "") -> str:
    n = name.upper()
    if "PIN" in n or n.endswith("_GPIO"): return "pin"
    if "SERIAL" in n: return "serial"
    if n.endswith(("_BAUD", "_BAUDRATE", "_SPEED")): return "baud"
    if n.endswith(("_MS", "_TIMEOUT", "_INTERVAL", "_DELAY")): return "ms"
    if n.endswith(("_SIZE", "_LEN", "_COUNT", "_ADDR")): return "int"
    if default and default.strip().startswith('"'): return "string"
    if default and re.fullmatch(r"-?\d+(?:\.\d+)?[UuLlFf]*", default.strip()): return "number"
    if not default: return "flag"
    return "string"


def inspect(path: str) -> dict:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        src = f.read()
    stem = os.path.splitext(os.path.basename(path))[0]
    guard_prefix = stem.upper()
    # strip trailing underscores from stem for a prefix match (`JBD_BMS_` → JBD_BMS)
    prefix = guard_prefix.rstrip("_")

    # collect every macro referenced by #ifdef / #ifndef / defined()
    refs: set[str] = set()
    for m in IFDEF_RE.finditer(src):
        refs.add(m.group(1))
    for m in DEFINED_RE.finditer(src):
        refs.add(m.group(1))
    # drop header guard
    refs = {r for r in refs if not (r.startswith(guard_prefix) and r.endswith(GUARD_SUFFIXES)
                                     and r == f"{guard_prefix}_H")}

    # Group by prefix
    owned = sorted(r for r in refs if r == prefix or r.startswith(prefix + "_"))
    deps = sorted(r for r in refs if r not in owned)

    # Enable macro: the "shortest owned" is usually it (MY_485 or MY_485_SERIAL).
    # If a plain-prefix macro exists, prefer it; otherwise the first *_SERIAL / *_ENABLED.
    enable = None
    if prefix in owned:
        enable = prefix
    else:
        for suf in ("_SERIAL", "_ENABLED", "_ENABLE"):
            cand = prefix + suf
            if cand in owned:
                enable = cand; break
    if enable is None and owned:
        enable = owned[0]

    # Pull defaults from any `#ifndef X \n #define X V` inside the module file.
    defaults: dict[str, str] = {}
    for m in IFNDEF_DEFINE_RE.finditer(src):
        defaults[m.group(1)] = m.group(2).strip()

    params = []
    for name in owned:
        if name == enable:
            continue
        default = defaults.get(name, "")
        params.append({
            "name": name,
            "type": _guess_type(name, default),
            "default": default,
            "required": False,
        })

    # Several configs use variant spellings (TAC11xx vs TAC11XX, KWS306L vs
    # KWS_306L). Expose both: the canonical prefix and a stripped alias.
    prefixes = {prefix}
    prefixes.add(prefix.replace("_", ""))
    return {
        "name": stem,
        "path": path,
        "description": _description(src),
        "enable": enable,
        "params": params,
        "deps": deps,
        "prefix": prefix,
        "prefixes": sorted(prefixes, key=len, reverse=True),
        "enums": _collect_enums(src),
    }


ENUM_DEFINE_RE = re.compile(r"^\s*#\s*define\s+([A-Z][A-Z0-9]+_[A-Z][A-Z0-9_]+)\s+-?\d+", re.M)


def _collect_enums(src: str) -> dict[str, list[str]]:
    """Group enum-like `#define FOO_BAR N` by common prefix.

    `TYPE_MCP23017`, `TYPE_PCF8574` → {"TYPE": [TYPE_MCP23017, TYPE_PCF8574]}.
    """
    names = ENUM_DEFINE_RE.findall(src)
    buckets: dict[str, list[str]] = {}
    for n in names:
        p = n.split("_", 1)[0]
        buckets.setdefault(p, []).append(n)
    return buckets


def list_all(repo_root: str) -> list[dict]:
    out = []
    full = os.path.join(repo_root, MOD_DIR)
    for fn in sorted(os.listdir(full)):
        if fn.endswith(".h"):
            info = inspect(os.path.join(full, fn))
            info["path"] = MOD_DIR + "/" + fn
            out.append(info)
    return out


if __name__ == "__main__":
    import json, sys
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    print(json.dumps(list_all(root), ensure_ascii=False, indent=2))
