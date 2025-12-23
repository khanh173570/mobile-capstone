import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import Constants from 'expo-constants';
import {
  getFirebaseMessaging,
  isFirebaseInitialized,
  waitForFirebaseInitialization,
  checkFirebaseAvailability,
  initializeFirebase,
} from './firebaseInit'; // ✅ Firebase initialization service

const BASE_API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://gateway.a-379.store/api';
const API_URL = `${BASE_API_URL}/messaging-service/Test/register-device-token`;

export interface RegisterDeviceTokenRequest {
  userId: string;
  fcmToken?: string;           // Firebase Cloud Messaging token
  expoPushToken?: string;      // Expo Push Notification token
}

/**
 * Get Expo Push Token
 * Works on both Expo Go and native builds
 * Format: ExponentPushToken[xxxxxxxx]
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    //console.log('📱 [Expo] Attempting to get Expo Push Token...');
    //console.log('  Platform:', Platform.OS);

    // Step 1: Request notification permission first
    //console.log('  📍 Requesting notification permission...');
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      
      if (status === 'granted') {
        //console.log('  ✓ Notification permission granted');
      } else if (status === 'denied') {
        console.warn('  ⚠️  [Expo] Notification permission denied by user');
        // Continue anyway - might still get token or it might work with limited notifications
      } else {
        //console.log('  ℹ️  [Expo] Notification permission status:', status);
      }
    } catch (permissionError) {
      console.warn('  ⚠️  [Expo] Could not request notification permission:', permissionError);
      // Continue anyway
    }

    // Step 2: Get the token
    let attempts = 0;
    const maxAttempts = 5;
    const retryDelayMs = 1000;
    let token: string | null = null;

    while (!token && attempts < maxAttempts) {
      attempts++;

      try {
        const expoPushToken = await Notifications.getExpoPushTokenAsync();
        token = expoPushToken.data;

        if (!token) {
          console.warn(`  ⚠️  [Expo] Attempt ${attempts}/${maxAttempts}: Token is empty, retrying...`);
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          }
          continue;
        }

        // Validate token format
        if (!token.includes('ExponentPushToken')) {
          console.warn(`  ⚠️  [Expo] Attempt ${attempts}/${maxAttempts}: Invalid format, expected ExponentPushToken[...], got: ${token}`);
          token = null;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          }
          continue;
        }

        // //console.log(`✓ [Expo] Token acquired on attempt ${attempts}`);
        // //console.log(`  Token: ${token}`);
        // //console.log(`  Length: ${token.length} chars`);
        return token;
      } catch (attemptError) {
        // console.warn(`  ⚠️  [Expo] Attempt ${attempts}/${maxAttempts} failed:`, attemptError);
        token = null;

        if (attempts < maxAttempts) {
          const waitTime = retryDelayMs / 1000;
          // //console.log(`  ⏳ Retrying in ${waitTime}s...`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
      }
    }

    if (!token) {
      console.warn('❌ [Expo] Failed to get Expo Push Token after', maxAttempts, 'attempts');
      console.warn('  This is normal on Production APK builds');
      return null;
    }

    return token;
  } catch (error) {
    console.error('❌ [Expo] Error getting Expo Push Token:', error);
    return null;
  }
};

/**
 * CRITICAL: TOP LEVEL Background Message Handler
 * MUST be registered when the JS bundle loads, NOT in a function or useEffect
 * Firebase may call this even when the app is in a killed state
 * Gracefully handles Firebase unavailability (Expo Go)
 */
const setupTopLevelBackgroundHandler = () => {
  try {
    const messagingFn = getFirebaseMessaging();
    if (!messagingFn) {
      // console.warn('⚠️  [Background Handler] Firebase messaging not available (normal for Expo Go)');
      return;
    }
    
    const messaging = messagingFn();
    if (typeof messaging.setBackgroundMessageHandler !== 'function') {
      console.warn('⚠️  [Background Handler] setBackgroundMessageHandler not available');
      return;
    }

    // Register at TOP LEVEL - runs immediately when module loads
    messaging.setBackgroundMessageHandler(async (remoteMessage: any) => {
      //console.log('📬 [Background] Message received (app in background/killed)');
      //console.log('  Title:', remoteMessage.notification?.title);
      //console.log('  Body:', remoteMessage.notification?.body);
      //console.log('  Data:', remoteMessage.data);
      // Background messages are automatically displayed by FCM
      // This handler runs even if app is terminated
    });
    //console.log('✓ [Background Handler] Registered at TOP LEVEL');
  } catch (error) {
    console.warn('⚠️  [Background Handler] Could not set up (Firebase not ready):', error);
  }
};

// IMMEDIATE TOP-LEVEL EXECUTION: Don't wait for initialization
// This ensures the handler is registered ASAP
setTimeout(() => {
  setupTopLevelBackgroundHandler();
}, 0);

/**
 * Get Firebase Cloud Messaging (FCM) token
 * CORRECT FLOW FOR APK:
 * 1. Request permission
 * 2. Register for remote messages (this prepares Firebase to generate token)
 * 3. WAIT 1.5 seconds (CRITICAL - Firebase needs time to auto-register)
 * 4. Get token
 * 
 * DO NOT retry based on token length - accept any token returned
 */
export const getFirebaseToken = async (): Promise<string | null> => {
  try {
    //console.log('🔥 [FCM] Getting Firebase Cloud Messaging token...');
    //console.log('  Platform:', Platform.OS);

    // Get Firebase Messaging instance function
    const messagingFn = getFirebaseMessaging();
    if (!messagingFn) {
      console.warn('⚠️  [FCM] Firebase Messaging not available (expected on Expo Go)');
      return null;
    }
    
    const messaging = messagingFn();
    //console.log('✓ [FCM] Firebase Messaging instance available');

    // STEP 1: Request notification permission
    //console.log('📍 [FCM] Step 1: Requesting notification permission...');
    try {
      const authStatus = await messaging.requestPermission();
      const enabled = authStatus === 1 || authStatus === 2; // AUTHORIZED or PROVISIONAL
      
      if (enabled) {
        //console.log('✓ [FCM] Notification permission granted');
      } else {
        console.warn('⚠️  [FCM] Notification permission status:', authStatus);
        // Continue anyway - might have permission already
      }
    } catch (permError) {
      console.warn('⚠️  [FCM] Permission request error (non-critical):', permError);
      // Continue anyway
    }

    // STEP 2: CRITICAL - Register for remote messages
    // This tells Firebase to prepare the device for receiving messages
    // and triggers auto-registration of FCM token
    //console.log('📍 [FCM] Step 2: Registering device for remote messages...');
    try {
      if (typeof messaging.registerDeviceForRemoteMessages === 'function') {
        await messaging.registerDeviceForRemoteMessages();
        //console.log('✓ [FCM] Device registered for remote messages');
      } else {
        console.warn('⚠️  [FCM] registerDeviceForRemoteMessages not available');
      }
    } catch (regError) {
      console.warn('⚠️  [FCM] Register error (non-critical):', regError);
      // Continue anyway
    }

    // STEP 3: CRITICAL - Wait for Firebase to auto-register and prepare token
    // This is the key fix - Firebase needs 1-2 seconds after registerDeviceForRemoteMessages
    // to actually generate and make the token available
    //console.log('📍 [FCM] Step 3: Waiting for Firebase to prepare token...');
    await new Promise(res => setTimeout(res, 1500));
    //console.log('✓ [FCM] Wait completed');

    // STEP 4: Get the token
    //console.log('📍 [FCM] Step 4: Retrieving token from Firebase...');
    let token: string | null = null;
    
    try {
      token = await messaging.getToken();
    } catch (tokenError) {
      console.error('❌ [FCM] Error getting token:', tokenError);
      return null;
    }

    // Validate token exists
    if (!token || token.trim().length === 0) {
      console.error('❌ [FCM] Token is null or empty');
      return null;
    }

    //console.log('✓ [FCM] FCM token acquired successfully');
    //console.log('  Token length:', token.length, 'characters');
    //console.log('  Token:', token);

    return token;
  } catch (error) {
    console.error('❌ [FCM] Fatal error getting Firebase token:', error);
    if (error instanceof Error) {
      console.error('  Message:', error.message);
      console.error('  Name:', error.name);
    }
    return null;
  }
};

/**
 * Validate payload before sending
 */
const validatePayload = (userId: string, deviceToken: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check userId
  if (!userId) {
    errors.push('UserId is empty');
  } else if (userId.trim().length === 0) {
    errors.push('UserId contains only whitespace');
  } else if (userId.length < 5) {
    errors.push(`UserId is too short (${userId.length} chars, expected >= 5)`);
  }

  // Check deviceToken
  if (!deviceToken) {
    errors.push('DeviceToken is empty');
  } else if (deviceToken.trim().length === 0) {
    errors.push('DeviceToken contains only whitespace');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Register device token with backend
 */
export const registerDeviceTokenWithBackend = async (
  userId: string,
  fcmToken?: string,
  expoPushToken?: string
): Promise<boolean> => {
  try {
    //console.log('🔍 [Register] Validating device token registration payload...');
    //console.log('  userId:', userId.substring(0, 20) + '...');
    //console.log('  fcmToken length:', fcmToken?.length);
    //console.log('  expoPushToken:', expoPushToken ? `✅ (${expoPushToken.length} chars)` : '❌ (not provided)');

    // Validate at least one token exists
    if (!fcmToken && !expoPushToken) {
      console.error('❌ [Register] Both fcmToken and expoPushToken are missing');
      return false;
    }

    // Validate token formats
    if (fcmToken && fcmToken.length < 100) {
      console.warn('⚠️  [Register] FCM token seems incomplete (<100 chars), but continuing...');
    }

    // Prepare payload with query parameters
    const queryParams = new URLSearchParams({
      userId: userId.trim(),
      ...(fcmToken && { fcmToken: fcmToken.trim() }),
      ...(expoPushToken && { expoPushToken: expoPushToken.trim() }),
    });

    const registerUrl = `${API_URL}?${queryParams.toString()}`;

    //console.log('✅ [Register] Payload valid');
    //console.log('📤 [Register] Sending tokens to backend...');
    //console.log('  URL:', registerUrl);
    //console.log('  Tokens to send:');
    if (fcmToken) {
      //console.log(`    ✓ FCM Token (${fcmToken.length} chars): ${fcmToken.substring(0, 50)}...`);
    }
    if (expoPushToken) {
      //console.log(`    ✓ Expo Token: ${expoPushToken}`);
    }

    // Prepare headers with auth token
    const headers: any = {
      'Content-Type': 'application/json',
    };

    // Try to add auth token
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        //console.log('  ✓ Added Authorization header');
      } else {
        console.warn('  ⚠️  No access token found, registering without auth');
      }
    } catch (tokenError) {
      console.warn('  ⚠️  Could not get auth token:', tokenError);
    }

    // Send to backend - using query parameters in URL, POST with empty body
    const response = await axios.post(registerUrl, {}, {
      headers: headers,
      timeout: 15000,
    });

    //console.log('✓ [Register] Tokens registered successfully');
    //console.log('  Status:', response.status);
    //console.log('  Response message:', response.data?.message);
    //console.log('  Device ID:', response.data?.data?.id);

    // Save locally - IMPORTANT: don't lose tokens if save fails
    try {
      if (fcmToken) {
        await AsyncStorage.setItem('fcmToken', fcmToken);
        //console.log('✓ [Register] FCM token saved to AsyncStorage');
      }
      if (expoPushToken) {
        await AsyncStorage.setItem('expoPushToken', expoPushToken);
        //console.log('✓ [Register] Expo token saved to AsyncStorage');
      }
      await AsyncStorage.setItem('deviceTokenRegisteredUserId', userId);
      //console.log('✓ [Register] Device token userId saved to AsyncStorage');
    } catch (saveError) {
      console.error('❌ [Register] Failed to save to AsyncStorage:', saveError);
      // Still return true because tokens were registered on backend
    }

    //console.log('✅ Device token registration complete');
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      console.error('❌ Backend registration failed');
      console.error('  Status:', status);
      console.error('  Message:', errorData?.message);
      console.error('  Errors:', errorData?.errors);

      // Debug info
      if (status === 400 && errorData?.errors) {
        console.error('💡 Validation errors from backend:');
        Object.entries(errorData.errors).forEach(([field, messages]: any) => {
          console.error(`  - ${field}:`, messages);
        });
      }

      if (status === 401 || status === 403) {
        console.error('⚠️  Authentication error - check access token');
      }

      if (status === 502 || status === 503) {
        console.error('⚠️  Backend service error - check if messaging service is running');
      }
    } else if (error instanceof Error) {
      console.error('❌ Error:', error.message);
      if (error.message.includes('timeout')) {
        console.error('⚠️  Request timeout - backend may be slow or unreachable');
      }
    }

    return false;
  }
};

/**
 * Setup push notifications - complete flow
 */
export const setupPushNotifications = async (userId: string): Promise<boolean> => {
  try {
    if (!userId || userId.trim().length === 0) {
      console.error('❌ Invalid userId');
      return false;
    }

    //console.log('🚀 [Setup] Setting up push notifications...');
    //console.log('  User:', userId.substring(0, 20) + '...');

    // STEP 0: Initialize Firebase (required before getFirebaseToken can work)
    //console.log('📍 [Setup] Step 0: Initializing Firebase...');
    const firebaseInitResult = await initializeFirebase();
    //console.log('  Firebase init result:', firebaseInitResult);

    // STEP 1: Get FCM Token
    //console.log('📍 [Setup] Step 1: Getting Firebase Cloud Messaging token...');
    let fcmToken: string | null = null;
    try {
      fcmToken = await getFirebaseToken();
      if (fcmToken) {
        //console.log('✓ [Setup] FCM token acquired');
        //console.log('  Length:', fcmToken.length, 'chars');
      } else {
        // console.warn('⚠️  [Setup] Could not get FCM token (expected on Expo Go)');
      }
    } catch (fcmError) {
      console.warn('⚠️  [Setup] Error getting FCM token:', fcmError);
    }

    // STEP 2: Get Expo Push Token (fallback)
    //console.log('📍 [Setup] Step 2: Getting Expo Push Token...');
    const expoPushToken = await getExpoPushToken();
    if (expoPushToken) {
      //console.log('✓ [Setup] Expo token acquired');
    } else {
      console.warn('⚠️  [Setup] Could not get Expo token');
    }

    // STEP 3: Validate we have at least one token
    if (!fcmToken && !expoPushToken) {
      console.error('❌ [Setup] Failed to get any token (both FCM and Expo failed)');
      return false;
    }

    //console.log('📋 [Setup] Tokens ready to register:');
    if (fcmToken) {
      //console.log(`  ✓ FCM: ${fcmToken.length} chars`);
    }
    if (expoPushToken) {
      //console.log(`  ✓ Expo: ${expoPushToken}`);
    }

    // STEP 4: Register with backend
    //console.log('📍 [Setup] Step 3: Registering with backend...');
    const registered = await registerDeviceTokenWithBackend(userId, fcmToken || undefined, expoPushToken || undefined);

    if (!registered) {
      console.warn('⚠️  [Setup] Registration failed');
      return false;
    }

    //console.log('✅ [Setup] Push notifications setup complete');
    return true;
  } catch (error) {
    console.error('❌ Setup error:', error);
    return false;
  }
};

/**
 * Check if stored token is still valid for current user
 */
export const isDeviceTokenStillValid = async (userId: string): Promise<boolean> => {
  try {
    const storedUserId = await AsyncStorage.getItem('deviceTokenRegisteredUserId');
    return storedUserId === userId;
  } catch (error) {
    return false;
  }
};

/**
 * Clear stored device token (e.g., on logout)
 */
export const clearStoredDeviceToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('deviceToken');
    await AsyncStorage.removeItem('deviceTokenRegisteredUserId');
    //console.log('✓ Device token cleared');
  } catch (error) {
    console.error('Error clearing device token:', error);
  }
};


/**
 * Initialize Firebase notification handlers
 * Registers foreground message handlers and notification tap handlers
 * Background handler is already registered at TOP LEVEL
 */
export const initializeNotifications = async () => {
  try {
    //console.log('🔥 Initializing Firebase notifications...');
    
    // Check if Firebase is initialized
    if (!isFirebaseInitialized()) {
      // console.warn('⚠️  Firebase not yet initialized');
      return () => {};
    }
    
    // Get Firebase Messaging instance function
    const messagingFn = getFirebaseMessaging();
    if (!messagingFn) {
      // console.error('❌ Firebase Messaging not available');
      return () => {};
    }
    
    const messaging = messagingFn();
    //console.log('✓ Firebase Messaging loaded');
    //console.log('✓ Background handler already registered at TOP LEVEL');

    let unsubscribe = () => {};

    // Handle foreground messages (when app is open) - use optional chaining
    if (messaging.onMessage) {
      const unsubscribeOnMessage = messaging.onMessage(async (remoteMessage: any) => {
        //console.log('📬 Foreground message received:', remoteMessage);
        //console.log('  Title:', remoteMessage.notification?.title);
        //console.log('  Body:', remoteMessage.notification?.body);
        //console.log('  Data:', remoteMessage.data);

        // Display in-app notification
        // You can integrate with your NotificationToast component here
        if (remoteMessage.notification) {
          // Get global notification setter if registered
          const { getGlobalNotificationSetter } = require('./auctionLogNotificationService');
          const setNotification = getGlobalNotificationSetter();
          
          if (setNotification) {
            setNotification({
              id: Date.now().toString(),
              message: remoteMessage.notification.body || 'New notification',
              type: remoteMessage.data?.type || 'info',
              timestamp: new Date().toISOString(),
            });
          }
        }
      });
      unsubscribe = unsubscribeOnMessage;
    } else {
      // console.warn('⚠️  messaging.onMessage not available');
    }

    // Handle notification tap (when user taps notification)
    if (messaging.onNotificationOpenedApp) {
      messaging.onNotificationOpenedApp((remoteMessage: any) => {
        //console.log('👆 Notification opened app from background:', remoteMessage);
        //console.log('  Data:', remoteMessage.data);
        
        // Handle navigation based on notification data
        if (remoteMessage.data?.screen) {
          //console.log('  Navigate to:', remoteMessage.data.screen);
          // Navigation will be handled by app after mount
          // Store the navigation intent if needed
        }
      });
    } else {
      // console.warn('⚠️  messaging.onNotificationOpenedApp not available');
    }

    // Check if app was opened by tapping a notification (from quit state)
    if (messaging.getInitialNotification) {
      messaging
        .getInitialNotification()
        .then((remoteMessage: any) => {
          if (remoteMessage) {
            //console.log('🚀 App opened from quit state by notification:', remoteMessage);
            //console.log('  Data:', remoteMessage.data);
            
            if (remoteMessage.data?.screen) {
              //console.log('  Navigate to:', remoteMessage.data.screen);
              // Handle deep linking here
            }
          }
        });
    } else {
      // console.warn('⚠️  messaging.getInitialNotification not available');
    }

    //console.log('✓ Firebase notifications initialized');
    return unsubscribe;
  } catch (error) {
    // console.error('❌ Failed to initialize Firebase notifications:', error);
    return () => {};
  }
};

/**
 * Print diagnostic info about push notification setup
 * Call this to verify tokens are properly configured
 * Should see:
 * - APK: ✅ FCM Token + Expo Token (2 tokens)
 * - Expo Go: Expo Token only (1 token)
 */
export const printPushNotificationDiagnostics = async (): Promise<void> => {
  try {
    //console.log('\n🔍 [Diagnostics] Push Notification Setup Status');
    //console.log('═'.repeat(60));
    
    // Check Firebase availability
    const { messaging: firebaseMessagingAvailable } = checkFirebaseAvailability();
    //console.log('🔥 Firebase Status:');
    //console.log(`  Firebase Available: ${firebaseMessagingAvailable ? '✅ YES' : '❌ NO (Expo Go)'}`);
    
    // Check stored tokens
    //console.log('\n📱 Stored Tokens:');
    try {
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      const expoPushToken = await AsyncStorage.getItem('expoPushToken');
      const userId = await AsyncStorage.getItem('deviceTokenRegisteredUserId');
      
      if (fcmToken) {
        // //console.log(`  ✅ FCM Token: Present (${fcmToken.length} chars)`);
        // //console.log(`     Preview: ${fcmToken.substring(0, 50)}...`);
      } else {
        // //console.log(`  ❌ FCM Token: NOT FOUND`);
      }
      
      if (expoPushToken) {
        // //console.log(`  ✅ Expo Token: Present (${expoPushToken.length} chars)`);
        // //console.log(`     Full: ${expoPushToken}`);
      } else {
        //console.log(`  ❌ Expo Token: NOT FOUND`);
      }
      
      if (userId) {
        //console.log(`  ✅ User ID: ${userId.substring(0, 20)}...`);
      } else {
        //console.log(`  ❌ User ID: NOT FOUND`);
      }
    } catch (error) {
      console.error('  Error reading stored tokens:', error);
    }
    
    // Summary
    //console.log('\n📊 Summary:');
    try {
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      const expoPushToken = await AsyncStorage.getItem('expoPushToken');
      const totalTokens = (fcmToken ? 1 : 0) + (expoPushToken ? 1 : 0);
      
      if (totalTokens === 2) {
        //console.log('  ✅ PERFECT: Both FCM + Expo tokens present (APK Build)');
        //console.log('     → Ready to receive notifications from both channels');
      } else if (totalTokens === 1) {
        if (expoPushToken) {
          //console.log('  ✅ EXPO GO: Expo token only (normal for Expo Go)');
          //console.log('     → Ready to receive Expo notifications');
        } else if (fcmToken) {
          //console.log('  ✅ APK BUILD: FCM token only');
          //console.log('     ⚠️  Missing Expo token - should have both');
        }
      } else {
        //console.log('  ❌ ERROR: No tokens found!');
        //console.log('     → Device will NOT receive notifications');
        //console.log('     → Call setupPushNotifications(userId) to initialize');
      }
    } catch (error) {
      console.error('  Error analyzing tokens:', error);
    }
    
    //console.log('═'.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ Error in printPushNotificationDiagnostics:', error);
  }
};
