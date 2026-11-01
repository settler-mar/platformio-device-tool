"""Inject a doc header into every src/module/*.h that lacks one.

Rules:
  * Skip if the file already has a leading comment >= 20 chars (preserved as-is).
  * Otherwise insert a `/** ... */` block right after the `#define <guard>_H`
    line, listing the module's enable macro, parameters (from module_schema),
    and dependencies.
  * For modules whose hardware/role is well-known, a one-line summary is added
    from HARDWARE_HINTS; others get the structured block without prose.

Idempotent: a second run skips files that already carry the inserted block
(detected by a marker line).
"""
from __future__ import annotations

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
sys.path.insert(0, HERE)
from module_schema import inspect  # noqa: E402

MOD_DIR = os.path.join(REPO, "src", "module")
MARKER = "@generated-doc"

# One-liners for modules whose hardware/role is unambiguous.
HARDWARE_HINTS = {
    "ads1115":     "16-bit, 4-channel I2C ADC (Texas Instruments ADS1115/ADS1015).",
    "AIR_TH":      "AHTx temperature + humidity sensor (I2C).",
    "analog":      "Direct ESP ADC input (one or more pins).",
    "bh1750":      "BH1750 ambient-light sensor (I2C, lux).",
    "bme280":      "BME280 temperature / humidity / pressure sensor (I2C).",
    "bmp180":      "BMP180 temperature + pressure sensor (I2C).",
    "buttons":     "Short-press button inputs.",
    "buttons_long":"Long-press / hold button inputs.",
    "ccs811":      "CCS811 digital gas sensor (eCO2, TVOC).",
    "counter":     "Interrupt-driven pulse counter → stored value + rate.",
    "crone":       "Cron-expression scheduler, publishes on a timetable.",
    "dht":         "DHT11 / DHT22 temperature + humidity sensor (1-wire).",
    "dimer":       "AC phase-cut dimmer output.",
    "encoderMy":   "Rotary encoder input.",
    "ENS160":      "ENS160 air-quality sensor (eCO2, TVOC, AQI).",
    "fpm_control": "FPM10a optical fingerprint sensor (UART).",
    "GP2Y10":      "Sharp GP2Y10 optical dust sensor.",
    "gpio_exp":    "I2C GPIO expanders (PCF8574 / MCP23017 / PCA9555).",
    "ha_discovery":"Home Assistant MQTT discovery payloads.",
    "INA3221_":    "INA3221 3-channel voltage/current monitor (I2C).",
    "JBD_BMS_":    "JBD-style BMS over UART.",
    "json":        "Expose JSON structures as addressable values.",
    "kws_306l":    "KWS-306L AC multi-meter over RS485/Modbus.",
    "logs":        "In-RAM/FS log of local variable changes.",
    "MCP4017":     "MCP4017 I2C digital potentiometer.",
    "modes":       "Per-page / per-mode variable groups.",
    "motor_step":  "Stepper motor (GyverStepper).",
    "my_485":      "MY_HOME RS-485 bus master (air-control / curtains).",
    "pca9685_":    "PCA9685 16-ch PWM driver (I2C).",
    "pid":         "PID loop (process variable → actuator).",
    "progressbar": "Progress-bar module.",
    "radio_":      "Si4703 / TEA FM radio tuner.",
    "rc433":       "433 MHz RF transmit/receive.",
    "rdm6300":     "RDM6300 125 kHz RFID reader (UART).",
    "resender":    "Forwards messages between addresses with conditions / logic.",
    "roller_binds":"Roller-blind binds (buttons ↔ roller logic).",
    "screen":      "OLED/LCD screen rendering.",
    "servo":       "Servo motor output (ServoSmooth).",
    "tac11xx":     "TAC-11XX series RS-485 meter.",
    "termostat":   "Hysteresis thermostat (setpoint + sensor → relay).",
    "test":        "Diagnostic test harness.",
    "time":        "NTP-synced wall-clock time.",
    "tm1637":      "TM1637 4-digit 7-segment display.",
    "vl53l0x":     "VL53L0X time-of-flight distance sensor (I2C).",
    "watch_dog":   "Software/hardware watchdog.",
    "ws2812":      "WS2812B / NeoPixel LED strip.",
    "ws_didgi":    "7-segment digit renderer on WS2812 strip.",
    "ws_efect":    "WS2812 strip effects.",
    "ws_indicator":"Status indicator on WS2812 strip.",
}


HEADER_RE = re.compile(r"^\s*#\s*define\s+([A-Z0-9_]+_H)\b", re.M)


def leading_comment(lines: list[str]) -> str:
    i = 0
    while i < len(lines) and (
        not lines[i].strip()
        or lines[i].strip().startswith(("#ifndef", "#define", "#pragma", "#include"))
    ):
        i += 1
    if i >= len(lines):
        return ""
    s = lines[i].lstrip()
    if s.startswith("/*"):
        buf, j = [], i
        while j < len(lines):
            t = lines[j].strip().replace("/*", "").replace("*/", "").lstrip("* ").rstrip()
            if t: buf.append(t)
            if "*/" in lines[j]: break
            j += 1
        return " ".join(buf).strip()
    if s.startswith("//"):
        out = []
        while i < len(lines) and lines[i].lstrip().startswith("//"):
            out.append(lines[i].lstrip().lstrip("/").strip())
            i += 1
        return " ".join(out).strip()
    return ""


def build_doc(name: str, info: dict, prior: str) -> str:
    desc = HARDWARE_HINTS.get(name) or ""
    lines = [f" * {name} module." + ("  " + desc if desc else "")]
    if prior:
        lines.append(" *")
        for ln in prior.splitlines():
            lines.append(f" * {ln.strip()}")
    if info["enable"] or info["params"]:
        lines.append(" *")
        lines.append(" * Parameters:")
        if info["enable"]:
            lines.append(f" *   {info['enable']:28s} — enables this module (required)")
        for p in info["params"]:
            default = f" (default: {p['default']})" if p["default"] else ""
            lines.append(f" *   {p['name']:28s} — {p['type']}{default} (optional)")
    if info["deps"]:
        lines.append(" *")
        lines.append(" * Dependencies: " + ", ".join(info["deps"]))
    lines.append(" *")
    lines.append(f" * {MARKER} — regenerate with `python3 dev_tool/add_module_docs.py`")
    return "/**\n" + "\n".join(lines) + "\n */\n"


def process(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        src = f.read()
    if MARKER in src:
        return "skip-already"
    rel = os.path.relpath(path, REPO).replace(os.sep, "/")
    info = inspect(path)
    info["path"] = rel

    m = HEADER_RE.search(src)
    if m:
        insert_at = m.end()
        while insert_at < len(src) and src[insert_at] == "\n":
            insert_at += 1
    else:
        insert_at = 0  # no include guard — put doc at the very top

    lines_after = src[insert_at:].splitlines()
    prior = leading_comment(lines_after)
    doc = build_doc(info["name"], info, prior)

    # If we captured prior comment, remove it from the body so we don't duplicate.
    if prior:
        # strip the leading comment block from src starting at insert_at
        rest = src[insert_at:]
        stripped = strip_leading_comment(rest)
        new_src = src[:insert_at] + "\n" + doc + "\n" + stripped
    else:
        new_src = src[:insert_at] + "\n" + doc + "\n" + src[insert_at:]
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(new_src)
    return "wrote"


def strip_leading_comment(text: str) -> str:
    lines = text.splitlines(keepends=True)
    i = 0
    # Skip leading blanks + preprocessor boilerplate (we need to preserve those).
    kept_front = []
    while i < len(lines) and (not lines[i].strip() or lines[i].strip().startswith(("#ifndef","#define","#pragma","#include"))):
        kept_front.append(lines[i]); i += 1
    if i >= len(lines):
        return text
    s = lines[i].lstrip()
    if s.startswith("/*"):
        while i < len(lines):
            if "*/" in lines[i]: i += 1; break
            i += 1
    elif s.startswith("//"):
        while i < len(lines) and lines[i].lstrip().startswith("//"):
            i += 1
    else:
        return text
    return "".join(kept_front) + "".join(lines[i:])


def main() -> None:
    counts = {"wrote": 0, "skip-already": 0, "skip-no-guard": 0}
    for fn in sorted(os.listdir(MOD_DIR)):
        if not fn.endswith(".h"):
            continue
        status = process(os.path.join(MOD_DIR, fn))
        counts[status] = counts.get(status, 0) + 1
        print(f"{status:16s} {fn}")
    print("\nSummary:", counts)


if __name__ == "__main__":
    main()
