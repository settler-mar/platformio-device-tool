"""Generate static config documentation/editor in docs/config/."""
from __future__ import annotations

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "docs")
TEMPLATE = os.path.join(HERE, "configurator.html")
SCAN_TARGETS = ["config.h", "src/configs", "src/module", "src/base"]
sys.path.insert(0, HERE)
from parser import group_by_file, scan  # noqa: E402


def section(path: str) -> str:
    if path.startswith("src/configs/"):
        return "Профили устройств"
    if path.startswith("src/module/"):
        return "Модули"
    if path.startswith("src/base/"):
        return "Система"
    return "Общие параметры"


def md_cell(value: str) -> str:
    return (value or "").replace("|", "\\|").replace("\n", " ")


def write_json(groups: dict) -> None:
    with open(os.path.join(OUT, "schema.json"), "w", encoding="utf-8") as f:
        json.dump(groups, f, ensure_ascii=False, indent=2, sort_keys=True)


def write_markdown(groups: dict) -> None:
    lines = [
        "# Конфигурация MY_HOME", "",
        "Справочник сгенерирован из исходного кода. Интерактивный редактор: "
        "[`index.html`](index.html). Для обновления выполните "
        "`python3 dev_tool/gen_docs.py`.",
    ]
    current = None
    for path in sorted(groups, key=lambda p: (section(p), p.lower())):
        title = section(path)
        if title != current:
            lines.extend(["", f"## {title}"])
            current = title
        lines.extend(["", f"### `{path}`", "", "| Параметр | Значение | Описание |", "|---|---|---|"])
        for item in groups[path]:
            name = f"~~{item['name']}~~" if item["commented_out"] else item["name"]
            note = " *(по умолчанию выключен)*" if item["commented_out"] else ""
            lines.append(f"| `{name}` | `{md_cell(item['value'])}` | {md_cell(item['comment'])}{note} |")
    with open(os.path.join(OUT, "README.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def write_html(groups: dict) -> None:
    with open(TEMPLATE, "r", encoding="utf-8") as f:
        template = f.read()
    payload = json.dumps(groups, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    with open(os.path.join(OUT, "index.html"), "w", encoding="utf-8") as f:
        f.write(template.replace("__CONFIG_SCHEMA__", payload))


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    groups = group_by_file(scan(REPO, SCAN_TARGETS))
    write_json(groups)
    write_markdown(groups)
    write_html(groups)
    total = sum(len(items) for items in groups.values())
    print(f"wrote {OUT}: {len(groups)} files, {total} defines")


if __name__ == "__main__":
    main()
