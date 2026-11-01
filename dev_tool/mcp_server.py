#!/usr/bin/env python3
"""Small stdio MCP server for the local PlatformIO projects.

It exposes project discovery, environment listing, build and explicit firmware
upload. Upload requires ``confirm=true`` so a model cannot flash a device by
accident while only inspecting a project.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from configparser import ConfigParser
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_PROJECT = HERE.parent
PROJECTS_ROOT = DEFAULT_PROJECT.parent


def valid_project(raw: str | None) -> Path:
    candidate = (Path(raw).expanduser() if raw else DEFAULT_PROJECT).resolve()
    if candidate != PROJECTS_ROOT and candidate.parent != PROJECTS_ROOT:
        raise ValueError("project must be in the projects root or one level below it")
    if not (candidate / "platformio.ini").is_file():
        raise ValueError("platformio.ini not found in project")
    return candidate


def projects() -> list[dict[str, str]]:
    result = []
    candidates = [PROJECTS_ROOT, *sorted(PROJECTS_ROOT.iterdir())]
    for path in candidates:
        if path.is_dir() and (path / "platformio.ini").is_file():
            result.append({"name": path.name, "path": str(path.resolve())})
    return result


def envs(project: Path) -> list[str]:
    parser = ConfigParser()
    parser.read(project / "platformio.ini")
    return sorted(section[4:] for section in parser.sections() if section.startswith("env:"))


def run_pio(project: Path, env: str, target: str, port: str | None = None) -> dict:
    args = ["pio", "run", "-e", env]
    if target:
        args[2:2] = ["-t", target]
    if port:
        args += ["--upload-port", port]
    proc = subprocess.run(args, cwd=project, text=True, capture_output=True)
    output = (proc.stdout + proc.stderr)[-20000:]
    return {"ok": proc.returncode == 0, "code": proc.returncode,
            "project": str(project), "env": env, "target": target, "output": output}


TOOLS = [
    {"name": "platformio_projects", "description": "List available PlatformIO projects.",
     "inputSchema": {"type": "object", "properties": {}}},
    {"name": "platformio_environments", "description": "List environments in a PlatformIO project.",
     "inputSchema": {"type": "object", "properties": {"project": {"type": "string"}}}},
    {"name": "platformio_build", "description": "Build a PlatformIO environment.",
     "inputSchema": {"type": "object", "required": ["env"],
                      "properties": {"project": {"type": "string"}, "env": {"type": "string"}}}},
    {"name": "platformio_upload", "description": "Upload firmware or filesystem to a device. Requires confirm=true.",
     "inputSchema": {"type": "object", "required": ["env", "confirm"],
                      "properties": {"project": {"type": "string"}, "env": {"type": "string"},
                                     "port": {"type": "string"}, "fs": {"type": "boolean"},
                                     "confirm": {"type": "boolean"}}}},
]


def result(value: object) -> dict:
    text = json.dumps(value, ensure_ascii=False)
    return {"content": [{"type": "text", "text": text}]}


def call_tool(name: str, args: dict) -> dict:
    if name == "platformio_projects":
        return result({"projects": projects()})
    project = valid_project(args.get("project"))
    if name == "platformio_environments":
        return result({"project": str(project), "envs": envs(project)})
    env = str(args.get("env") or "").strip()
    if env not in envs(project):
        raise ValueError(f"unknown environment: {env}")
    if name == "platformio_build":
        return result(run_pio(project, env, ""))
    if name == "platformio_upload":
        if args.get("confirm") is not True:
            raise ValueError("upload requires confirm=true")
        target = "uploadfs" if args.get("fs") else "upload"
        return result(run_pio(project, env, target, args.get("port")))
    raise ValueError(f"unknown tool: {name}")


def main() -> None:
    for line in sys.stdin:
        try:
            request = json.loads(line)
            method = request.get("method")
            if method == "initialize":
                response = {"protocolVersion": "2024-11-05",
                            "capabilities": {"tools": {}},
                            "serverInfo": {"name": "platformio-device-tool", "version": "1.0"}}
            elif method == "notifications/initialized":
                continue
            elif method == "tools/list":
                response = {"tools": TOOLS}
            elif method == "tools/call":
                response = call_tool(request.get("params", {}).get("name", ""),
                                     request.get("params", {}).get("arguments", {}))
            else:
                raise ValueError(f"unsupported method: {method}")
            if "id" in request:
                print(json.dumps({"jsonrpc": "2.0", "id": request["id"], "result": response}), flush=True)
        except Exception as exc:
            if "id" in locals() and "id" in request:
                print(json.dumps({"jsonrpc": "2.0", "id": request["id"],
                                  "error": {"code": -32600, "message": str(exc)}}), flush=True)


if __name__ == "__main__":
    main()
