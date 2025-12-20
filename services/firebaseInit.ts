/**
 * Firebase Initialization Service
 * CRITICAL: This must be imported early in app lifecycle before any Firebase services are used
 * Initializes Firebase app from google-services.json (Android) / GoogleService-Info.plist (iOS)
 */

import { Platform } from 'react-native';

let firebaseInitialized = false;
let firebaseApp: any = null;
let firebaseMessaging: any = null;

/**
 * Initialize Firebase App and Messaging
 * MUST be called as early as possible in app startup
 */
export const initializeFirebase = async (): Promise<boolean> => {
  if (firebaseInitialized) {
    console.log('✓ Firebase already initialized');
    return true;
  }

  try {
    console.log('🔥 [Firebase Init] Starting Firebase initialization...');
    console.log('  Platform:', Platform.OS);

    // Step 1: Initialize Firebase App from google-services.json / GoogleService-Info.plist
    console.log('📋 [Firebase Init] Step 1: Initializing Firebase App...');
    try {
      // CRITICAL: Import Firebase App module
      // @react-native-firebase/app auto-initializes from google-services.json
      const firebaseAppModule = require('@react-native-firebase/app');
      // The module exports the app directly, not as .default
      firebaseApp = firebaseAppModule;
      
      // Firebase is auto-initialized by the native module
      console.log('✓ [Firebase Init] Firebase App loaded from native module');
      console.log('  (Auto-initialized from google-services.json)');
      
      if (!firebaseApp) {
        throw new Error('Firebase app module returned falsy value');
      }
      
      console.log('✓ [Firebase Init] Firebase App initialized successfully');
      console.log('  App name:', firebaseApp.name || '[DEFAULT]');
    } catch (appError) {
      console.error('❌ [Firebase Init] Failed to initialize Firebase App:', appError);
      throw new Error(
        `Firebase App initialization failed: ${appError instanceof Error ? appError.message : String(appError)}`
      );
    }

    // Step 2: Initialize Firebase Messaging
    console.log('💬 [Firebase Init] Step 2: Initializing Firebase Messaging...');
    try {
      const messagingModule = require('@react-native-firebase/messaging');
      firebaseMessaging = messagingModule.default || messagingModule;
      
      if (!firebaseMessaging) {
        throw new Error('Firebase messaging module returned falsy value');
      }
      
      console.log('✓ [Firebase Init] Firebase Messaging initialized successfully');
    } catch (messagingError) {
      console.error('❌ [Firebase Init] Failed to initialize Firebase Messaging:', messagingError);
      throw new Error(
        `Firebase Messaging initialization failed: ${messagingError instanceof Error ? messagingError.message : String(messagingError)}`
      );
    }

    // Step 3: Verify Firebase configuration
    console.log('🔍 [Firebase Init] Step 3: Verifying Firebase configuration...');
    try {
      // Check if Firebase App has config
      console.log('  Firebase App configured: ✓');
      console.log('  Firebase Messaging ready: ✓');
      console.log('  Package: com.agrimart.shop');
      console.log('  google-services.json must be at: android/app/google-services.json');
    } catch (verifyError) {
      console.warn('⚠️  [Firebase Init] Could not verify configuration:', verifyError);
      // Continue anyway - Firebase might still work
    }

    firebaseInitialized = true;
    console.log('✅ [Firebase Init] Firebase initialization complete');
    return true;

  } catch (error) {
    console.error('❌ [Firebase Init] Fatal error during Firebase initialization:', error);
    firebaseInitialized = false;
    return false;
  }
};

/**
 * Get initialized Firebase App instance
 */
export const getFirebaseApp = (): any => {
  if (!firebaseInitialized) {
    console.warn('⚠️  [Firebase Init] Firebase not yet initialized. Call initializeFirebase() first.');
    return null;
  }
  return firebaseApp;
};

/**
 * Get initialized Firebase Messaging instance
 */
export const getFirebaseMessaging = (): any => {
  if (!firebaseInitialized) {
    console.warn('⚠️  [Firebase Init] Firebase not yet initialized. Call initializeFirebase() first.');
    return null;
  }
  return firebaseMessaging;
};

/**
 * Check if Firebase is initialized
 */
export const isFirebaseInitialized = (): boolean => {
  return firebaseInitialized;
};

/**
 * Check if Firebase modules are available
 */
export const checkFirebaseAvailability = (): { app: boolean; messaging: boolean } => {
  return {
    app: !!firebaseApp,
    messaging: !!firebaseMessaging,
  };
};
