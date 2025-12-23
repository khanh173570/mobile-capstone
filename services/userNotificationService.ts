/**
 * User Notification Service
 * Handles user-specific notification REST API calls
 * GET /api/messaging-service/Notifications/user/{userId}?pageNumber=1&pageSize=10
 * GET /api/messaging-service/Notifications/user/{userId}/unread-count
 */

import { fetchWithTokenRefresh } from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://gateway.a-379.store/api';
const API_BASE_URL = `${API_URL}/messaging-service`;

export interface UserNotification {
  id: string;
  userId: string;
  type: number; // 1-16 notification type
  severity: number; // 0: Info, 1: Warning, 2: Critical
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  data: string | null; // JSON string
  relatedEntityId: string | null;
  relatedEntityType: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface NotificationResponse {
  notifications: UserNotification[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

/**
 * Get user ID from JWT token stored in AsyncStorage
 */
const getUserIdFromToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      console.error('❌ No access token found');
      return null;
    }

    // Decode JWT token to extract user ID
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('❌ Invalid token format');
      return null;
    }

    // Use atob for base64 decoding (available in React Native)
    const base64Payload = tokenParts[1];
    const decodedPayload = atob(base64Payload);
    const payload = JSON.parse(decodedPayload);
    
    const userId = payload.id || payload.sub || payload.uid || payload['user_id'] || payload.nameid || payload.UserId || payload.userId;

    if (!userId) {
      // console.error('❌ User ID not found in token payload');
      // console.error('Available fields:', Object.keys(payload));
      return null;
    }

    // //console.log('✅ User ID extracted from token:', userId.substring(0, 99) + '...');
    return userId;
  } catch (error) {
    // console.error('❌ Error extracting user ID from token:', error);
    return null;
  }
};

/**
 * Get notifications for current user
 * @param pageNumber - Page number (default: 1)
 * @param pageSize - Page size (default: 10)
 * @returns Array of notifications
 */
export const getUserNotifications = async (
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<UserNotification[]> => {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return [];
    }

    //console.log(`🔄 Fetching notifications for user: ${userId.substring(0, 8)}...`);
    //console.log(`   Page: ${pageNumber}, Size: ${pageSize}`);

    const url = `${API_BASE_URL}/Notifications/user/${userId}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    
    const response = await fetchWithTokenRefresh(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch notifications:', response.status, response.statusText);
      return [];
    }

    const notifications: UserNotification[] = await response.json();
    //console.log(`✅ Fetched ${notifications.length} notifications`);

    // Log first notification for debugging
    if (notifications.length > 0) {
      //console.log('📋 First notification:');
      //console.log('   - ID:', notifications[0].id);
      //console.log('   - Type:', notifications[0].type);
      //console.log('   - Title:', notifications[0].title);
      //console.log('   - IsRead:', notifications[0].isRead);
      //console.log('   - CreatedAt:', notifications[0].createdAt);
    }

    return notifications;
  } catch (error) {
    console.error('❌ Error fetching user notifications:', error);
    return [];
  }
};

/**
 * Get unread notification count for current user
 * @returns Number of unread notifications
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return 0;
    }

    // //console.log(`🔄 Fetching unread count for user: ${userId.substring(0, 8)}...`);

    const url = `${API_BASE_URL}/Notifications/user/${userId}/unread-count`;
    
    const response = await fetchWithTokenRefresh(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // console.error('❌ Failed to fetch unread count:', response.status, response.statusText);
      return 0;
    }

    const count = await response.json();
    // //console.log(`✅ Unread notification count: ${count}`);

    return count;
  } catch (error) {
    console.error('❌ Error fetching unread notification count:', error);
    return 0;
  }
};

/**
 * Mark notification as read
 * @param notificationId - Notification ID to mark as read
 * @returns Success boolean
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return false;
    }

    //console.log(`🔄 Marking notification as read: ${notificationId}`);

    const url = `${API_BASE_URL}/Notifications/${notificationId}/read`;
    
    const response = await fetchWithTokenRefresh(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to mark notification as read:', response.status, response.statusText);
      return false;
    }

    //console.log(`✅ Notification marked as read: ${notificationId}`);
    return true;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read for current user
 * @returns Success boolean
 */
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return false;
    }

    //console.log(`🔄 Marking all notifications as read for user: ${userId.substring(0, 8)}...`);

    const url = `${API_BASE_URL}/Notifications/user/${userId}/read-all`;
    
    const response = await fetchWithTokenRefresh(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to mark all notifications as read:', response.status, response.statusText);
      return false;
    }

    //console.log(`✅ All notifications marked as read`);
    return true;
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return false;
  }
};

/**
 * Get notification type name in Vietnamese
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
 * Get notification icon emoji
 */
export const getNotificationIcon = (type: number): string => {
  const icons: { [key: number]: string } = {
    1: '📉',
    2: '🏁',
    3: '🎉',
    4: '✅',
    5: '⏸️',
    6: '🚀',
    7: '📢',
    8: '💰',
    9: '💳',
    10: '💸',
    11: '🏧',
    12: '📅',
    13: '⏰',
    14: '⚠️',
    15: '🔴',
    16: '🆘',
  };
  return icons[type] || '📢';
};

/**
 * Get notification color based on severity
 */
export const getNotificationColor = (severity: number): string => {
  const colors: { [key: number]: string } = {
    0: '#3B82F6', // Info - Blue
    1: '#F59E0B', // Warning - Yellow
    2: '#EF4444', // Critical - Red
  };
  return colors[severity] || '#6B7280';
};
