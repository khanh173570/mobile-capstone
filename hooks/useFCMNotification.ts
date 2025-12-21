/**
 * Hook for sending FCM notifications
 */

import { useState } from 'react';
import {
  sendFCMNotification,
  sendSimpleFCMNotification,
  sendFCMNotificationToMultipleTokens,
  FCMSendNotificationRequest,
  FCMSendNotificationResponse,
} from '../services/fcmSendNotificationService';

/**
 * Hook for sending FCM notifications
 */
export const useFCMNotification = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [response, setResponse] = useState<FCMSendNotificationResponse | null>(null);

  /**
   * Send FCM notification
   */
  const send = async (request: FCMSendNotificationRequest) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const result = await sendFCMNotification(request);
      setResponse(result);
      setSuccess(result.isSuccess);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notification';
      setError(errorMessage);
      setSuccess(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send simple FCM notification with basic parameters
   */
  const sendSimple = async (
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    return send({
      deviceToken,
      title,
      body,
      dataJson: data,
    });
  };

  /**
   * Send FCM notification to multiple device tokens
   */
  const sendToMultiple = async (
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const results = await sendFCMNotificationToMultipleTokens(deviceTokens, title, body, data);
      const allSuccess = results.every((r) => r.isSuccess);

      setSuccess(allSuccess);
      if (results.length > 0) {
        setResponse(results[0]);
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notifications';
      setError(errorMessage);
      setSuccess(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset state
   */
  const reset = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setResponse(null);
  };

  return {
    loading,
    error,
    success,
    response,
    send,
    sendSimple,
    sendToMultiple,
    reset,
  };
};
