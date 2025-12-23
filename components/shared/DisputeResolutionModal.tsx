import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DisputeResolution, getDisputeResolution } from '../../services/disputeService';
import { formatCurrency } from '../../services/escrowContractService';

interface DisputeResolutionModalProps {
  visible: boolean;
  escrowId: string;
  onClose: () => void;
}

/**
 * Modal to display dispute resolution details
 * Shows the refund amount, admin note, and decision made by admin
 */
export const DisputeResolutionModal: React.FC<DisputeResolutionModalProps> = ({
  visible,
  escrowId,
  onClose,
}) => {
  const [resolution, setResolution] = useState<DisputeResolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let interval: any;
    
    if (visible) {
      console.log('📋 [DisputeResolutionModal] Modal is visible, escrowId:', escrowId);
      loadResolution();
      // Auto-refresh every 3 seconds while modal is visible
      interval = setInterval(() => {
        if (visible) {
          console.log('🔄 [DisputeResolutionModal] Auto-refresh triggered for escrowId:', escrowId);
          loadResolutionAutoRefresh();
        }
      }, 3000);
    }
    
    return () => {
      if (interval) {
        console.log('⏹️  [DisputeResolutionModal] Clearing auto-refresh interval');
        clearInterval(interval);
      }
    };
  }, [visible, escrowId]);

  const loadResolution = async () => {
    try {
      setLoading(true);
      console.log('⏳ [DisputeResolutionModal] Fetching dispute resolution for escrowId:', escrowId);
      const data = await getDisputeResolution(escrowId);
      console.log('📥 [DisputeResolutionModal] Resolution data received:', data);
      if (data) {
        console.log('✅ [DisputeResolutionModal] Resolution found:', {
          id: data.id,
          escrowId: data.escrowId,
          refundAmount: data.refundAmount,
          isFinalDecision: data.isFinalDecision,
          disputeStatus: data.disputeStatus
        });
      } else {
        console.log('⚠️  [DisputeResolutionModal] No resolution data returned');
      }
      setResolution(data);
      if (!data) {
        setError('Chưa có kết quả tranh chấp');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('❌ [DisputeResolutionModal] Error loading dispute resolution:', err);
      setError('Không thể tải kết quả tranh chấp');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadResolutionAutoRefresh = async () => {
    try {
      const data = await getDisputeResolution(escrowId);
      if (data) {
        console.log('🔄 [DisputeResolutionModal] Auto-refresh: Resolution updated:', {
          id: data.id,
          refundAmount: data.refundAmount,
          isFinalDecision: data.isFinalDecision
        });
      }
      setResolution(data);
      if (data) {
        setError(null);
      }
    } catch (err) {
      console.error('❌ [DisputeResolutionModal] Error in auto-refresh:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadResolution();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Kết quả tranh chấp</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={handleRefresh}
                disabled={refreshing || loading}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <MaterialIcons name="refresh" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Đang tải kết quả...</Text>
            </View>
          ) : error || !resolution ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="info" size={32} color="#F59E0B" />
              <Text style={styles.errorText}>{error || 'Chưa có kết quả tranh chấp'}</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Chi tiết giải quyết</Text>

                {/* Refund Amount */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số tiền hoàn lại:</Text>
                  <Text style={[styles.detailValue, styles.highlightValue]}>
                    {formatCurrency(resolution.refundAmount)}
                  </Text>
                </View>

                {/* Decision Status */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quyết định cuối cùng:</Text>
                  <Text style={[
                    styles.detailValue,
                    {
                      color: resolution.isFinalDecision ? '#10B981' : '#F59E0B',
                      fontWeight: '600',
                    }
                  ]}>
                    {resolution.isFinalDecision ? 'Có' : 'Không'}
                  </Text>
                </View>

                {/* Admin Note */}
                {resolution.adminNote && (
                  <View style={styles.noteSection}>
                    <Text style={styles.noteLabel}>Ghi chú từ Admin:</Text>
                    <View style={styles.noteBox}>
                      <Text style={styles.noteText}>{resolution.adminNote}</Text>
                    </View>
                  </View>
                )}

                {/* Created Date */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ngày tạo:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(resolution.createdAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>

                {/* Dispute Status */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái tranh chấp:</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: getStatusColor(resolution.disputeStatus) }
                  ]}>
                    {getStatusLabel(resolution.disputeStatus)}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Get status label for dispute
 */
const getStatusLabel = (status: number): string => {
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
  
  switch (statusNum) {
    case 0:
      return 'Chờ xét duyệt';
    case 1:
      return 'Đã chấp nhận';
    case 2:
      return 'Đã từ chối';
    case 3:
      return 'Đang xem xét bởi Admin';
    case 4:
      return 'Đã giải quyết';
    default:
      return 'Không xác định';
  }
};

/**
 * Get color for status
 */
const getStatusColor = (status: number): string => {
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
  
  switch (statusNum) {
    case 0:
      return '#F59E0B';
    case 1:
      return '#10B981';
    case 2:
      return '#EF4444';
    case 3:
      return '#3B82F6';
    case 4:
      return '#059669';
    default:
      return '#6B7280';
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 15,
    color: '#F59E0B',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  highlightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0284C7',
  },
  noteSection: {
    marginTop: 12,
    marginBottom: 16,
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  noteBox: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    padding: 12,
    borderRadius: 6,
  },
  noteText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    backgroundColor: '#3B82F6',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
