Import("env")

import re
import subprocess


def check_firmware_size(target, source, env):
    elf_path = str(target[0])
    size_tool = env.subst("$SIZETOOL")
    result = subprocess.run(
        [size_tool, "-A", "-d", elf_path],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print("Warning: firmware budget check could not read the ELF file")
        return

    pattern = re.compile(env.get("SIZEPROGREGEXP", ""))
    program_size = 0
    for line in result.stdout.splitlines():
        match = pattern.search(line.strip())
        if match:
            program_size += sum(int(value) for value in match.groups())

    configured_maximum = env.GetProjectOption("custom_flash_max_size", "")
    maximum_size = int(
        configured_maximum or env.BoardConfig().get("upload.maximum_size", 0)
    )
    if not program_size or not maximum_size:
        return

    used_percent = program_size * 100.0 / maximum_size
    warning_percent = float(env.GetProjectOption("custom_flash_warning_percent"))
    error_percent = float(env.GetProjectOption("custom_flash_error_percent"))
    print(
        "Flash budget: "
        f"{used_percent:.1f}% used ({program_size} of {maximum_size} bytes)"
    )

    if used_percent >= error_percent:
        print(
            "Error: Flash budget exceeded: "
            f"{used_percent:.1f}% used, limit is {error_percent:.1f}%"
        )
        env.Exit(1)
    if used_percent >= warning_percent:
        print(
            "Warning: Flash budget is low: "
            f"{used_percent:.1f}% used, warning starts at {warning_percent:.1f}%"
        )


env.AddPostAction("$BUILD_DIR/${PROGNAME}.elf", check_firmware_size)
