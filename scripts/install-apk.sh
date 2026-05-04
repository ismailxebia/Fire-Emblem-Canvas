#!/bin/bash
# Build + install APK directly to a connected Android device via ADB.
# Phone must have USB debugging enabled and "Allow this computer" approved.

set -e
cd "$(dirname "$0")/.."

source scripts/android-env.sh

echo "→ Connected devices:"
adb devices
echo ""

echo "→ Building web app..."
npm run build

echo "→ Syncing..."
npx cap sync android

echo "→ Building + installing to device..."
cd android
./gradlew installDebug

echo ""
echo "✓ DONE. App installed. Open it from your home screen (look for 'Fire Emblem Canvas')."
