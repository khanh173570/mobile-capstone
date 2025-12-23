/**
 * FCM Send Notification Service
 * Handles sending FCM notifications to device tokens
 * POST /api/messaging-service/Test/fcm-send-to-token
 */

import { fetchWithTokenRefresh } from './authService';
import axios from 'axios';
import Constants from 'expo-constants';

const BASE_API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://gateway.a-379.store/api';
const API_URL = `${BASE_API_URL}/messaging-service/Test/fcm-send-to-token`;

/**
 * FCM Send Notification Request
 */
export interface FCMSendNotificationRequest {
  deviceToken: string;
  title: string;
  body: string;
  dataJson?: Record<string, any>; // Optional additional data
}

/**
 * FCM Send Notification Response
 */
export interface FCMSendNotificationResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: string[] | null;
  data: {
    deviceToken: string;
    title: string;
    body: string;
    data: Record<string, any>;
  };
}

/**
 * Send FCM notification to a specific device token
 * @param request - FCMSendNotificationRequest object
 * @returns Promise<FCMSendNotificationResponse>
 */
export const sendFCMNotification = async (
  request: FCMSendNotificationRequest
): Promise<FCMSendNotificationResponse> => {
  try {
    //console.log('📤 Sending FCM notification...');
    //console.log('  Device Token:', request.deviceToken);
    //console.log('  Title:', request.title);
    //console.log('  Body:', request.body);
    //console.log('  Data:', request.dataJson);

    // Build query parameters
    const params = new URLSearchParams();
    params.append('deviceToken', request.deviceToken);
    params.append('title', request.title);
    params.append('body', request.body);

    // Add dataJson if provided
    if (request.dataJson) {
      params.append('dataJson', JSON.stringify(request.dataJson));
    }

    const url = `${API_URL}?${params.toString()}`;

    //console.log('  URL:', url);

    // Make the API call
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    //console.log('✅ FCM notification sent successfully');
    //console.log('  Response:', response.data);

    return response.data as FCMSendNotificationResponse;
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);

    if (axios.isAxiosError(error)) {
      console.error('  Status:', error.response?.status);
      console.error('  Data:', error.response?.data);
    }

    throw error;
  }
};

/**
 * Send FCM notification with simplified parameters
 * @param deviceToken - Device token to send notification to
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional additional data
 * @returns Promise<FCMSendNotificationResponse>
 */
export const sendSimpleFCMNotification = async (
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<FCMSendNotificationResponse> => {
  return sendFCMNotification({
    deviceToken,
    title,
    body,
    dataJson: data,
  });
};

/**
 * Send FCM notification to multiple device tokens
 * @param deviceTokens - Array of device tokens
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional additional data
 * @returns Promise<FCMSendNotificationResponse[]>
 */
export const sendFCMNotificationToMultipleTokens = async (
  deviceTokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<FCMSendNotificationResponse[]> => {
  try {
    // //console.log(`📤 Sending FCM notification to ${deviceTokens.length} devices...`);

    const promises = deviceTokens.map((deviceToken) =>
      sendFCMNotification({
        deviceToken,
        title,
        body,
        dataJson: data,
      })
    );

    const results = await Promise.all(promises);

    // //console.log(`✅ FCM notifications sent to ${deviceTokens.length} devices`);

    return results;
  } catch (error) {
    console.error('❌ Error sending FCM notifications to multiple devices:', error);
    throw error;
  }
};
