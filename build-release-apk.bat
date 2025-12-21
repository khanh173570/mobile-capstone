@echo off
REM Build Release APK for AgriMart

setlocal enabledelayedexpansion

echo 🔧 Building AgriMart Release APK...
echo.

REM Set JAVA_HOME
set "JAVA_HOME=C:\Program Files\Java\jdk-17"

REM Step 1: Clean previous builds
echo 📋 Step 1: Cleaning previous builds...
cd android
call gradlew clean
cd ..

REM Step 2: Copy google-services.json
echo 📋 Step 2: Copying google-services.json...
node copy-google-services.js

REM Step 3: Bundle JS for release
echo 📋 Step 3: Bundling JavaScript for release...
mkdir android\app\src\main\assets 2>nul
npx react-native bundle ^
  --platform android ^
  --dev false ^
  --entry-file index.js ^
  --bundle-output android/app/src/main/assets/index.android.bundle ^
  --assets-dest android/app/src/main/res

REM Step 4: Build Release APK
echo 📋 Step 4: Building Release APK with Gradle...
cd android
call gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64
cd ..

if %errorlevel% equ 0 (
    echo.
    echo ✅ APK build complete!
    echo 📍 Location: android\app\build\outputs\apk\release\
    echo.
    dir /b android\app\build\outputs\apk\release\*.apk
) else (
    echo.
    echo ❌ Build failed with error code !errorlevel!
)

pause
