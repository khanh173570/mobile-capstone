/**
 * Log Capture Service
 * Captures all console logs related to Firebase and device token setup
 * Displays them in a modal for user to see initialization progress
 */

let capturedLogs: string[] = [];
let isCapturing = false;
let originalLog: any;
let originalWarn: any;
let originalError: any;

/**
 * Start capturing logs
 * Override console methods to capture Firebase-related logs
 */
export const startLogCapture = () => {
  if (isCapturing) return;

  capturedLogs = [];
  isCapturing = true;

  // Store original console methods
  originalLog = console.log;
  originalWarn = console.warn;
  originalError = console.error;

  // Override console.log
  console.log = (...args: any[]) => {
    const message = args.map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.toString();
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }).join(' ');

    // Capture Firebase-related logs
    if (
      message.includes('[Setup]') ||
      message.includes('[Firebase]') ||
      message.includes('🔥') ||
      message.includes('📱') ||
      message.includes('✓') ||
      message.includes('✅') ||
      message.includes('Firebase') ||
      message.includes('FCM') ||
      message.includes('token') ||
      message.includes('Expo') ||
      message.includes('notification') ||
      message.includes('[Register]') ||
      message.includes('[Startup]')
    ) {
      capturedLogs.push(`ℹ️ ${message}`);
    }

    // Also call original console.log
    originalLog(...args);
  };

  // Override console.warn
  console.warn = (...args: any[]) => {
    const message = args.map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.toString();
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }).join(' ');

    // Capture all warnings
    capturedLogs.push(`⚠️ ${message}`);
    originalWarn(...args);
  };

  // Override console.error
  console.error = (...args: any[]) => {
    const message = args.map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.toString();
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }).join(' ');

    // Capture all errors
    capturedLogs.push(`❌ ${message}`);
    originalError(...args);
  };
};

/**
 * Stop capturing logs and restore original console methods
 */
export const stopLogCapture = () => {
  if (!isCapturing) return;

  isCapturing = false;

  if (originalLog) console.log = originalLog;
  if (originalWarn) console.warn = originalWarn;
  if (originalError) console.error = originalError;
};

/**
 * Get all captured logs
 */
export const getCapturedLogs = (): string[] => {
  return [...capturedLogs];
};

/**
 * Clear captured logs
 */
export const clearLogs = () => {
  capturedLogs = [];
};

/**
 * Add a manual log entry
 */
export const addLog = (message: string) => {
  capturedLogs.push(message);
};

/**
 * Get logs as formatted string
 */
export const getLogsAsText = (): string => {
  return capturedLogs.join('\n');
};

/**
 * Get logs grouped by category
 */
export const getLogsGrouped = (): Record<string, string[]> => {
  const grouped: Record<string, string[]> = {
    firebase: [],
    fcm: [],
    expo: [],
    setup: [],
    register: [],
    error: [],
    warning: [],
    info: [],
  };

  capturedLogs.forEach((log) => {
    if (log.includes('❌')) {
      grouped.error.push(log);
    } else if (log.includes('⚠️')) {
      grouped.warning.push(log);
    } else if (log.includes('Firebase') || log.includes('firebase')) {
      grouped.firebase.push(log);
    } else if (log.includes('FCM') || log.includes('fcm')) {
      grouped.fcm.push(log);
    } else if (log.includes('Expo') || log.includes('expo')) {
      grouped.expo.push(log);
    } else if (log.includes('[Setup]')) {
      grouped.setup.push(log);
    } else if (log.includes('[Register]')) {
      grouped.register.push(log);
    } else {
      grouped.info.push(log);
    }
  });

  // Remove empty categories
  Object.keys(grouped).forEach((key) => {
    if (grouped[key].length === 0) {
      delete grouped[key];
    }
  });

  return grouped;
};

export default {
  startLogCapture,
  stopLogCapture,
  getCapturedLogs,
  clearLogs,
  addLog,
  getLogsAsText,
  getLogsGrouped,
};
