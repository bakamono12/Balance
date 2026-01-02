# 🚀 Quick Reference - EAS Workflows

## ⚡ Quick Push Commands

```bash
# Option 1: Use the script (Recommended)
./scripts/push-to-build.sh

# Option 2: Manual
git add .
git commit -m "ci: add EAS workflows"
git push origin v1
```

## 🔍 Monitor Builds

```bash
# List builds
eas build:list

# View build details
eas build:view <build-id>

# Download build
eas build:download --build-id <id>
```

## 📦 Update Versions

```bash
# Update version consistently across all files
./scripts/update-version.sh <version> <android-code>

# Example
./scripts/update-version.sh 1.3.0 4
```

## ✅ Verify Before Push

```bash
# Run verification
./scripts/final-check.sh

# Or detailed verification
./scripts/verify-before-push.sh
```

## 🌐 Web Dashboard

**Expo Dashboard**: https://expo.dev
- View builds
- Download artifacts
- Check build logs
- Monitor progress

## 📋 Current Setup

```
Version: 1.2.0
Branch: v1
Workflows: ✅ Configured
Notification Icon: ✅ Fixed
Auto-increment: ✅ Enabled
```

## 🎯 Workflow Triggers

- **v1 branch** → Preview builds (APK + iOS)
- **main branch** → Production builds (AAB + IPA)
- **version tags** → Production builds

## 🆘 Quick Fixes

### Version Mismatch
```bash
./scripts/update-version.sh 1.2.0 3
```

### Check EAS Status
```bash
eas whoami
eas account:view
eas project:info
```

### Build Locally (Test)
```bash
cd expense-tracker-app
eas build --platform android --profile preview --local
```

## 📚 Documentation Files

- `EAS_WORKFLOWS_GUIDE.md` - Full guide
- `READY_TO_PUSH.md` - Setup checklist
- `.eas/workflows/build.yml` - Dev workflow
- `.eas/workflows/production.yml` - Prod workflow

---

**Status**: ✅ Ready to push!  
**Next**: Run `./scripts/push-to-build.sh`

