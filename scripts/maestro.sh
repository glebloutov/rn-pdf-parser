#!/bin/sh
# Runs Maestro from PATH, or from the official installer location (~/.maestro/bin) when PATH isn't updated yet.
if command -v maestro >/dev/null 2>&1; then
  exec maestro "$@"
fi

if [ -x "$HOME/.maestro/bin/maestro" ]; then
  exec "$HOME/.maestro/bin/maestro" "$@"
fi

echo "Maestro CLI not found. Install it: curl -fsSL https://get.maestro.mobile.dev | bash" >&2
exit 127
