import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendLocalNotification, NotificationMessage } from './notificationService';
import { getAuctionLogs } from './auctionLogService';

const LAST_LOG_ID_KEY_PREFIX = 'lastLogId_';

// Global notification setter
let globalSetNotification: ((notification: NotificationMessage | null) => void) | null = null;

export const registerGlobalNotificationSetter = (
  setNotification: (notification: NotificationMessage | null) => void
) => {
  globalSetNotification = setNotification;
  console.log('Global notification setter registered');
};

/**
 * Get the last known log ID for an auction
 */
const getLastLogId = async (auctionId: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(`${LAST_LOG_ID_KEY_PREFIX}${auctionId}`);
  } catch (error) {
    console.error('Error getting last log ID:', error);
    return null;
  }
};

/**
 * Save the last log ID for an auction
 */
const saveLastLogId = async (auctionId: string, logId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(`${LAST_LOG_ID_KEY_PREFIX}${auctionId}`, logId);
  } catch (error) {
    console.error('Error saving last log ID:', error);
  }
};

/**
 * Get log type in Vietnamese
 */
const getLogTypeVietnamese = (logType: string): string => {
  const types: Record<string, string> = {
    'Create': 'Tạo mới',
    'StatusChange': 'Thay đổi trạng thái',
    'Publish': 'Công bố',
    'Update': 'Cập nhật',
  };
  return types[logType] || logType;
};

/**
 * Check for new auction logs and send notification
 */
export const checkForNewAuctionLogs = async (auctionId: string): Promise<boolean> => {
  try {
    // Fetch latest logs from API
    const logs = await getAuctionLogs(auctionId);

    if (logs.length === 0) {
      return false;
    }

    // Get the newest log
    const newestLog = logs[0]; // Assuming logs are sorted by newest first
    const lastLogId = await getLastLogId(auctionId);

    // If this is the first time, just save it
    if (!lastLogId) {
      await saveLastLogId(auctionId, newestLog.id);
      return false;
    }

    // Check if there's a new log
    if (newestLog.id !== lastLogId) {
      // Found a new log!
      await saveLastLogId(auctionId, newestLog.id);

      // Create notification
      const logTypeLabel = getLogTypeVietnamese(newestLog.type);
      const notification: NotificationMessage = {
        title: '📝 Cập nhật đấu giá',
        body: `${logTypeLabel} - ${new Date(newestLog.dateTimeUpdate).toLocaleTimeString('vi-VN')}`,
        auctionId,
        logId: newestLog.id,
        type: 'auction_log',
        data: {
          logType: newestLog.type,
          changeType: newestLog.type,
        },
      };

      // Send notification through multiple channels
      console.log('New auction log detected, sending notification:', notification);
      
      // Try global setter first (most reliable for React state)
      if (globalSetNotification) {
        globalSetNotification(notification);
        // Auto-clear after 5 seconds
        setTimeout(() => {
          globalSetNotification?.(null);
        }, 5000);
      }
      
      // Also send through service listeners as backup
      await sendLocalNotification(notification);

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking for new auction logs:', error);
    return false;
  }
};

/**
 * Setup polling for auction logs (runs every X seconds)
 */
export const setupAuctionLogPolling = (
  auctionId: string,
  intervalSeconds: number = 10,
  onNewLog?: (logId: string) => void
): (() => void) => {
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const startPolling = () => {
    pollInterval = setInterval(async () => {
      const hasNewLog = await checkForNewAuctionLogs(auctionId);
      if (hasNewLog && onNewLog) {
        const logs = await getAuctionLogs(auctionId);
        if (logs.length > 0) {
          onNewLog(logs[0].id);
        }
      }
    }, intervalSeconds * 1000);

    console.log(`Polling for auction logs started: ${auctionId} (interval: ${intervalSeconds}s)`);
  };

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
      console.log(`Polling for auction logs stopped: ${auctionId}`);
    }
  };

  startPolling();

  // Return cleanup function
  return stopPolling;
};

/**
 * Initialize auction log notifications for multiple auctions
 */
export const initializeAuctionLogNotifications = (
  auctionIds: string[],
  intervalSeconds: number = 10,
  onNewLog?: (auctionId: string, logId: string) => void
): (() => void) => {
  const cleanupFunctions: Array<() => void> = [];

  auctionIds.forEach((auctionId) => {
    const cleanup = setupAuctionLogPolling(auctionId, intervalSeconds, (logId) => {
      if (onNewLog) {
        onNewLog(auctionId, logId);
      }
    });
    cleanupFunctions.push(cleanup);
  });

  // Return cleanup function that stops all polling
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
};

/**
 * Clear all stored log IDs (useful for fresh start)
 */
export const clearAllLogIds = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const logIdKeys = allKeys.filter((key) => key.startsWith(LAST_LOG_ID_KEY_PREFIX));
    await AsyncStorage.multiRemove(logIdKeys);
    console.log(`Cleared ${logIdKeys.length} auction log IDs`);
  } catch (error) {
    console.error('Error clearing log IDs:', error);
  }
};

/**
 * Get all tracked auction IDs
 */
export const getTrackedAuctionIds = async (): Promise<string[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys
      .filter((key) => key.startsWith(LAST_LOG_ID_KEY_PREFIX))
      .map((key) => key.replace(LAST_LOG_ID_KEY_PREFIX, ''));
  } catch (error) {
    console.error('Error getting tracked auction IDs:', error);
    return [];
  }
};
