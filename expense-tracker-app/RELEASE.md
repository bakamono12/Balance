# Release Guide

## Building and Releasing Balance Expense Tracker

### Version Information
- **Current Version**: 1.2.0
- **Version Code**: 3 (Android)
- **Build Number**: 1.2.0 (iOS)

---

## Local Build (Testing)

### Android APK

```bash
# Method 1: Using build script (Recommended)
./build-apk.sh

# Method 2: Manual build
cd android
./gradlew clean
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Install on Device

```bash
# Via ADB
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Or transfer APK to device and install manually
```

---

## Production Build (EAS Build)

### Prerequisites
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to Expo: `eas login`
3. Configure project: `eas build:configure`

### Build Commands

```bash
# Android APK (for direct download/install)
npm run build:android:apk
# or
eas build --platform android --profile preview

# Android AAB (for Google Play Store)
npm run build:android
# or
eas build --platform android --profile production

# iOS IPA (for App Store)
npm run build:ios
# or
eas build --platform ios --profile production
```

---

## Creating a GitHub Release

### Automated (Recommended)

1. **Update Version Numbers** (already done):
   - `package.json` → version: "1.2.0"
   - `app.json` → version: "1.2.0", versionCode: 3
   - `android/app/build.gradle` → versionName: "1.2.0", versionCode: 3

2. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Release v1.2.0"
   ```

3. **Create and Push Tag**:
   ```bash
   git tag v1.2.0
   git push origin main
   git push origin v1.2.0
   ```

4. **GitHub Actions** will automatically:
   - Build the Android APK
   - Create a GitHub Release
   - Upload the APK as a downloadable asset

### Manual Release

1. Build the APK locally (see above)
2. Go to GitHub → Releases → "Create a new release"
3. Tag: `v1.2.0`
4. Title: `Balance v1.2.0`
5. Upload `app-release.apk`
6. Add release notes
7. Publish

---

## Release Notes Template

```markdown
## Balance Expense Tracker v1.2.0

### ✨ What's New
- 🚀 Performance improvements for transaction list with FlatList
- 🔧 Fixed safe area insets persisting across app resume
- 📱 Added home screen widgets for quick transaction entry
- 👆 Improved swipe-to-reveal edit/delete actions
- 🐛 Bug fixes and stability improvements

### 📥 Download
- **Android APK**: Download from assets below
- **iOS IPA**: Coming soon

### 📋 Installation Instructions

#### Android
1. Download the APK file from assets
2. Enable "Install from Unknown Sources" in Settings → Security
3. Open the downloaded APK to install
4. Launch Balance and start tracking your expenses!

### 💻 System Requirements
- **Android**: 7.0 (API 24) or higher
- **iOS**: 13.0 or higher (coming soon)
- **Storage**: 50 MB minimum

### 🔒 Privacy & Security
- All data stored locally on your device
- No cloud sync or tracking
- Your financial data stays private

### 🐛 Known Issues
- None reported

### 📝 Changelog
See full changelog at: [CHANGELOG.md](CHANGELOG.md)
```

---

## Version Increment Guide

When releasing a new version:

1. **Update Version in All Files**:
   ```bash
   # package.json
   "version": "1.3.0"
   
   # app.json
   "version": "1.3.0"
   "versionCode": 4  # Increment by 1 for Android
   
   # android/app/build.gradle
   versionCode 4
   versionName "1.3.0"
   ```

2. **Update app.json isDev flag**:
   ```json
   "extra": {
     "isDev": false  // false for production
   }
   ```

3. **Follow release process** (see above)

---

## Distribution Links

Once released, users can download from:

### GitHub Releases
```
https://github.com/YOUR_USERNAME/YOUR_REPO/releases
```

### Direct Download Link (after release)
```
https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.2.0/app-release.apk
```

### Update README.md with download badge
```markdown
[![Download APK](https://img.shields.io/github/v/release/YOUR_USERNAME/YOUR_REPO?label=Download%20APK&style=for-the-badge)](https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest)
```

---

## iOS Release (Future)

### App Store Connect
1. Build IPA with EAS: `eas build --platform ios --profile production`
2. Download IPA from EAS
3. Upload to App Store Connect using Transporter
4. Fill in App Store metadata
5. Submit for review

### TestFlight
1. Build with EAS
2. EAS automatically uploads to TestFlight
3. Add testers
4. Distribute

---

## Troubleshooting

### Build Fails
```bash
# Clean everything
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
```

### Signing Issues
- Check `android/app/debug.keystore` exists
- For production, generate release keystore:
  ```bash
  keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias balance -keyalg RSA -keysize 2048 -validity 10000
  ```

### EAS Build Issues
```bash
# Clear EAS cache
eas build:clear-cache

# Check credentials
eas credentials
```

---

## Post-Release Checklist

- [ ] Test APK on multiple Android devices
- [ ] Verify all features work in production build
- [ ] Update README.md with new version
- [ ] Update CHANGELOG.md
- [ ] Announce release on social media/website
- [ ] Monitor crash reports
- [ ] Collect user feedback

---

## Support

For build issues, contact: support@balance-app.com
For contributions, see: CONTRIBUTING.md

