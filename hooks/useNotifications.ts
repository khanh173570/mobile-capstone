import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setupNotificationListeners,
  NotificationMessage,
} from '../services/notificationService';
import {
  checkForNewAuctionLogs,
  setupAuctionLogPolling,
} from '../services/auctionLogNotificationService';

export const useNotifications = () => {
  const [notification, setNotification] = useState<NotificationMessage | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Setup notification listeners
    const cleanup = setupNotificationListeners(
      (receivedNotification) => {
        setNotification(receivedNotification);

        // Auto-clear after notification is shown
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        notificationTimeoutRef.current = setTimeout(() => {
          setNotification(null);
        }, 5000);
      },
      (responseNotification) => {
        // Handle tap on notification
        //console.log('Notification tapped:', responseNotification);
        setNotification(null);
      }
    );

    return () => {
      cleanup();
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  return { notification, setNotification };
};

interface UseAuctionLogPollingOptions {
  auctionIds: string[];
  intervalSeconds?: number;
  onNewLog?: (auctionId: string, logId: string) => void;
  enabled?: boolean;
}

export const useAuctionLogPolling = ({
  auctionIds,
  intervalSeconds = 10,
  onNewLog,
  enabled = true,
}: UseAuctionLogPollingOptions) => {
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!enabled || auctionIds.length === 0) {
      return;
    }

    // Setup polling for each auction
    auctionIds.forEach((auctionId) => {
      const cleanup = setupAuctionLogPolling(auctionId, intervalSeconds, (logId) => {
        if (onNewLog) {
          onNewLog(auctionId, logId);
        }
      });
      cleanupFunctionsRef.current.push(cleanup);
    });

    return () => {
      // Cleanup all polling
      cleanupFunctionsRef.current.forEach((cleanup) => cleanup());
      cleanupFunctionsRef.current = [];
    };
  }, [auctionIds, intervalSeconds, enabled, onNewLog]);
};

interface UseSingleAuctionLogPollingOptions {
  auctionId: string | null;
  intervalSeconds?: number;
  onNewLog?: (logId: string) => void;
  enabled?: boolean;
  resetOnMount?: boolean;
}

export const useSingleAuctionLogPolling = ({
  auctionId,
  intervalSeconds = 10,
  onNewLog,
  enabled = true,
  resetOnMount = false,
}: UseSingleAuctionLogPollingOptions) => {
  const cleanupFunctionRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !auctionId) {
      return;
    }

    const initializePolling = async () => {
      // Reset AsyncStorage khi component mount nếu resetOnMount = true
      if (resetOnMount && !isInitializedRef.current) {
        const key = `lastLogId_${auctionId}`;
        try {
          await AsyncStorage.removeItem(key);
          // //console.log(`✓ Reset auction log cache for ${auctionId}`);
        } catch (error) {
          console.error('Error resetting cache:', error);
        }
        isInitializedRef.current = true;
      }

      // Setup polling
      cleanupFunctionRef.current = setupAuctionLogPolling(
        auctionId,
        intervalSeconds,
        onNewLog
      );
    };

    initializePolling();

    return () => {
      if (cleanupFunctionRef.current) {
        cleanupFunctionRef.current();
      }
    };
  }, [auctionId, intervalSeconds, enabled, onNewLog, resetOnMount]);
};

/**
 * Check for new log immediately
 */
export const useCheckNewAuctionLog = (auctionId: string | null) => {
  const [hasNewLog, setHasNewLog] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkNewLog = async () => {
    if (!auctionId) return;

    setLoading(true);
    try {
      const isNew = await checkForNewAuctionLogs(auctionId);
      setHasNewLog(isNew);
    } catch (error) {
      console.error('Error checking for new log:', error);
    } finally {
      setLoading(false);
    }
  };

  return { hasNewLog, loading, checkNewLog };
};
