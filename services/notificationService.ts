import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signalRService, NewNotificationEvent } from './signalRService';

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

/**
 * Register a notification listener (simplified helper)
 */
export const registerNotificationListener = (
  listener: NotificationListener
): NotificationListener => {
  notificationListeners.push(listener);
  return listener;
};

/**
 * Unregister a notification listener (simplified helper)
 */
export const unregisterNotificationListener = (
  listener: NotificationListener
): void => {
  notificationListeners = notificationListeners.filter((l) => l !== listener);
};

/**
 * ============================================================
 * Backend Notification API Methods (from Messaging Service)
 * ============================================================
 */

import Constants from 'expo-constants';
import { fetchWithTokenRefresh } from './authService';

/**
 * Backend Notification Interface
 */
export interface BackendNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: number; // 1-16 based on notification type
  severity: 'Info' | 'Warning' | 'Critical';
  auctionId?: string;
  escrowId?: string;
  relatedId?: string;
  isRead: boolean;
  readAt?: string;
  data?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
}

/**
 * Get unread notification count via SignalR
 * User is identified from JWT token in the SignalR connection
 * This retrieves the current unread count from the server for the authenticated user
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    if (!signalRService.isConnected()) {
      console.warn('⚠️ SignalR connection not available for getting unread count');
      return 0;
    }

    console.log('🔄 Fetching unread notification count for authenticated user...');
    const count = await signalRService.invoke<number>('GetUnreadNotificationCount');
    console.log('📊 Unread notifications count:', count, '(for current user from JWT token)');
    return count || 0;
  } catch (error) {
    console.error('❌ Error getting unread count via SignalR:', error);
    const errorMsg = String(error);
    if (errorMsg.includes('Method does not exist')) {
      console.warn('⚠️ GetUnreadNotificationCount method not implemented on backend');
    } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      console.error('❌ 401 Unauthorized - token might be invalid or expired');
    }
    return 0;
  }
};

/**
 * Get all notifications for current user via SignalR
 * Backend will identify current user from JWT token in the connection
 * Purely backend-driven, no local caching
 */
export const getMyNotifications = async (): Promise<BackendNotification[]> => {
  try {
    // First try SignalR if connected
    if (signalRService.isConnected()) {
      console.log('🔍 Fetching notifications from backend (user identified via JWT token)...');
      
      // Try GetMyNotifications first
      try {
        const notifications = await signalRService.invoke<BackendNotification[]>('GetMyNotifications');
        if (notifications) {
          console.log('📋 Fetched', notifications.length || 0, 'notifications from SignalR (GetMyNotifications)');
          console.log('✅ Notifications are for the current logged-in user (from JWT token)');
          return notifications;
        }
      } catch (error1) {
        console.warn('⚠️ GetMyNotifications method not available, trying GetAllNotifications...');
        
        // Try alternative method name
        try {
          const notifications = await signalRService.invoke<BackendNotification[]>('GetAllNotifications');
          if (notifications) {
            console.log('📋 Fetched', notifications.length || 0, 'notifications from SignalR (GetAllNotifications)');
            console.log('✅ Notifications are for the current logged-in user (from JWT token)');
            return notifications;
          }
        } catch (error2) {
          console.warn('⚠️ GetAllNotifications also not available');
          const errorMsg = (error1 as any)?.message || String(error1);
          if (!errorMsg.includes('Method does not exist')) {
            console.error('❌ Unexpected SignalR error:', error1);
          }
        }
      }
    }

    console.log('📋 No notifications available from backend');
    return [];
  } catch (error) {
    console.error('❌ Unexpected error in getMyNotifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 * NOTE: Not implemented in backend REST API - notifications are managed via SignalR events
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  console.warn('markNotificationAsRead: Not implemented - managed via SignalR events');
  return false;
};

/**
 * Mark all notifications as read
 * NOTE: Not implemented in backend REST API - notifications are managed via SignalR events
 */
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  console.warn('markAllNotificationsAsRead: Not implemented - managed via SignalR events');
  return false;
};

/**
 * Delete notification
 * NOTE: Not implemented in backend REST API - notifications are managed via SignalR events
 */
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  console.warn('deleteNotification: Not implemented - managed via SignalR events');
  return false;
};

/**
 * Get notification type name and description
 * Types from backend:
 * 1: Outbid - Bị vượt giá (Wholesaler)
 * 2: Auction Ended - Đấu giá kết thúc (Both)
 * 3: Auction Won - Thắng đấu giá (Wholesaler)
 * 4: Auction Approved - Đấu giá được phê duyệt (Farmer)
 * 5: Auction Paused - Đấu giá bị tạm dừng (Both)
 * 6: Auction Started - Đấu giá đã bắt đầu (Both)
 * 7: System - Thông báo hệ thống (Both)
 * 8: Escrow Deposit - Cọc được cập nhật (Both)
 * 9: Remaining Payment - Thanh toán phần còn lại (Both)
 * 10: Escrow Release - Cọc được phát hành (Farmer)
 * 11: Wallet Funds - Thêm tiền vào ví (Both)
 * 12: Harvest Reminder -7 days (Farmer)
 * 13: Harvest Reminder -3 days (Farmer)
 * 14: Harvest Reminder -1 days (Farmer)
 * 15: Harvest Reminder 0 days (Farmer)
 * 16: Harvest Reminder +1 days (Farmer)
 */
export const getNotificationTypeName = (type: number): string => {
  const typeNames: { [key: number]: string } = {
    1: 'Bị vượt giá',
    2: 'Đấu giá kết thúc',
    3: 'Thắng đấu giá',
    4: 'Đấu giá được phê duyệt',
    5: 'Đấu giá bị tạm dừng',
    6: 'Đấu giá đã bắt đầu',
    7: 'Thông báo hệ thống',
    8: 'Cập nhật cọc',
    9: 'Thanh toán phần còn lại',
    10: 'Cọc được phát hành',
    11: 'Thêm tiền vào ví',
    12: 'Nhắc nhở: 7 ngày',
    13: 'Nhắc nhở: 3 ngày',
    14: 'Nhắc nhở: 1 ngày',
    15: 'Nhắc nhở: Hôm nay',
    16: 'Nhắc nhở: Quá hạn',
  };
  return typeNames[type] || 'Thông báo';
};

/**
 * Get notification type color based on severity/type
 */
export const getNotificationTypeColor = (type: number): string => {
  const colors: { [key: number]: string } = {
    1: '#EF4444',   // Outbid - Red
    2: '#6B7280',   // Ended - Gray
    3: '#10B981',   // Won - Green
    4: '#3B82F6',   // Approved - Blue
    5: '#F59E0B',   // Paused - Yellow
    6: '#3B82F6',   // Started - Blue
    7: '#6B7280',   // System - Gray
    8: '#10B981',   // Deposit - Green
    9: '#10B981',   // Payment - Green
    10: '#10B981',  // Released - Green
    11: '#10B981',  // Funds - Green
    12: '#3B82F6',  // Reminder -7 - Blue
    13: '#F59E0B',  // Reminder -3 - Yellow
    14: '#F59E0B',  // Reminder -1 - Yellow
    15: '#EF4444',  // Reminder 0 - Red
    16: '#EF4444',  // Reminder +1 - Red
  };
  return colors[type] || '#6B7280';
};

/**
 * Get notification icon emoji based on type
 */
export const getNotificationIcon = (type: number): string => {
  const icons: { [key: number]: string } = {
    1: '📉',    // Outbid
    2: '🏁',    // Ended
    3: '🎉',    // Won
    4: '✅',    // Approved
    5: '⏸️',    // Paused
    6: '🚀',    // Started
    7: '📢',    // System
    8: '💰',    // Deposit
    9: '💳',    // Payment
    10: '💸',   // Released
    11: '🏧',   // Funds
    12: '📅',   // Reminder
    13: '⏰',   // Reminder
    14: '⚠️',    // Reminder
    15: '🔴',   // Reminder
    16: '🆘',   // Reminder
  };
  return icons[type] || '📢';
};

/**
 * Filter notifications by role
 * 
 * Farmer sees:
 * - Auction Approved (4) - Thông báo đấu giá của tôi được phê duyệt
 * - Escrow Release (10) - Cọc được phát hành
 * - Wallet Funds (11) - Tiền được gửi vào ví
 * - Harvest Reminders (12-16) - Nhắc nhở thu hoạch
 * - Escrow Deposit (8) - Thương lái thanh toán cọc
 * 
 * Wholesaler sees:
 * - Outbid (1) - Bị vượt giá trong đấu giá
 * - Auction Ended (2) - Đấu giá kết thúc
 * - Auction Won (3) - Thắng đấu giá
 * - Auction Paused (5) - Đấu giá bị tạm dừng
 * - Auction Started (6) - Đấu giá bắt đầu
 * - Escrow Deposit (8) - Cập nhật cọc
 * - Remaining Payment (9) - Thanh toán phần còn lại
 * - Wallet Funds (11) - Tiền được gửi vào ví
 */
export const filterNotificationsByRole = (notifications: BackendNotification[], role: 'farmer' | 'wholesaler'): BackendNotification[] => {
  if (role === 'farmer') {
    const filtered = notifications.filter(n => {
      const type = n.type;
      const shouldInclude = type === 4 || type === 10 || type === 11 || (type >= 12 && type <= 16) || type === 8;
      console.log(`  [Filter] Type ${type} (${getNotificationTypeName(type)}) - Include: ${shouldInclude}`);
      return shouldInclude;
    });
    console.log(`[Filter] Farmer: ${notifications.length} → ${filtered.length} notifications`);
    return filtered;
  } else {
    // Wholesaler
    const filtered = notifications.filter(n => {
      const type = n.type;
      const shouldInclude = (type >= 1 && type <= 6) || type === 8 || type === 9 || type === 11;
      console.log(`  [Filter] Type ${type} (${getNotificationTypeName(type)}) - Include: ${shouldInclude}`);
      return shouldInclude;
    });
    console.log(`[Filter] Wholesaler: ${notifications.length} → ${filtered.length} notifications`);
    return filtered;
  }
};

/**
 * Setup SignalR listeners for real-time notifications
 * Listens for 'ReceiveNotification' and specific notification type events from SignalR
 * Caches received notifications to AsyncStorage for offline access
 */
export const setupSignalRNotificationListeners = (onNewNotification: (notification: NewNotificationEvent) => void): (() => void) => {
  console.log('🔔 Setting up SignalR notification listener...');
  
  // Listen to ReceiveNotification events from SignalR
  const unsubscribe = signalRService.onNewNotification((event: NewNotificationEvent) => {
    console.log('📨 Real-time notification received via SignalR:', event);
    console.log('  - ID:', event.id);
    console.log('  - Type:', event.type);
    console.log('  - Title:', event.title);
    console.log('  - Message:', event.message);
    console.log('  - Severity:', event.severity);
    
    // If title or message is missing, generate from type
    let title = event.title || getNotificationTypeName(event.type);
    let message = event.message || `Notification type ${event.type}`;
    
    if (!event.title) {
      console.warn('⚠️ Backend did not send title, using type-based title:', title);
    }
    if (!event.message) {
      console.warn('⚠️ Backend did not send message, using default:', message);
    }
    
    // Ensure the event has title and message
    const enrichedEvent: NewNotificationEvent = {
      ...event,
      title,
      message,
    };
    
    // Parse data if it's a JSON string
    let parsedData: Record<string, any> | undefined;
    if (enrichedEvent.data) {
      try {
        parsedData = typeof enrichedEvent.data === 'string' ? JSON.parse(enrichedEvent.data) : enrichedEvent.data;
      } catch (e) {
        console.warn('Failed to parse notification data:', e);
      }
    }
    
    // Send local notification
    sendLocalNotification({
      title: enrichedEvent.title,
      body: enrichedEvent.message,
      type: 'system',
      data: parsedData,
    });
    
    // Call the callback with the enriched notification
    onNewNotification(enrichedEvent);
  });
  
  console.log('✅ SignalR notification listener registered');
  
  return unsubscribe;
};

/**
 * Initialize SignalR connection for notifications
 */
export const initializeSignalRConnection = async (): Promise<void> => {
  try {
    if (!signalRService.isConnected()) {
      console.log('🔌 Initializing SignalR connection for notifications...');
      await signalRService.connect();
      console.log('✅ SignalR connection established');
    } else {
      console.log('✅ SignalR already connected');
    }
  } catch (error) {
    console.error('❌ Failed to initialize SignalR connection:', error);
  }
};
