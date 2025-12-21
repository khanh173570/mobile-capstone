#!/bin/bash
# Build Release APK for AgriMart

echo "🔧 Building AgriMart Release APK..."
echo ""

# Step 1: Clean previous builds
echo "📋 Step 1: Cleaning previous builds..."
cd android
./gradlew clean
cd ..

# Step 2: Copy google-services.json
echo "📋 Step 2: Copying google-services.json..."
node copy-google-services.js

# Step 3: Bundle JS for release
echo "📋 Step 3: Bundling JavaScript for release..."
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

# Step 4: Build Release APK
echo "📋 Step 4: Building Release APK..."
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64
cd ..

# Step 5: Sign APK (optional - requires keystore)
# keytool -genkey -v -keystore agrimart.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias agrimart
# jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore agrimart.keystore android/app/build/outputs/apk/release/app-release-unsigned.apk agrimart
# ${ANDROID_HOME}/build-tools/36.0.0/zipalign -v 4 android/app/build/outputs/apk/release/app-release-unsigned.apk AgriMart.apk

echo "✅ APK build complete!"
echo "📍 Location: android/app/build/outputs/apk/release/"
