/**
 * Notification Helper Service
 * Provides convenient methods to send notifications with automatically retrieved device token
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendSimpleFCMNotification, FCMSendNotificationResponse } from './fcmSendNotificationService';

/**
 * Get stored device token from AsyncStorage
 */
export const getStoredDeviceToken = async (): Promise<string | null> => {
  try {
    const deviceToken = await AsyncStorage.getItem('deviceToken');
    if (!deviceToken) {
      console.warn('⚠️ No device token found. Please ensure push notifications are set up.');
      return null;
    }
    //console.log('✓ Device token retrieved:', deviceToken.substring(0, 20) + '...');
    return deviceToken;
  } catch (error) {
    console.error('❌ Error getting device token:', error);
    return null;
  }
};

/**
 * Send notification to current device (uses stored device token)
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional additional data (JSON format)
 * @returns Promise<FCMSendNotificationResponse | null>
 */
export const sendNotificationToCurrentDevice = async (
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<FCMSendNotificationResponse | null> => {
  try {
    const deviceToken = await getStoredDeviceToken();
    if (!deviceToken) {
      console.error('❌ Cannot send notification: No device token available');
      return null;
    }

    //console.log('📤 Sending notification to current device...');
    const response = await sendSimpleFCMNotification(deviceToken, title, body, data);

    if (response.isSuccess) {
      //console.log('✅ Notification sent successfully to device');
    } else {
      console.error('❌ Failed to send notification:', response.message);
    }

    return response;
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return null;
  }
};

/**
 * Send notification with explicit device token
 * @param deviceToken - Device token to send to
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional additional data (JSON format)
 * @returns Promise<FCMSendNotificationResponse>
 */
export const sendNotificationToDevice = async (
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<FCMSendNotificationResponse> => {
  try {
    //console.log('📤 Sending notification to device:', deviceToken.substring(0, 20) + '...');
    const response = await sendSimpleFCMNotification(deviceToken, title, body, data);

    if (response.isSuccess) {
      //console.log('✅ Notification sent successfully');
    } else {
      console.error('❌ Failed to send notification:', response.message);
    }

    return response;
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    throw error;
  }
};

/**
 * Example: Send a bid acceptance notification
 */
export const sendBidAcceptanceNotification = async (
  buyerDeviceToken: string,
  farmName: string,
  productName: string,
  bidAmount: number
): Promise<FCMSendNotificationResponse | null> => {
  try {
    return await sendNotificationToDevice(
      buyerDeviceToken,
      'ArgiMart - Đề Nghị Được Chấp Nhận',
      `Đề nghị mua của bạn cho "${productName}" từ "${farmName}" đã được chấp nhận!`,
      {
        type: 'bid_accepted',
        farmName,
        productName,
        bidAmount,
        timestamp: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('❌ Error sending bid acceptance notification:', error);
    return null;
  }
};

/**
 * Example: Send a new auction notification
 */
export const sendNewAuctionNotification = async (
  deviceToken: string,
  farmName: string,
  productName: string,
  auctionId: string
): Promise<FCMSendNotificationResponse | null> => {
  try {
    return await sendNotificationToDevice(
      deviceToken,
      'ArgiMart - Đấu Giá Mới',
      `"${farmName}" vừa tạo đấu giá cho "${productName}"`,
      {
        type: 'new_auction',
        auctionId,
        farmName,
        productName,
        timestamp: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('❌ Error sending new auction notification:', error);
    return null;
  }
};

/**
 * Example: Send a system notification
 */
export const sendSystemNotification = async (
  deviceToken: string,
  message: string,
  additionalData?: Record<string, any>
): Promise<FCMSendNotificationResponse | null> => {
  try {
    return await sendNotificationToDevice(
      deviceToken,
      'ArgiMart',
      message,
      {
        type: 'system',
        timestamp: new Date().toISOString(),
        ...additionalData,
      }
    );
  } catch (error) {
    console.error('❌ Error sending system notification:', error);
    return null;
  }
};
