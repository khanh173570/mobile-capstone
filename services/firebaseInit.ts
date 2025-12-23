/**
 * Firebase Initialization Service
 * CRITICAL: Firebase is automatically initialized by @react-native-firebase/app
 * from google-services.json (Android) / GoogleService-Info.plist (iOS)
 * 
 * This service provides simplified access to Firebase Messaging
 * 
 * NOTE: Firebase is NOT available on Expo Go - it only works on APK/Dev Build/Native
 * This service gracefully handles Firebase unavailability
 */

import { Platform } from 'react-native';

// Firebase Messaging module - try to import, may fail on Expo Go
let messaging: any = null;
let firebaseAvailable = false;

try {
  messaging = require('@react-native-firebase/messaging').default;
  firebaseAvailable = true;
  //console.log('✓ [Firebase Init] Firebase messaging module loaded successfully');
} catch (error) {
  // console.warn('⚠️  [Firebase Init] Firebase messaging not available');
  if (error instanceof Error) {
    console.warn('  Reason:', error.message);
  }
  console.warn('  (This is normal for Expo Go - will use Expo Push Token instead)');
  messaging = null;
  firebaseAvailable = false;
}

let firebaseInitialized = false;

/**
 * Initialize Firebase
 * 
 * IMPORTANT: Firebase App is ALREADY initialized by @react-native-firebase/app
 * from google-services.json (Android) when the app starts.
 * 
 * This function just marks Firebase as available and verified.
 * It does NOT create fake objects or call unnecessary init methods.
 */
export const initializeFirebase = async (): Promise<boolean> => {
  if (firebaseInitialized) {
    //console.log('✓ [Firebase Init] Firebase already initialized');
    return true;
  }

  // If Firebase messaging module is not available, can't proceed
  if (!firebaseAvailable || !messaging) {
    // console.warn('⚠️  [Firebase Init] Firebase messaging module not available');
    // console.warn('  This is normal on Expo Go. Using Expo Push Token instead.');
    // console.warn('  Package: com.agrimart.app');
    firebaseInitialized = false;
    return false;
  }

  try {
    //console.log('🔥 [Firebase Init] Verifying Firebase messaging availability...');
    //console.log('  Platform:', Platform.OS);
    //console.log('  Package: com.agrimart.app');
    //console.log('  google-services.json: android/app/google-services.json');

    // Verify messaging has the expected methods
    if (typeof messaging().getToken !== 'function') {
      console.error('❌ [Firebase Init] messaging().getToken is not available');
      firebaseInitialized = false;
      return false;
    }

    if (typeof messaging().requestPermission !== 'function') {
      console.error('❌ [Firebase Init] messaging().requestPermission is not available');
      firebaseInitialized = false;
      return false;
    }

    //console.log('✓ [Firebase Init] Firebase messaging methods verified');
    firebaseInitialized = true;
    //console.log('✅ [Firebase Init] Firebase ready for FCM token retrieval');
    return true;

  } catch (error) {
    console.error('❌ [Firebase Init] Error verifying Firebase:', error);
    if (error instanceof Error) {
      console.error('  Message:', error.message);
    }
    firebaseInitialized = false;
    return false;
  }
};

/**
 * Get Firebase Messaging instance (callable)
 * Returns the messaging() function that can be called to get the messaging service
 */
export const getFirebaseMessaging = (): any => {
  // Return the messaging function directly
  // It's available even if initializeFirebase hasn't been called
  return messaging;
};

/**
 * Check if Firebase is available and initialized
 */
export const isFirebaseInitialized = (): boolean => {
  return firebaseInitialized;
};

/**
 * Check if Firebase modules are available
 */
export const checkFirebaseAvailability = (): { messaging: boolean } => {
  return {
    messaging: !!messaging,
  };
};

/**
 * Wait for Firebase to be fully initialized
 * @param maxWaitTime - Maximum time to wait in milliseconds (default: 3000ms)
 * @returns Promise<boolean> - true if Firebase initialized, false if timeout
 */
export const waitForFirebaseInitialization = async (maxWaitTime: number = 3000): Promise<boolean> => {
  const startTime = Date.now();
  const checkInterval = 500;

  //console.log('⏳ Waiting for Firebase to be initialized...');
  //console.log('  Max wait time:', maxWaitTime / 1000, 'seconds');

  while (Date.now() - startTime < maxWaitTime) {
    if (firebaseInitialized) {
      const elapsedTime = Date.now() - startTime;
      //console.log('✅ Firebase initialized');
      //console.log('  Time taken:', elapsedTime, 'ms');
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  const elapsedTime = Date.now() - startTime;
  console.error('❌ Firebase initialization timeout after', elapsedTime, 'ms');
  return false;
};
