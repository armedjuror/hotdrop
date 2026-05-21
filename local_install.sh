#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_PATH="/usr/local/bin/hotdrop"

echo ""
echo "  Installing HotDrop..."

# Install dependencies if needed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo "  Installing dependencies..."
  cd "$SCRIPT_DIR" && npm install
fi

# Make cli.js executable
chmod +x "$SCRIPT_DIR/cli.js"

# Create symlink in /usr/local/bin
if [ -w "/usr/local/bin" ]; then
  ln -sf "$SCRIPT_DIR/cli.js" "$BIN_PATH"
else
  echo "  (sudo required to install to /usr/local/bin)"
  sudo ln -sf "$SCRIPT_DIR/cli.js" "$BIN_PATH"
fi

echo ""
echo "  ✓ Installed! Commands:"
echo ""
echo "    hotdrop start      — Start the server"
echo "    hotdrop stop       — Stop the server"
echo "    hotdrop status     — Check if running"
echo "    hotdrop logs       — View logs"
echo "    hotdrop uninstall  — Stop and clean up"
echo ""
echo "  Then open http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_LOCAL_IP'):5821 on any device."
echo ""
