#!/bin/sh
# Copies the kit fixtures to the emulator/device Downloads folder so the system picker can see them.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FIXTURES="$ROOT/mock-server/fixtures"

[ -f "$FIXTURES/oversize.csv" ] || npm --prefix "$ROOT/mock-server" run fixtures:oversize

for FILE in statement.csv statement.pdf spoofed.pdf oversize.csv; do
  adb push "$FIXTURES/$FILE" "/sdcard/Download/$FILE"
done

# Make the files visible to MediaStore / DocumentsUI immediately
adb shell content call --method scan_volume --uri content://media --arg external_primary >/dev/null 2>&1 || true
adb reverse tcp:8787 tcp:8787
echo "Fixtures pushed to /sdcard/Download and port 8787 reversed."
