#!/bin/bash
# Build the web app, sync to native, and open the Android project in Android Studio.

set -e
cd "$(dirname "$0")/.."

source scripts/android-env.sh

echo "→ Building web app..."
npm run build

echo "→ Syncing..."
npx cap sync android

echo "→ Opening Android Studio..."
npx cap open android
