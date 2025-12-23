import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { printPushNotificationDiagnostics, setupPushNotifications } from '../../services/pushNotificationService';

// Global log interceptor
const originalLog = //console.log;
const originalWarn = console.warn;
const originalError = console.error;

let globalLogs: string[] = [];

const setupLogInterceptor = (setLogs: Function) => {
  //console.log = (...args: any[]) => {
    originalLog(...args);
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    globalLogs.push(`📝 ${message}`);
    if (globalLogs.length > 200) globalLogs.shift(); // Keep last 200 logs
    setLogs([...globalLogs]);
  };

  console.warn = (...args: any[]) => {
    originalWarn(...args);
    const message = args.join(' ');
    globalLogs.push(`⚠️  ${message}`);
    if (globalLogs.length > 200) globalLogs.shift();
    setLogs([...globalLogs]);
  };

  console.error = (...args: any[]) => {
    originalError(...args);
    const message = args.join(' ');
    globalLogs.push(`❌ ${message}`);
    if (globalLogs.length > 200) globalLogs.shift();
    setLogs([...globalLogs]);
  };
};

const restoreConsole = () => {
  //console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;
};

/**
 * Test component to verify push notification setup
 * Use this to debug token issues when building APK
 * 
 * APK Build Success Checklist:
 * ✅ Firebase Available: YES
 * ✅ FCM Token: Present (140+ chars)
 * ✅ Expo Token: Present (ExponentPushToken[...])
 * ✅ Both registered to backend
 * 
 * Expo Go Success Checklist:
 * ✅ Firebase Available: NO (normal)
 * ✅ Expo Token: Present
 * ✅ Registered to backend
 */
export default function TestPushNotificationSetup() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Setup log interception when component mounts
    setupLogInterceptor(setLogs);

    return () => {
      // Restore console when component unmounts
      restoreConsole();
    };
  }, []);

  const addLog = (message: string) => {
    globalLogs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
    if (globalLogs.length > 200) globalLogs.shift();
    setLogs([...globalLogs]);
  };

  const handleDiagnostics = async () => {
    setLoading(true);
    try {
      addLog('🔍 Running diagnostics...');
      
      // Call the diagnostic function (will log to console + intercepted)
      await printPushNotificationDiagnostics();
      
      // Also collect local data
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      const expoPushToken = await AsyncStorage.getItem('expoPushToken');
      const userId = await AsyncStorage.getItem('user');
      
      addLog('');
      addLog('📊 LOCAL STORAGE DATA:');
      addLog(`FCM Token: ${fcmToken ? `✅ ${fcmToken.length} chars` : '❌ NOT FOUND'}`);
      addLog(`Expo Token: ${expoPushToken ? `✅ ${expoPushToken}` : '❌ NOT FOUND'}`);
      addLog(`User ID: ${userId ? `✅ Present` : '❌ NOT FOUND'}`);
      
      addLog('');
      addLog('✅ Diagnostics complete');
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupTokens = async () => {
    setLoading(true);
    try {
      addLog('🚀 Setting up push notifications...');
      
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        addLog('❌ ERROR: No user found. Please login first!');
        setLoading(false);
        return;
      }
      
      const user = JSON.parse(userJson);
      addLog(`📱 User: ${user.id.substring(0, 20)}...`);
      
      const success = await setupPushNotifications(user.id);
      
      if (success) {
        addLog('✅ Setup successful!');
        
        // Check what was stored
        const fcmToken = await AsyncStorage.getItem('fcmToken');
        const expoPushToken = await AsyncStorage.getItem('expoPushToken');
        
        addLog('');
        addLog('📋 Tokens registered:');
        if (fcmToken) addLog(`  ✅ FCM: ${fcmToken.length} chars`);
        if (expoPushToken) addLog(`  ✅ Expo: ${expoPushToken}`);
      } else {
        addLog('❌ Setup failed - check logs above');
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearTokens = async () => {
    setLoading(true);
    try {
      addLog('🗑️  Clearing stored tokens...');
      
      await AsyncStorage.removeItem('fcmToken');
      await AsyncStorage.removeItem('expoPushToken');
      await AsyncStorage.removeItem('deviceTokenRegisteredUserId');
      
      addLog('✅ Tokens cleared from local storage');
      addLog('');
      addLog('Next step: Restart app and login to re-register tokens');
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = () => {
    globalLogs = [];
    setLogs([]);
    addLog('🧹 Logs cleared');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>🧪 Push Notification Test</Text>
          <Text style={styles.subtitle}>APK Build Token Verification</Text>
        </View>

        <View style={styles.checklistSection}>
          <Text style={styles.sectionTitle}>APK Build Checklist:</Text>
          <Text style={styles.checklistItem}>✅ Firebase Available: YES</Text>
          <Text style={styles.checklistItem}>✅ FCM Token: 140+ chars</Text>
          <Text style={styles.checklistItem}>✅ Expo Token: ExponentPushToken[...]</Text>
          <Text style={styles.checklistItem}>✅ Both registered to backend</Text>
        </View>

        <View style={styles.checklistSection}>
          <Text style={styles.sectionTitle}>Expo Go Checklist:</Text>
          <Text style={styles.checklistItem}>✅ Firebase Available: NO (normal)</Text>
          <Text style={styles.checklistItem}>✅ Expo Token: ExponentPushToken[...]</Text>
          <Text style={styles.checklistItem}>✅ Registered to backend</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleDiagnostics}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '⏳ Running...' : '🔍 Check Token Status'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSetupTokens}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '⏳ Setting up...' : '🚀 Re-Setup Tokens'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleClearTokens}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '⏳ Clearing...' : '🗑️  Clear Tokens'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={handleClearLogs}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🧹 Clear Logs</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>📋 Live Logs ({logs.length}):</Text>
          {logs.length === 0 ? (
            <Text style={styles.emptyLogs}>Click a button to see logs...</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logLine}>
                {log}
              </Text>
            ))
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️  How to Use (APK):</Text>
          <Text style={styles.infoText}>
            1. Build APK: npm run build:apk{'\n'}
            2. Install on device: adb install app.apk{'\n'}
            3. Open app → Login{'\n'}
            4. Open this test screen{'\n'}
            5. Click buttons to see logs{'\n'}
            {'\n'}
            Expected logs:{'\n'}
            ✅ Firebase available{'\n'}
            ✅ FCM token acquired{'\n'}
            ✅ Expo token acquired{'\n'}
            ✅ Both tokens registered
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>🔧 Alternative: Logcat</Text>
          <Text style={styles.infoText}>
            In terminal: adb logcat | grep "Firebase\|Push\|Expo\|Setup"
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  checklistSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  checklistItem: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#FF9800',
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  infoButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logsContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  logsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#4CAF50',
  },
  logLine: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 3,
    color: '#00ff00',
    lineHeight: 16,
  },
  emptyLogs: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 22,
  },
});
