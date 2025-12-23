import { useEffect, useState } from 'react';
import {
  setupPushNotifications,
  isDeviceTokenStillValid,
  clearStoredDeviceToken,
} from '../services/pushNotificationService';

interface UsePushNotificationsResult {
  isLoading: boolean;
  error: string | null;
  isSetup: boolean;
}

/**
 * Hook to manage push notification setup
 * Call this in your login or app initialization
 */
export const usePushNotifications = (
  userId: string | null
): UsePushNotificationsResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsSetup(false);
      return;
    }

    const initializePushNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if device token is still valid for current user
        const isValid = await isDeviceTokenStillValid(userId);
        
        if (isValid) {
          //console.log('✓ Device token is still valid for current user');
          setIsSetup(true);
          setIsLoading(false);
          return;
        }

        // Setup push notifications
        const success = await setupPushNotifications(userId);
        
        if (success) {
          setIsSetup(true);
          setError(null);
        } else {
          setIsSetup(false);
          setError('Failed to setup push notifications');
        }
      } catch (err) {
        console.error('Error initializing push notifications:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsSetup(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializePushNotifications();
  }, [userId]);

  return {
    isLoading,
    error,
    isSetup,
  };
};

/**
 * Hook to clear push notification setup (e.g., on logout)
 */
export const useClearPushNotifications = () => {
  const clearNotifications = async () => {
    try {
      await clearStoredDeviceToken();
      //console.log('✓ Push notifications cleared on logout');
    } catch (error) {
      console.error('Error clearing push notifications:', error);
    }
  };

  return { clearNotifications };
};
