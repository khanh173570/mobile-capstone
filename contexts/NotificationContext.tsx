import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signalRService, NewNotificationEvent } from '../services/signalRService';
import { BackendNotification } from '../services/notificationService';
import { 
  getUserNotifications, 
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  UserNotification 
} from '../services/userNotificationService';

interface NotificationContextType {
  notifications: BackendNotification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  latestNotification: BackendNotification | null; // Latest notification from SignalR for popup
  refreshNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => void;
  dismissLatestNotification: () => void; // Dismiss the popup
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  role: 'farmer' | 'wholesaler';
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, role }) => {
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [latestNotification, setLatestNotification] = useState<BackendNotification | null>(null);

  // Convert UserNotification to BackendNotification format
  const convertToBackendNotification = useCallback((userNotif: UserNotification): BackendNotification => {
    // Parse severity number to string
    let severity: 'Info' | 'Warning' | 'Critical' = 'Info';
    if (userNotif.severity === 1) {
      severity = 'Warning';
    } else if (userNotif.severity === 2) {
      severity = 'Critical';
    }

    // Determine auctionId and escrowId from relatedEntityType
    let auctionId: string | undefined;
    let escrowId: string | undefined;
    if (userNotif.relatedEntityType === 'Auction' && userNotif.relatedEntityId) {
      auctionId = userNotif.relatedEntityId;
    } else if (userNotif.relatedEntityType === 'Escrow' && userNotif.relatedEntityId) {
      escrowId = userNotif.relatedEntityId;
    }

    return {
      id: userNotif.id,
      userId: userNotif.userId,
      title: userNotif.title,
      message: userNotif.message,
      type: userNotif.type,
      severity,
      auctionId,
      escrowId,
      relatedId: userNotif.relatedEntityId || undefined,
      isRead: userNotif.isRead,
      readAt: userNotif.readAt || undefined,
      data: userNotif.data || undefined,
      relatedEntityId: userNotif.relatedEntityId || undefined,
      relatedEntityType: userNotif.relatedEntityType || undefined,
      createdAt: userNotif.createdAt,
    };
  }, []);

  // Load notifications from backend via REST API
  const refreshNotifications = useCallback(async () => {
    try {
      // Check if user is authenticated before loading notifications
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('⚠️ [NotificationContext] No access token, skipping notification load');
        return;
      }

      setIsLoading(true);
      // console.log('🔄 [NotificationContext] Loading notifications from REST API...');
      
      // Get notifications from REST API (page 1, 50 items)
      const userNotifications = await getUserNotifications(1, 50);
      
      // Convert to BackendNotification format
      const backendNotifications = userNotifications.map(convertToBackendNotification);
      
      setNotifications(backendNotifications);
      
      // ALWAYS use API unread count as source of truth (not local calculation)
      // Local list may only have 50 items, but total unread could be more
      try {
        const apiCount = await getUnreadNotificationCount();
        setUnreadCount(apiCount);
        const localUnread = backendNotifications.filter(n => !n.isRead).length;
        console.log(`✅ [NotificationContext] Loaded ${backendNotifications.length} notifications`);
        console.log(`📊 [NotificationContext] Unread count: API=${apiCount}, Local list=${localUnread} (using API)`);
      } catch (apiError) {
        // Fallback: calculate from loaded notifications if API fails
        const localUnread = backendNotifications.filter(n => !n.isRead).length;
        setUnreadCount(localUnread);
        console.warn('⚠️ [NotificationContext] Failed to get API unread count, using local count:', localUnread);
      }
    } catch (error) {
      console.error('❌ [NotificationContext] Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [convertToBackendNotification]);

  // Refresh unread count - sync with API (source of truth)
  const refreshUnreadCount = useCallback(async () => {
    try {
      // Check if user is authenticated before getting unread count
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('⚠️ [NotificationContext] No access token, skipping unread count');
        setUnreadCount(0);
        return;
      }

      const apiCount = await getUnreadNotificationCount();
      setUnreadCount(apiCount);
      console.log(`📊 [NotificationContext] Unread count synced from API: ${apiCount}`);
    } catch (error) {
      console.error('❌ [NotificationContext] Error getting unread count:', error);
      // Fallback: calculate from notifications list (but this may be inaccurate if there are more than 50 notifications)
      setNotifications((prev) => {
        const localCount = prev.filter(n => !n.isRead).length;
        console.warn(`⚠️ [NotificationContext] Using local unread count (may be inaccurate): ${localCount}`);
        setUnreadCount(localCount);
        return prev;
      });
    }
  }, []);

  // Check SignalR connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(signalRService.isConnected());
    };

    checkConnection();
    const unsubscribe = signalRService.onConnectionStateChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        // Refresh notifications when reconnected
        refreshNotifications();
        refreshUnreadCount();
      }
    });

    return unsubscribe;
  }, [refreshNotifications, refreshUnreadCount]);

  // Setup SignalR notification listener
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    console.log('🔔 [NotificationContext] Setting up SignalR notification listener for role:', role);

    const unsubscribe = signalRService.onNewNotification((event: NewNotificationEvent) => {
      // Validate event before processing
      if (!event || !event.id || !event.title || !event.message || event.type === undefined) {
        console.error('❌ [NotificationContext] Invalid notification event received:', event);
        return;
      }
      
      console.log('📨 [NotificationContext] New notification received:', {
        id: event.id,
        type: event.type,
        title: event.title,
        message: event.message?.substring(0, 50) + '...',
      });

      // Parse data to extract auctionId if available
      let parsedData: any = null;
      let extractedAuctionId: string | undefined = undefined;
      if (event.data) {
        try {
          parsedData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          // Extract auctionId from data if available
          if (parsedData?.auctionId) {
            extractedAuctionId = parsedData.auctionId;
          } else if (parsedData?.AuctionId) {
            extractedAuctionId = parsedData.AuctionId;
          }
        } catch (e) {
          console.warn('[NotificationContext] Failed to parse notification data:', e);
        }
      }

      // Convert NewNotificationEvent to BackendNotification format
      const backendNotification: BackendNotification = {
        id: event.id,
        userId: event.userId,
        title: event.title || `Notification type ${event.type}`,
        message: event.message || '',
        type: event.type,
        severity: event.severity === 'Info' ? 'Info' : event.severity === 'Warning' ? 'Warning' : 'Critical',
        // Priority: extracted from data > relatedEntityId (if type is Auction) > undefined
        auctionId: extractedAuctionId || (event.relatedEntityType === 'Auction' ? event.relatedEntityId : undefined),
        escrowId: event.relatedEntityType === 'Escrow' ? event.relatedEntityId : undefined,
        relatedId: event.relatedEntityId,
        isRead: event.isRead || false,
        readAt: event.readAt,
        data: event.data,
        relatedEntityId: event.relatedEntityId,
        relatedEntityType: event.relatedEntityType,
        createdAt: event.createdAt,
      };
      
      // Log for debugging
      if (event.type === 1) { // Outbid
        console.log('🔍 [NotificationContext] Outbid notification details:', {
          id: backendNotification.id,
          auctionId: backendNotification.auctionId,
          relatedEntityId: backendNotification.relatedEntityId,
          relatedEntityType: backendNotification.relatedEntityType,
          data: backendNotification.data,
          extractedAuctionId,
        });
      }

      // Add to notifications list (at the top)
      setNotifications((prev) => {
        // Check if notification already exists (avoid duplicates)
        const exists = prev.some((n) => n.id === event.id);
        if (exists) {
          console.log('⚠️ [NotificationContext] Notification already exists, skipping duplicate');
          return prev;
        }
        return [backendNotification, ...prev];
      });

      // Set as latest notification for popup display
      setLatestNotification(backendNotification);
      console.log('🔔 [NotificationContext] Setting latest notification for popup:', backendNotification.title);

      // Update unread count: increment by 1 when new notification arrives via SignalR
      // This ensures real-time update without waiting for API refresh
      setUnreadCount((prev) => {
        const newCount = prev + 1;
        console.log(`📈 [NotificationContext] Unread count incremented: ${prev} → ${newCount}`);
        return newCount;
      });

      // Also refresh from API to ensure accuracy (but don't wait for it)
      refreshUnreadCount().catch(() => {
        // Silent fail - we already incremented locally
      });
    });

    return unsubscribe;
  }, [isConnected, role, refreshUnreadCount]);

  // Mark notification as read via REST API
  const markAsRead = useCallback(async (notificationId: string) => {
    // Update local state immediately
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n
      )
    );

    // Update unread count immediately (optimistic update)
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Mark as read on backend via REST API
    try {
      await markNotificationAsRead(notificationId);
      console.log(`✅ [NotificationContext] Marked notification ${notificationId} as read`);
      
      // Sync unread count with API after marking as read to ensure accuracy
      refreshUnreadCount().catch(() => {
        // Silent fail - optimistic update already done
      });
    } catch (error) {
      console.error('❌ [NotificationContext] Error marking notification as read:', error);
      // Revert optimistic update on error
      setUnreadCount((prev) => prev + 1);
    }
  }, [refreshUnreadCount]);

  // Mark all as read via REST API
  const markAllAsRead = useCallback(async () => {
    // Update local state immediately
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
      }))
    );

    // Reset unread count immediately (optimistic update)
    setUnreadCount(0);

    // Mark all as read on backend via REST API
    try {
      await markAllNotificationsAsRead();
      console.log('✅ [NotificationContext] Marked all notifications as read');
      
      // Sync unread count with API after marking all as read to ensure accuracy
      refreshUnreadCount().catch(() => {
        // Silent fail - optimistic update already done
      });
    } catch (error) {
      console.error('❌ [NotificationContext] Error marking all notifications as read:', error);
      // Revert: refresh from API to get correct count
      refreshUnreadCount();
    }
  }, [refreshUnreadCount]);

  // Delete notification
  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId);
      const updated = prev.filter((n) => n.id !== notificationId);
      
      // Update unread count if deleted notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      
      return updated;
    });

    // Try to delete on backend via SignalR (if method exists)
    try {
      signalRService.invoke('DeleteNotification', notificationId);
    } catch (error) {
      // Method might not exist, that's okay
      console.warn('⚠️ [NotificationContext] DeleteNotification method not available');
    }
  }, []);

  // Dismiss latest notification popup
  const dismissLatestNotification = useCallback(() => {
    setLatestNotification(null);
  }, []);

  // Initial load on mount - only if user is authenticated
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          // User is authenticated, load notifications
          await refreshNotifications();
          await refreshUnreadCount();
        } else {
          console.log('ℹ️ [NotificationContext] User not authenticated, skipping notification load');
        }
      } catch (error) {
        console.error('❌ [NotificationContext] Error checking auth:', error);
      }
    };

    checkAuthAndLoad();
  }, [refreshNotifications, refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isConnected,
        latestNotification,
        refreshNotifications,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        dismissLatestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

