# Firebase Configuration Checklist ✅

## ✅ FIXED (by code changes)

### ✅ Issue 1: Firebase initialization
- **File**: [services/firebaseInit.ts](services/firebaseInit.ts)
- **Fix**: Now calls `firebase.initializeApp()` with proper error handling
- **Status**: FIXED

### ✅ Issue 4: POST_NOTIFICATIONS permission
- **File**: [android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml)
- **Fix**: Added `<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>`
- **Status**: FIXED

### ✅ Issue 5: setBackgroundMessageHandler placement
- **File**: [services/pushNotificationService.ts](services/pushNotificationService.ts)
- **Fix**: Moved to TOP LEVEL of module (runs when JS bundle loads with `setTimeout`)
- **Why**: Background handler must be registered immediately when module loads, not in a function
- **Details**: Firebase may invoke this handler even when app is killed/in background
- **Status**: FIXED ✓

---

## ⚠️ TODO - MANUAL ACTIONS REQUIRED

### ❌ CRITICAL: google-services.json is MISSING!
**Status**: MISSING - BUILD WILL FAIL

The file `google-services.json` is not found in your project.

**Required Action**:
1. Go to: https://console.firebase.google.com
2. Select your AgriMart project
3. Go to **Project Settings** (gear icon)
4. Click **General** tab
5. Scroll down to "Your apps" section
6. Find your Android app (package: `com.agrimart.shop`)
7. Click **Download** next to `google-services.json`
8. Save the file to: `D:\Capstone_2025\android\app\google-services.json`

**Verify**:
- File must be at: `CAPSTONE_2025/android/app/google-services.json`
- NOT at root level
- Must contain: `"package_name": "com.agrimart.shop"`

---

### ❌ Issue 3: app.config.ts package name verification
**Status**: VERIFIED ✓

File: [app.config.ts](app.config.ts)

Current config:
```typescript
android: {
  package: "com.agrimart.shop",  // ✓ CORRECT
  ...
}
```

**Action Required**:
- ✓ Package name `com.agrimart.shop` is set correctly
- Verify this MATCHES the package name in `google-services.json`
- If they don't match exactly (even 1 character), Firebase won't work

---

## 📋 Pre-Build Verification

Before running `expo run:android`, verify:

### Step 1: Verify File Locations
```
✓ CAPSTONE_2025/
  ├─ services/firebaseInit.ts (initialization logic)
  ├─ services/pushNotificationService.ts (handlers)
  ├─ app/_layout.tsx (calls initializeFirebase())
  └─ android/
      ├─ app/
      │  ├─ google-services.json  ← MUST BE HERE
      │  └─ src/main/AndroidManifest.xml (has POST_NOTIFICATIONS)
      └─ app/build.gradle
```

### Step 2: Verify Configuration Match
```
google-services.json           : "package_name": "com.agrimart.shop"
app.config.ts                  : "package": "com.agrimart.shop"
AndroidManifest.xml            : android:package="com.agrimart.shop"
```

All three MUST match exactly!

### Step 3: Build Commands
```bash
# Clean build
npx expo prebuild --clean

# Or if already prebuilt
npx expo run:android

# DO NOT use Expo Go for bare workflow
```

---

## 🔥 Firebase Init Flow

```
1. pushNotificationService.ts MODULE LOADS
2. TOP LEVEL (setTimeout): setupTopLevelBackgroundHandler()
   → Immediately registers messaging.setBackgroundMessageHandler()
   → Ready to receive messages even if app is killed/in background
   
3. app/_layout.tsx loads
4. Calls: initializeFirebase() 
   → Loads google-services.json from android/app/
   → Calls firebase.initializeApp()
   → Loads Firebase Messaging module
   
5. Calls: initializeNotifications()
   → Sets onMessage() for foreground messages
   → Sets onNotificationOpenedApp() for tap handling
   
6. App can now receive:
   - 📩 Background messages (handler already registered)
   - 📬 Foreground messages
   - 👆 Notification taps
```

**KEY**: Background handler is registered BEFORE initializeNotifications()!

---

## ❓ Troubleshooting

### "No Firebase App '[DEFAULT]' has been created"
- [ ] Check if `google-services.json` exists at `android/app/google-services.json`
- [ ] Verify package name matches in all 3 places
- [ ] Check `firebaseInit.ts` calls `firebase.initializeApp()`
- [ ] Try: `npx expo prebuild --clean`

### "POST_NOTIFICATIONS permission denied"
- [ ] Verify `AndroidManifest.xml` has the permission
- [ ] Grant permission in Android settings for the app
- [ ] Only needed on Android 13+

### "Background messages not received"
- [ ] Verify `setupTopLevelBackgroundHandler()` is called at MODULE TOP LEVEL
- [ ] Check that `setTimeout(() => { setupTopLevelBackgroundHandler(); }, 0);` executes
- [ ] Background handler MUST be set BEFORE app initialization completes
- [ ] NOT inside useEffect or any async function

---

## ✅ Final Checklist

- [ ] `google-services.json` copied to `android/app/`
- [ ] Package names match in all 3 configs
- [ ] `firebaseInit.ts` calls `firebase.initializeApp()`
- [ ] `AndroidManifest.xml` has `POST_NOTIFICATIONS` permission
- [ ] `pushNotificationService.ts` has TOP LEVEL background handler (setTimeout)
- [ ] Background handler runs when module loads (not in initializeNotifications)
- [ ] Run `npx expo prebuild --clean`
- [ ] Run `npx expo run:android`
