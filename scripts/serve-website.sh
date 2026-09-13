#!/usr/bin/env bash
PORT=${1:-8080}
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== Serving Shadow Launcher Website & Demo on http://localhost:$PORT ==="
python3 -m http.server "$PORT" --directory "$BASE_DIR/website"
