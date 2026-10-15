#!/bin/sh
# Copies the kit fixtures into the booted simulator's Files app ("On My iPhone/rn-pdf-parser-fixtures").
# Set IOS_UDID to target one simulator when several are booted.
# `simctl addmedia` only handles photos/videos, so files go into the Files app local storage directly.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FIXTURES="$ROOT/mock-server/fixtures"
DEVICE="${IOS_UDID:-booted}"

[ -f "$FIXTURES/oversize.csv" ] || npm --prefix "$ROOT/mock-server" run fixtures:oversize

GROUP_DIR="$(xcrun simctl get_app_container "$DEVICE" com.apple.DocumentsApp groups | grep 'FileProvider.LocalStorage' | cut -f2)"

if [ -z "$GROUP_DIR" ]; then
  echo "Open the Files app once on the booted simulator, then rerun." >&2
  exit 1
fi

DEST="$GROUP_DIR/File Provider Storage/rn-pdf-parser-fixtures"
mkdir -p "$DEST"
cp "$FIXTURES/statement.csv" "$FIXTURES/statement.pdf" "$FIXTURES/spoofed.pdf" "$FIXTURES/oversize.csv" "$DEST/"
echo "Fixtures copied to: $DEST"
