#!/usr/bin/env bash
PORT=${1:-8085}
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== Serving Shadow Launcher Website on http://localhost:$PORT ==="
python3 -m http.server "$PORT" --directory "$BASE_DIR/website"
