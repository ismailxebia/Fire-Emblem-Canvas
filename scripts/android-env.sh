#!/bin/bash
# Sourced by other build scripts. Sets the env vars Gradle/Capacitor need
# WITHOUT touching the user's ~/.zshrc.

# Android SDK (default location for Android Studio on macOS)
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

# Java bundled with Android Studio
if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
fi

# Add tools to PATH
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
