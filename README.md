# PlatformIO Device Tool

Local web UI for working with PlatformIO device configs, building/flashing firmware and
debugging over serial. Also generates static documentation of every `#define`
in the project.

## Install

Only dependency on top of your PlatformIO toolchain is `pyserial`:

```bash
pip install pyserial
```

## Run the dashboard

From the repo root:

```bash
python3 dev_tool/server.py            # http://127.0.0.1:8765
```

The project selector can switch the dashboard to any sibling PlatformIO
project that contains `platformio.ini`; Build, Upload and Upload FS then run in
that selected project. A different initial project can also be selected with:

```bash
python3 dev_tool/server.py --project ../air_control
```

The repository includes `dev_tool/mcp_server.py` and `.vscode/mcp.json`. The
MCP server exposes project discovery, environment listing, builds and explicit
firmware/filesystem uploads. Upload calls require `confirm=true`.

What it gives you:

- **Configs sidebar** — every file in `src/configs/*.h`. Pick one, edit as a form
  (per `#define`) or as source. **Save** writes it back to disk.
- **Groups sidebar** — macros parsed from `config.h`, `src/base/*.h`,
  `src/module/*.h`, so you can look up what a module exposes without hunting
  through headers. Read-only.
- **Search** filters configs, groups and rows at the same time.
- **Build / Upload / Upload FS / Clean** — runs `pio run -e <env>` with the
  chosen environment; output streams to the right-hand log via SSE.
- **Monitor + serial terminal** — opens the selected port at the chosen baud,
  shows a live log, lets you send lines back. **Reset chip** pulses DTR/RTS so
  you can reboot without unplugging. Monitor is auto-closed around a build or
  upload and reopened afterwards.
- **RU/EN toggle** for the UI labels.
- **New config (+)** copies a minimal template into `src/configs/`.

The server only binds to `127.0.0.1`; it is a dev tool, not a service.

## Static documentation

```bash
python3 dev_tool/gen_docs.py
```

Writes into `docs/`:

- `index.html` — self-contained searchable viewer (open directly in a browser,
  no server needed). It combines the grouped reference with a config editor:
  choose an existing profile, toggle or edit macros, import another `.h`, then
  copy or download the generated config.
- `schema.json` — raw parsed data, useful in CI or for other tooling.
- `README.md` — Russian grouped tables of every macro for GitHub rendering.

Regenerate after you add or rename configs. The files are intended to be
committed so the repo stays browsable.

## How parsing works

The parser (`parser.py`) picks up every `#define` and attaches:

- the value (if any)
- an inline `// comment` on the same line, or
- consecutive `//` / `/* */` comments immediately above the define
- whether the define sits inside a `#ifndef NAME` guard
- whether the line itself is commented out (`// #define ...`), so you can toggle
  features without losing them

It does not evaluate `#if`s — it is a reference view, not a preprocessor.

## Safety

- Only files under `src/configs/` are writable through the HTTP API; path
  traversal is rejected.
- `pio` is executed with explicit argument lists (no shell), environment and
  port come from `platformio.ini` / `/dev/tty*` globs.
- The build and upload tasks are serialised — a second request while one is
  running returns `409`, it will not fork a parallel `pio`.
