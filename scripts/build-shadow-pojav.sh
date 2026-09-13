#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_DIR="$BASE_DIR/launcher"
if [ ! -d "$SOURCE_DIR" ]; then
    SOURCE_DIR="/home/ubuntu/PojavSource"
fi
WEBSITE_DIR="$BASE_DIR/website"

echo "=== Building Shadow Launcher Full Offline Bundle ==="

export ANDROID_HOME=/home/ubuntu/android-sdk

cd "$SOURCE_DIR"
./gradlew :app_shadowlauncher:assembleDebug

OUTPUT_APK="$SOURCE_DIR/app_shadowlauncher/build/outputs/apk/debug/app_shadowlauncher-debug.apk"
TARGET_APK="$WEBSITE_DIR/ShadowLauncher.apk"

if [ -f "$OUTPUT_APK" ]; then
    echo "=== Copying built APK to website downloads ==="
    cp "$OUTPUT_APK" "$TARGET_APK"
    sha256sum "$TARGET_APK" > "$TARGET_APK.sha256"
    echo "=== Deployed APK successfully! ==="
    ls -lh "$TARGET_APK"
    cat "$TARGET_APK.sha256"
else
    echo "Error: Output APK not found at $OUTPUT_APK"
    exit 1
fi
