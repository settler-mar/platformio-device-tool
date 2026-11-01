"""Parse #define macros + preceding/trailing comments from .h files.

Produces entries like:
    {"name": "FOO", "value": "42", "comment": "...", "file": "...",
     "line": 10, "guarded": True, "active": True}

`active` is False when the define is inside a `//` or `/* */` block comment line.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass, asdict
from typing import Iterable


DEFINE_RE = re.compile(
    r"""^(?P<lead>\s*)
        (?P<commented>//\s*)?
        \#\s*define\s+
        (?P<name>[A-Za-z_][A-Za-z0-9_]*)
        (?:\s+(?P<rest>.*?))?
        \s*$
    """,
    re.VERBOSE,
)

IFNDEF_RE = re.compile(r"^\s*#\s*ifndef\s+([A-Za-z_][A-Za-z0-9_]*)")


def _split_value_comment(rest: str) -> tuple[str, str]:
    """Split an inline // comment without breaking slashes inside strings."""
    quote = ""
    escaped = False
    for i, char in enumerate(rest):
        if escaped:
            escaped = False
            continue
        if char == "\\" and quote:
            escaped = True
            continue
        if char in ('"', "'"):
            quote = "" if quote == char else (char if not quote else quote)
            continue
        if not quote and char == "/" and i + 1 < len(rest) and rest[i + 1] == "/":
            return rest[:i].rstrip(), rest[i + 2 :].strip()
    return rest.strip(), ""


@dataclass
class Define:
    name: str
    value: str
    comment: str
    file: str
    line: int
    commented_out: bool
    guarded: bool

    def to_dict(self) -> dict:
        return asdict(self)


def _collect_preceding_comment(lines: list[str], idx: int) -> str:
    """Walk upward collecting // and /* */ comments immediately above line idx."""
    out: list[str] = []
    i = idx - 1
    while i >= 0:
        line = lines[i].rstrip()
        stripped = line.strip()
        if not stripped:
            break
        if stripped.startswith("//"):
            out.append(stripped.lstrip("/").strip())
            i -= 1
            continue
        if stripped.endswith("*/"):
            # multi-line /* ... */ block
            block = [stripped[: -2].lstrip("*/ ").rstrip()]
            i -= 1
            while i >= 0 and "/*" not in lines[i]:
                block.append(lines[i].strip().lstrip("*").strip())
                i -= 1
            if i >= 0:
                last = lines[i].strip()
                last = last[last.index("/*") + 2 :].strip()
                block.append(last)
                i -= 1
            out.extend(reversed([b for b in block if b]))
            continue
        break
    return " ".join(reversed([c for c in out if c])).strip()


def parse_file(path: str, repo_root: str) -> list[Define]:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        src = f.read()
    lines = src.splitlines()
    rel = os.path.relpath(path, repo_root).replace(os.sep, "/")

    # Find lines guarded by a preceding `#ifndef NAME` block.
    guarded_names: set[str] = set()
    for i, ln in enumerate(lines):
        m = IFNDEF_RE.match(ln)
        if m:
            guarded_names.add(m.group(1))

    out: list[Define] = []
    for i, ln in enumerate(lines):
        # Skip pure comment lines first, but still capture "// #define X ..." as commented_out.
        m = DEFINE_RE.match(ln)
        if not m:
            continue
        name = m.group("name")
        value, trail = _split_value_comment(m.group("rest") or "")
        commented = bool(m.group("commented"))
        comment = trail or _collect_preceding_comment(lines, i)
        out.append(
            Define(
                name=name,
                value=value,
                comment=comment,
                file=rel,
                line=i + 1,
                commented_out=commented,
                guarded=name in guarded_names,
            )
        )
    return out


def scan(repo_root: str, targets: Iterable[str]) -> list[Define]:
    result: list[Define] = []
    for rel in targets:
        full = os.path.join(repo_root, rel)
        if os.path.isdir(full):
            for root, _, files in os.walk(full):
                for fn in files:
                    if fn.endswith(".h") or fn.endswith(".hpp"):
                        result.extend(parse_file(os.path.join(root, fn), repo_root))
        elif os.path.isfile(full):
            result.extend(parse_file(full, repo_root))
    return result


def group_by_file(defs: list[Define]) -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = {}
    for d in defs:
        groups.setdefault(d.file, []).append(d.to_dict())
    return groups


if __name__ == "__main__":
    import json
    import sys

    root = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    defs = scan(root, ["config.h", "src/configs", "src/module", "src/base"])
    print(json.dumps(group_by_file(defs), ensure_ascii=False, indent=2))
