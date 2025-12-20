import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getFirebaseMessaging, isFirebaseInitialized } from './firebaseInit';

const API_URL = 'https://gateway.a-379.store/api/messaging-service/Test/register-device-token';

export interface RegisterDeviceTokenRequest {
  userId: string;
  deviceToken: string;
}

/**
 * CRITICAL: TOP LEVEL Background Message Handler
 * MUST be registered when the JS bundle loads, NOT in a function or useEffect
 * Firebase may call this even when the app is in a killed state
 */
const setupTopLevelBackgroundHandler = () => {
  try {
    const messaging = getFirebaseMessaging();
    if (messaging) {
      // Register at TOP LEVEL - runs immediately when module loads
      messaging.setBackgroundMessageHandler(async (remoteMessage: any) => {
        console.log('📬 [Background] Message received (app in background/killed)');
        console.log('  Title:', remoteMessage.notification?.title);
        console.log('  Body:', remoteMessage.notification?.body);
        console.log('  Data:', remoteMessage.data);
        // Background messages are automatically displayed by FCM
        // This handler runs even if app is terminated
      });
      console.log('✓ [Background Handler] Registered at TOP LEVEL');
    }
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
 * For Expo Bare workflow / React Native CLI with native Firebase modules
 */
export const getFirebaseToken = async (): Promise<string | null> => {
  try {
    console.log('🔥 Getting Firebase Cloud Messaging (FCM) token...');
    console.log('  Platform:', Platform.OS);

    // Check if Firebase is initialized
    if (!isFirebaseInitialized()) {
      console.error('❌ Firebase not initialized yet');
      return null;
    }

    // Get Firebase Messaging instance
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      console.error('❌ Firebase Messaging not available');
      return null;
    }

    // Request notification permission
    console.log('📍 Requesting notification permission...');
    try {
      const authStatus = await messaging.requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('⚠️  User denied notification permission');
        return null;
      }
      console.log('✓ Notification permission granted');
    } catch (permError) {
      console.warn('⚠️  Could not request permission:', permError);
      // Continue anyway - might have permission already
    }

    // Get FCM token
    console.log('🔥 Getting FCM token from Firebase...');
    const token = await messaging.getToken();

    if (!token) {
      console.error('❌ Failed to get FCM token - token is empty');
      return null;
    }

    console.log('✓ FCM token acquired successfully');
    console.log('  Token type: Firebase Cloud Messaging');
    console.log('  Token length:', token.length);
    console.log('  Token preview:', token.substring(0, 50) + (token.length > 50 ? '...' : ''));

    return token;
  } catch (error) {
    console.error('❌ Error getting Firebase token:', error);
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
  deviceToken: string
): Promise<boolean> => {
  let payload: RegisterDeviceTokenRequest | undefined;
  let headers: any = {};

  try {
    console.log('🔍 Validating device token registration payload...');
    console.log('  userId:', userId.substring(0, 20) + '...');
    console.log('  deviceToken length:', deviceToken?.length);

    const validation = validatePayload(userId, deviceToken);

    if (!validation.valid) {
      console.error('❌ Payload validation failed:');
      validation.errors.forEach(error => console.error('  - ' + error));
      return false;
    }

    // Prepare payload
    payload = {
      userId: userId.trim(),
      deviceToken: deviceToken.trim(),
    };

    console.log('✅ Payload valid');
    console.log('📤 Sending Firebase token to backend...');
    console.log('  URL:', API_URL);
    console.log('  Request body:', {
      userId: payload.userId,
      deviceToken: payload.deviceToken.substring(0, 50) + '...',
    });

    // Prepare headers
    headers = {
      'Content-Type': 'application/json',
    };

    // Try to add auth token
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('  ✓ Added Authorization header');
      }
    } catch (tokenError) {
      console.warn('  ⚠️  Could not get auth token');
    }

    // Send to backend
    const response = await axios.post(API_URL, payload, {
      headers,
      timeout: 15000,
    });

    console.log('✓ Firebase token registered successfully');
    console.log('  Status:', response.status);

    // Save locally
    await AsyncStorage.setItem('deviceToken', deviceToken);
    await AsyncStorage.setItem('deviceTokenRegisteredUserId', userId);

    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      console.error('❌ Backend error:', {
        status: status,
        message: errorData?.message,
        errors: errorData?.errors,
      });

      // Retry without auth header if it was a validation error
      if (status === 400 && errorData?.errors?.deviceToken && headers?.['Authorization'] && payload) {
        console.warn('⚠️  Retrying without Authorization header...');

        try {
          const retryHeaders = {
            'Content-Type': 'application/json',
          };

          const retryResponse = await axios.post(API_URL, payload, {
            headers: retryHeaders,
            timeout: 15000,
          });

          console.log('✓ Succeeded without auth header');
          console.log('  Status:', retryResponse.status);

          // Save locally
          await AsyncStorage.setItem('deviceToken', payload.deviceToken);
          await AsyncStorage.setItem('deviceTokenRegisteredUserId', payload.userId);

          return true;
        } catch (retryError) {
          console.error('❌ Retry also failed');
        }
      }

      // Debug info
      if (status === 400 && errorData?.errors) {
        console.error('💡 Validation errors from backend:');
        Object.entries(errorData.errors).forEach(([field, messages]: any) => {
          console.error(`  - ${field}:`, messages);
        });
      }
    } else if (error instanceof Error) {
      console.error('❌ Error:', error.message);
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

    console.log('🚀 Setting up push notifications...');
    console.log('  User:', userId.substring(0, 20) + '...');

    // Get Firebase token
    console.log('📍 Step 1: Getting Firebase Cloud Messaging token...');
    const token = await getFirebaseToken();

    if (!token) {
      console.warn('⚠️  Could not get Firebase token');
      console.warn('  Firebase may not be installed or configured');
      return false;
    }

    console.log('✓ Step 1: Token acquired');
    console.log('  Length:', token.length);

    // Register with backend
    console.log('📍 Step 2: Registering with backend...');
    const registered = await registerDeviceTokenWithBackend(userId, token);

    if (!registered) {
      console.warn('⚠️  Registration failed, but app will continue');
      return false;
    }

    console.log('✓ Step 2: Registered');
    console.log('✅ Push notifications setup complete');
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
    console.log('✓ Device token cleared');
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
    console.log('🔥 Initializing Firebase notifications...');
    
    // Check if Firebase is initialized
    if (!isFirebaseInitialized()) {
      console.warn('⚠️  Firebase not yet initialized');
      return () => {};
    }
    
    // Get Firebase Messaging instance
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      console.error('❌ Firebase Messaging not available');
      return () => {};
    }
    
    console.log('✓ Firebase Messaging loaded');
    console.log('✓ Background handler already registered at TOP LEVEL');

    // Handle foreground messages (when app is open)
    const unsubscribe = messaging.onMessage(async (remoteMessage: any) => {
      console.log('📬 Foreground message received:', remoteMessage);
      console.log('  Title:', remoteMessage.notification?.title);
      console.log('  Body:', remoteMessage.notification?.body);
      console.log('  Data:', remoteMessage.data);

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

    // Handle notification tap (when user taps notification)
    messaging.onNotificationOpenedApp((remoteMessage: any) => {
      console.log('👆 Notification opened app from background:', remoteMessage);
      console.log('  Data:', remoteMessage.data);
      
      // Handle navigation based on notification data
      if (remoteMessage.data?.screen) {
        console.log('  Navigate to:', remoteMessage.data.screen);
        // Navigation will be handled by app after mount
        // Store the navigation intent if needed
      }
    });

    // Check if app was opened by tapping a notification (from quit state)
    messaging
      .getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          console.log('🚀 App opened from quit state by notification:', remoteMessage);
          console.log('  Data:', remoteMessage.data);
          
          if (remoteMessage.data?.screen) {
            console.log('  Navigate to:', remoteMessage.data.screen);
            // Handle deep linking here
          }
        }
      });

    console.log('✓ Firebase notifications initialized');
    return unsubscribe;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase notifications:', error);
    return () => {};
  }
};
