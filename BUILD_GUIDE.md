# AgriMart Android APK Build Guide

## Troubleshooting White Screen on APK Launch

### Why White Screen Occurs
- Firebase Messaging methods not available at runtime
- Dynamic routes not properly compiled  
- Initialization errors not visible in production build
- Splash screen hidden before app is ready

### Solutions Applied ✅

#### 1. **Fixed Firebase Messaging Initialization**
- Direct import of messaging module from `@react-native-firebase/messaging`
- Proper error handling for unavailable methods
- POST_NOTIFICATIONS permission added to AndroidManifest.xml
- Expo notification permissions request before Firebase token retrieval

#### 2. **Improved App Startup Sequence**
- Firebase initialization completes before splash screen hides
- All critical services wait for Firebase to be ready
- Error handling prevents crashes from blocking app display

#### 3. **Dynamic Routes Configuration**
- All dynamic routes ([id].tsx files) properly structured
- expo-router properly configured in metro.config.js
- Routes properly declared in Stack.Screen

---

## Building Release APK

### Prerequisites
```bash
# Ensure JAVA_HOME is set correctly
set JAVA_HOME=C:\Program Files\Java\jdk-17

# Verify Android SDK is installed
$env:ANDROID_HOME  # Should be C:\Users\<user>\AppData\Local\Android\Sdk
```

### Option 1: Using npm Script (Recommended)
```bash
cd d:\Capstone_2025
npm run build:android:release
```

### Option 2: Manual Build Steps
```bash
# Step 1: Copy google-services.json to correct location
node copy-google-services.js

# Step 2: Clean and prebuild
npm run prebuild:clean

# Step 3: Build Release APK
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64
cd ..
```

### Option 3: Using Windows Batch Script
```bash
cd d:\Capstone_2025
build-release-apk.bat
```

---

## Build Output
After successful build, APK files will be at:
```
android/app/build/outputs/apk/release/app-release.apk (unsigned)
android/app/build/outputs/apk/debug/app-debug.apk (debug)
```

---

## Debugging White Screen Issues

### 1. **Test on Actual Device First**
```bash
# Build debug APK first (faster iteration)
npm run build:android

# Install and run with logcat
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb logcat *:S Hermes:V ReactNative:V ReactNativeJS:V
```

### 2. **Check Common Issues**

#### Issue: "No Firebase App '[DEFAULT]' has been created"
**Solution**: Verify google-services.json is at `android/app/google-services.json`
```bash
# Test copy script
node copy-google-services.js
ls -la android/app/google-services.json
```

#### Issue: "Dynamic route not found"
**Solution**: Verify route files exist
```bash
ls -la app/(tabs)/farmer/buy-request-management/
# Should show: index.tsx, [id].tsx, _layout.tsx
```

#### Issue: "messaging.onMessage is not a function"
**Solution**: Expected warning, won't prevent app from running. All foreground notification handling works via background handler.

### 3. **Run Release APK Locally**
```bash
# Install release APK on emulator
adb install -r android/app/build/outputs/apk/release/app-release.apk

# View logs
adb logcat -s ReactNativeJS
```

---

## Firebase Configuration for Release Build

### 1. Verify google-services.json
- Located at: `android/app/google-services.json`
- Contains correct package name: `com.agrimart.shop`
- Build Gradle plugin automatically uses it during release build

### 2. Build Variant Configurations
Both debug and release builds use the same Firebase configuration:
- `android/app/build.gradle` configures both variants
- `google-services.json` is applied to both

### 3. ProGuard Rules
If shrinking is enabled, add to `android/app/proguard-rules.pro`:
```
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
```

---

## Testing Checklist Before Release

- [ ] App launches without white screen
- [ ] Firebase initializes successfully
- [ ] Login works correctly
- [ ] SignalR connects to backend
- [ ] Notification permissions dialog appears
- [ ] Push notification can be received (test via backend)
- [ ] App doesn't crash on background/foreground transitions
- [ ] All dynamic routes load correctly

---

## Environment Variables

### Required for Build
```
JAVA_HOME=C:\Program Files\Java\jdk-17
ANDROID_HOME=C:\Users\<username>\AppData\Local\Android\Sdk
```

### App Configuration
- `EXPO_PUBLIC_API_URL=https://gateway.a-379.store`
- Set in `.env` file at project root

---

## Build Times
- **Debug APK**: ~2-3 minutes
- **Release APK**: ~5-8 minutes (includes ProGuard minification)

---

## Troubleshooting Build Failures

### Error: "Port 8081 is being used by another process"
```bash
# Use port 8082 instead (press 'y' when prompted)
# Or kill the process:
lsof -i :8081  # macOS/Linux
netstat -ano | findstr :8081  # Windows - note the PID
taskkill /PID <PID> /F  # Windows
```

### Error: "JAVA_HOME is set to an invalid directory"
```bash
# Fix the path:
set JAVA_HOME=C:\Program Files\Java\jdk-17
# Verify:
%JAVA_HOME%\bin\java -version
```

### Error: "google-services.json not found"
```bash
# The copy script should run automatically, but verify:
node copy-google-services.js
# If still missing, manually copy:
copy google-services.json android/app/
```

---

## Performance Optimization

### For Production Release
1. **Enable ProGuard minification** (default for release)
2. **Use optimized architecture**: `arm64-v8a` (most devices)
3. **Split APK by architecture** to reduce APK size:
```gradle
# In android/app/build.gradle
splits {
  abi {
    enable true
    include 'arm64-v8a'
    universalApk true
  }
}
```

---

## Next Steps

1. ✅ Firebase Messaging properly configured
2. ✅ Notification permissions properly requested
3. ✅ White screen fix applied (wait for Firebase before showing UI)
4. ⏭️ Build release APK: `npm run build:android:release`
5. ⏭️ Test on actual device
6. ⏭️ Test push notifications end-to-end

