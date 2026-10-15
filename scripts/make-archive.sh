#!/bin/sh
# Builds the submission zip: sources, docs, mock kit, lock files — no installed or generated files.
# Usage: npm run archive  →  ../rn-pdf-parser.zip (or pass a target path)
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="$(basename "$ROOT")"
TARGET="${1:-$(dirname "$ROOT")/$NAME.zip}"

rm -f "$TARGET"
cd "$(dirname "$ROOT")"

zip -rq "$TARGET" "$NAME" \
  -x "$NAME/node_modules/*" \
  -x "$NAME/ios/Pods/*" "$NAME/ios/build/*" "*/xcuserdata/*" "*/DerivedData/*" \
  -x "$NAME/android/.gradle/*" "$NAME/android/.kotlin/*" "$NAME/android/build/*" \
  -x "$NAME/android/app/build/*" "$NAME/android/app/.cxx/*" "$NAME/android/local.properties" \
  -x "$NAME/vendor/bundle/*" "$NAME/coverage/*" \
  -x "$NAME/.env" "$NAME/.git/*" "$NAME/.idea/*" "$NAME/.vscode/*" \
  -x "$NAME/mock-server/.mock-state.json" "$NAME/mock-server/fixtures/oversize.csv" \
  -x "$NAME/ios/.xcode.env.local" "*.DS_Store" "*/.metro-health-check*"

echo "Created $TARGET ($(du -h "$TARGET" | cut -f1))"
