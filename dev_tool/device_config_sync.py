#!/usr/bin/env python3
"""Backup / restore the /config/*.json files from an ESP device.

Usage:
  device_config_sync.py pull  <host> [dest_dir]
  device_config_sync.py push  <host> <src_dir>
  device_config_sync.py list  <host>

`push` uploads every *.json / *.jsonl file from <src_dir> into the device's
/config/ via the HTTP /edit endpoint. LittleFS survives an OTA firmware
update, but a factory flash wipes it — keep a pull copy in-repo per device.
"""
import sys, os, json, re, urllib.request, urllib.parse, pathlib


def _get_json(url):
    with urllib.request.urlopen(url, timeout=5) as r:
        return json.load(r)


def cmd_list(host):
    for e in _get_json(f"http://{host}/list?dir=/config"):
        print(f"{e['name']:28} {e['size']}")


def cmd_pull(host, dest):
    dest = pathlib.Path(dest)
    dest.mkdir(parents=True, exist_ok=True)
    for e in _get_json(f"http://{host}/list?dir=/config"):
        name = e["name"]
        with urllib.request.urlopen(f"http://{host}/config/{name}", timeout=5) as r:
            (dest / name).write_bytes(r.read())
        print(f"pull {name}")


def cmd_push(host, src):
    src = pathlib.Path(src)
    for p in sorted(src.iterdir()):
        if not p.is_file() or p.suffix not in (".json", ".jsonl"):
            continue
        # ESP server's /edit (POST, multipart) uploads a single file
        boundary = "----sync" + os.urandom(8).hex()
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="data"; filename="/config/{p.name}"\r\n'
            f"Content-Type: application/octet-stream\r\n\r\n"
        ).encode() + p.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
        req = urllib.request.Request(
            f"http://{host}/edit",
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            print(f"push {p.name}  HTTP {r.status}")


def main():
    if len(sys.argv) < 3:
        print(__doc__.strip())
        sys.exit(2)
    cmd, host = sys.argv[1], sys.argv[2]
    if cmd == "list":
        cmd_list(host)
    elif cmd == "pull":
        dest = sys.argv[3] if len(sys.argv) > 3 else f"backups/{host.replace('.', '_')}"
        cmd_pull(host, dest)
    elif cmd == "push":
        if len(sys.argv) < 4:
            sys.exit("push needs src_dir")
        cmd_push(host, sys.argv[3])
    else:
        sys.exit(f"unknown command {cmd!r}")


if __name__ == "__main__":
    main()
