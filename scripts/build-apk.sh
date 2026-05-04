#!/bin/bash
# Build a debug APK end-to-end:
#   1. Build the web app (vite)
#   2. Sync to Capacitor Android project
#   3. Run Gradle assembleDebug
#
# Output: android/app/build/outputs/apk/debug/app-debug.apk

set -e
cd "$(dirname "$0")/.."

source scripts/android-env.sh

echo "→ Building web app..."
npm run build

echo "→ Syncing to Capacitor android project..."
npx cap sync android

echo "→ Running Gradle assembleDebug (first time may take ~10 min to download deps)..."
cd android
./gradlew assembleDebug

APK_PATH="$(pwd)/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "✓ DONE. APK created at:"
echo "  $APK_PATH"
echo ""
ls -lh "$APK_PATH" 2>/dev/null || echo "(file not found — check Gradle output above for errors)"
