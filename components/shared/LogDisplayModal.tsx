import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getCapturedLogs, getLogsGrouped } from '../../services/logCaptureService';

interface LogDisplayModalProps {
  visible: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

/**
 * Modal to display captured Firebase and setup logs
 */
export const LogDisplayModal: React.FC<LogDisplayModalProps> = ({
  visible,
  onClose,
  isLoading = false,
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [groupedLogs, setGroupedLogs] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (visible) {
      setLogs(getCapturedLogs());
      setGroupedLogs(getLogsGrouped());
    }
  }, [visible]);

  const renderLogItem = (log: string, index: number) => {
    // Color based on emoji
    let color = '#666';
    if (log.includes('❌')) color = '#FF4444';
    if (log.includes('⚠️')) color = '#FFA500';
    if (log.includes('✓') || log.includes('✅')) color = '#4CAF50';
    if (log.includes('🔥')) color = '#FF6B6B';
    if (log.includes('📱')) color = '#2196F3';

    return (
      <Text key={index} style={[styles.logText, { color }]}>
        {log}
      </Text>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔥 Firebase Setup Logs</Text>
          <Text style={styles.headerSubtitle}>
            {logs.length} log entries captured
          </Text>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Setting up Firebase...</Text>
          </View>
        )}

        {/* Logs Display */}
        <ScrollView
          style={styles.logsContainer}
          showsVerticalScrollIndicator={true}
        >
          {logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No logs captured yet</Text>
            </View>
          ) : (
            <View style={styles.logsContent}>
              {/* Show raw logs */}
              <View style={styles.logSection}>
                <Text style={styles.sectionTitle}>📋 Complete Log Output:</Text>
                {logs.map((log, index) => renderLogItem(log, index))}
              </View>

              {/* Show grouped summary */}
              {Object.keys(groupedLogs).length > 0 && (
                <View style={[styles.logSection, styles.summarySection]}>
                  <Text style={styles.sectionTitle}>📊 Summary by Category:</Text>

                  {groupedLogs.error && groupedLogs.error.length > 0 && (
                    <View style={styles.categoryBox}>
                      <Text style={styles.categoryTitle}>❌ Errors ({groupedLogs.error.length})</Text>
                      {groupedLogs.error.map((log, i) => (
                        <Text key={`error-${i}`} style={[styles.logText, { color: '#FF4444' }]}>
                          {log}
                        </Text>
                      ))}
                    </View>
                  )}

                  {groupedLogs.warning && groupedLogs.warning.length > 0 && (
                    <View style={styles.categoryBox}>
                      <Text style={styles.categoryTitle}>⚠️ Warnings ({groupedLogs.warning.length})</Text>
                      {groupedLogs.warning.map((log, i) => (
                        <Text key={`warn-${i}`} style={[styles.logText, { color: '#FFA500' }]}>
                          {log}
                        </Text>
                      ))}
                    </View>
                  )}

                  {groupedLogs.firebase && groupedLogs.firebase.length > 0 && (
                    <View style={styles.categoryBox}>
                      <Text style={styles.categoryTitle}>🔥 Firebase ({groupedLogs.firebase.length})</Text>
                      {groupedLogs.firebase.map((log, i) => (
                        <Text key={`firebase-${i}`} style={[styles.logText, { color: '#FF6B6B' }]}>
                          {log}
                        </Text>
                      ))}
                    </View>
                  )}

                  {groupedLogs.fcm && groupedLogs.fcm.length > 0 && (
                    <View style={styles.categoryBox}>
                      <Text style={styles.categoryTitle}>📱 FCM Token ({groupedLogs.fcm.length})</Text>
                      {groupedLogs.fcm.map((log, i) => (
                        <Text key={`fcm-${i}`} style={[styles.logText, { color: '#2196F3' }]}>
                          {log}
                        </Text>
                      ))}
                    </View>
                  )}

                  {groupedLogs.expo && groupedLogs.expo.length > 0 && (
                    <View style={styles.categoryBox}>
                      <Text style={styles.categoryTitle}>📱 Expo Token ({groupedLogs.expo.length})</Text>
                      {groupedLogs.expo.map((log, i) => (
                        <Text key={`expo-${i}`} style={[styles.logText, { color: '#4CAF50' }]}>
                          {log}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Footer - Close Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.closeButtonText}>
              {isLoading ? 'Setting up...' : '✓ Close & Continue to Home'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  logsContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  logsContent: {
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  logSection: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  summarySection: {
    borderLeftColor: '#FF9800',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginVertical: 4,
    lineHeight: 18,
  },
  categoryBox: {
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LogDisplayModal;
