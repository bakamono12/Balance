#!/bin/bash

# Balance Expense Tracker - Release Helper Script
# Automates the version bump and release process

set -e

echo "🚀 Balance Release Helper"
echo "=========================="

# Check if version argument provided
if [ -z "$1" ]; then
    echo "Usage: ./release.sh <version>"
    echo "Example: ./release.sh 1.3.0"
    exit 1
fi

NEW_VERSION=$1
echo "📦 Preparing release for version: $NEW_VERSION"

# Extract version components
IFS='.' read -r -a VERSION_PARTS <<< "$NEW_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# Calculate new version code (simple incrementing)
CURRENT_VERSION_CODE=$(grep "versionCode" android/app/build.gradle | head -1 | grep -o '[0-9]*')
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))

echo "🔢 New version code: $NEW_VERSION_CODE"

# Update package.json
echo "📝 Updating package.json..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update app.json
echo "📝 Updating app.json..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" app.json
sed -i "s/\"versionCode\": [0-9]*/\"versionCode\": $NEW_VERSION_CODE/" app.json
sed -i "s/\"buildNumber\": \"[^\"]*\"/\"buildNumber\": \"$NEW_VERSION\"/" app.json

# Update android/app/build.gradle
echo "📝 Updating android/app/build.gradle..."
sed -i "s/versionCode [0-9]*/versionCode $NEW_VERSION_CODE/" android/app/build.gradle
sed -i "s/versionName \"[^\"]*\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle

echo ""
echo "✅ Version updated to $NEW_VERSION (code: $NEW_VERSION_CODE)"
echo ""
echo "Next steps:"
echo "1. Update CHANGELOG.md with release notes"
echo "2. Review changes: git diff"
echo "3. Commit: git commit -am \"Release v$NEW_VERSION\""
echo "4. Tag: git tag v$NEW_VERSION"
echo "5. Push: git push origin main --tags"
echo ""
echo "GitHub Actions will automatically build and create the release!"

