import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationMessage {
  title: string;
  body: string;
  auctionId?: string;
  logId?: string;
  type?: 'auction_log' | 'system' | 'info';
  data?: Record<string, any>;
}

type NotificationListener = (notification: NotificationMessage) => void;

// Store notification listeners
let notificationListeners: NotificationListener[] = [];
let notificationResponseListeners: NotificationListener[] = [];

/**
 * Get saved device token
 */
export const getDeviceToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('deviceToken');
  } catch (error) {
    console.error('Error getting device token:', error);
    return null;
  }
};

/**
 * Send local notification
 */
export const sendLocalNotification = async (
  message: NotificationMessage
): Promise<void> => {
  try {
    // Trigger all registered listeners
    notificationListeners.forEach((listener) => {
      listener(message);
    });

    console.log('Local notification sent:', message);
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
};

/**
 * Listen to notification events
 */
export const setupNotificationListeners = (
  onNotificationReceived?: (notification: NotificationMessage) => void,
  onNotificationResponse?: (notification: NotificationMessage) => void
): (() => void) => {
  if (onNotificationReceived) {
    notificationListeners.push(onNotificationReceived);
  }

  if (onNotificationResponse) {
    notificationResponseListeners.push(onNotificationResponse);
  }

  // Return cleanup function
  return () => {
    if (onNotificationReceived) {
      notificationListeners = notificationListeners.filter(
        (l) => l !== onNotificationReceived
      );
    }
    if (onNotificationResponse) {
      notificationResponseListeners = notificationResponseListeners.filter(
        (l) => l !== onNotificationResponse
      );
    }
  };
};

/**
 * Trigger notification response listeners (when user taps notification)
 */
export const triggerNotificationResponse = (notification: NotificationMessage): void => {
  notificationResponseListeners.forEach((listener) => {
    listener(notification);
  });
};
