#!/bin/bash

# Balance Expense Tracker - Build Script
# This script builds the Android APK for local testing

set -e

echo "🏗️  Building Balance Expense Tracker v1.2.0"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build Android APK
echo "🤖 Building Android APK..."
cd android
./gradlew clean
./gradlew assembleRelease

# Check if build succeeded
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    APK_SIZE=$(du -h app/build/outputs/apk/release/app-release.apk | cut -f1)
    echo ""
    echo "✅ Build successful!"
    echo "📱 APK location: android/app/build/outputs/apk/release/app-release.apk"
    echo "📊 APK size: $APK_SIZE"
    echo ""
    echo "To install on device:"
    echo "  adb install -r app/build/outputs/apk/release/app-release.apk"
else
    echo "❌ Build failed!"
    exit 1
fi

