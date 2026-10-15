#!/bin/sh
# Starts an Android emulator (if no device is connected), waits until it has booted
# and forwards the mock port. No Android Studio needed.
#   npm run android:emulator                      — first available emulator
#   ANDROID_AVD=Pixel_8_Pro npm run android:emulator — a specific one
set -e

SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
EMULATOR="$SDK/emulator/emulator"
ADB="$SDK/platform-tools/adb"
MOCK_PORT=8787

if [ -n "$("$ADB" devices | sed '1d' | grep -w 'device')" ]; then
  echo "Device already connected — skipping emulator start."
else
  AVD="${ANDROID_AVD:-$("$EMULATOR" -list-avds | head -n 1)}"

  if [ -z "$AVD" ]; then
    echo "No Android emulator found. Create one: Android Studio › Device Manager, or avdmanager." >&2
    exit 1
  fi

  echo "Starting emulator: $AVD"
  "$EMULATOR" -avd "$AVD" -no-snapshot-save > /dev/null 2>&1 &

  "$ADB" wait-for-device
  printf "Waiting for boot"
  until [ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    printf "."
    sleep 2
  done
  echo " booted."
fi

"$ADB" reverse tcp:$MOCK_PORT tcp:$MOCK_PORT
echo "Mock port $MOCK_PORT forwarded. Next: npm run android"
