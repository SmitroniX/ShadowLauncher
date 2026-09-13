#!/usr/bin/env bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$BASE_DIR/android"
BUILD_DIR="$ANDROID_DIR/build"
ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"

echo "=== Building Shadow Launcher APK ==="

# Clean build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/gen" "$BUILD_DIR/obj" "$BUILD_DIR/apk"

# Step 1: Generate R.java with AAPT
echo "[1/6] Generating R.java..."
aapt package -f -m \
    -J "$BUILD_DIR/gen" \
    -M "$ANDROID_DIR/AndroidManifest.xml" \
    -S "$ANDROID_DIR/res" \
    -I "$ANDROID_JAR"

# Step 2: Compile Java sources with javac
echo "[2/6] Compiling Java code..."
javac -source 8 -target 8 \
    -bootclasspath "$ANDROID_JAR" \
    -cp "$BUILD_DIR/gen:$ANDROID_DIR/src" \
    -d "$BUILD_DIR/obj" \
    $(find "$BUILD_DIR/gen" "$ANDROID_DIR/src" -name "*.java")

# Step 3: Convert bytecode to classes.dex with dx
echo "[3/6] Converting to Dalvik bytecode (classes.dex)..."
dx --dex --output="$BUILD_DIR/apk/classes.dex" "$BUILD_DIR/obj"

# Step 4: Package resources and assets with AAPT
echo "[4/6] Packaging APK resources and assets..."
aapt package -f \
    -M "$ANDROID_DIR/AndroidManifest.xml" \
    -S "$ANDROID_DIR/res" \
    -A "$ANDROID_DIR/assets" \
    -I "$ANDROID_JAR" \
    -F "$BUILD_DIR/ShadowLauncher.unsigned.apk"

# Step 5: Add classes.dex into APK
cd "$BUILD_DIR/apk"
aapt add "$BUILD_DIR/ShadowLauncher.unsigned.apk" classes.dex
cd "$BASE_DIR"

# Step 6: Align and sign APK
echo "[5/6] Zipaligning APK..."
zipalign -f -p 4 "$BUILD_DIR/ShadowLauncher.unsigned.apk" "$BUILD_DIR/ShadowLauncher.aligned.apk"

# Generate debug keystore if not present
KEYSTORE="$BUILD_DIR/shadow_debug.keystore"
if [ ! -f "$KEYSTORE" ]; then
    keytool -genkey -v -keystore "$KEYSTORE" \
        -alias shadow_key -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass shadowpass -keypass shadowpass \
        -dname "CN=ShadowLauncher, OU=Gaming, O=ShadowLauncher, L=Earth, ST=State, C=US"
fi

echo "[6/6] Signing APK with apksigner..."
apksigner sign --ks "$KEYSTORE" \
    --ks-key-alias shadow_key \
    --ks-pass pass:shadowpass \
    --key-pass pass:shadowpass \
    --out "$BUILD_DIR/ShadowLauncher.apk" \
    "$BUILD_DIR/ShadowLauncher.aligned.apk"

# Verify signature
apksigner verify --verbose "$BUILD_DIR/ShadowLauncher.apk"

# Copy to website downloads
cp "$BUILD_DIR/ShadowLauncher.apk" "$BASE_DIR/website/ShadowLauncher.apk"

echo "=== Shadow Launcher APK Build Successful! ==="
ls -lh "$BUILD_DIR/ShadowLauncher.apk" "$BASE_DIR/website/ShadowLauncher.apk"
sha256sum "$BASE_DIR/website/ShadowLauncher.apk" > "$BASE_DIR/website/ShadowLauncher.apk.sha256"
cat "$BASE_DIR/website/ShadowLauncher.apk.sha256"
