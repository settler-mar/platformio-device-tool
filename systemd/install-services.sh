#!/usr/bin/env bash
set -euo pipefail

project_root="/mnt/Files/PlatformIO/Projects/platformio-device-tool"
scanner_root="/mnt/Files/dev/Receipt_scanner"
user_unit_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"

mkdir -p "$user_unit_dir"
install -m 0644 "$project_root/systemd/platformio-device-tool.service" \
  "$user_unit_dir/platformio-device-tool.service"
install -m 0644 "$scanner_root/systemd/receipt-scanner.service" \
  "$user_unit_dir/receipt-scanner.service"

systemctl --user daemon-reload
systemctl --user enable --now platformio-device-tool.service receipt-scanner.service

# User services normally start at login. Linger keeps them available after boot
# even before the graphical session is opened.
loginctl enable-linger "$USER" 2>/dev/null || \
  echo "Не удалось включить linger автоматически; сервисы будут стартовать при входе пользователя."

echo "Сервисы включены. Статус:"
systemctl --user --no-pager --full status platformio-device-tool.service receipt-scanner.service || true
