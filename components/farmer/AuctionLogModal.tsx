import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import {
  AuctionLog,
  getLogTypeLabel,
  getLogTypeColor,
  getAuctionStatusLabel,
} from '../../services/auctionLogService';

interface AuctionLogModalProps {
  visible: boolean;
  logs: AuctionLog[];
  loading: boolean;
  onClose: () => void;
}

export default function AuctionLogModal({
  visible,
  logs,
  loading,
  onClose,
}: AuctionLogModalProps) {
  const [expandedLogs, setExpandedLogs] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId],
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusChange = (oldEntity: any, newEntity: any) => {
    if (!oldEntity || !newEntity) return null;

    const oldStatus = oldEntity.status;
    const newStatus = newEntity.status;

    if (oldStatus === newStatus) return null;

    return {
      from: getAuctionStatusLabel(oldStatus),
      to: getAuctionStatusLabel(newStatus),
    };
  };

  const renderLogItem = (log: AuctionLog, index: number, total: number) => {
    const typeLabel = getLogTypeLabel(log.type);
    const typeColor = getLogTypeColor(log.type);
    const isExpanded = expandedLogs[log.id];
    const statusChange = getStatusChange(log.oldEntity, log.newEntity);
    const isFirst = index === 0;
    const isLast = index === total - 1;

    return (
      <View key={log.id} style={styles.timelineItem}>
        <View style={styles.timelineContainer}>
          {/* Timeline dot */}
          <View style={styles.timelineLeft}>
            <View style={[styles.timelineDot, { backgroundColor: typeColor }]} />
            {!isLast && <View style={styles.timelineLine} />}
          </View>

          {/* Content */}
          <View style={styles.timelineContent}>
            <TouchableOpacity
              style={[styles.logCard, isExpanded && styles.logCardExpanded]}
              onPress={() => toggleExpand(log.id)}
            >
              <View style={styles.logCardHeader}>
                <View style={styles.logCardTop}>
                  <View style={[styles.logTypeBadge, { backgroundColor: typeColor }]}>
                    <Text style={styles.logTypeText}>{typeLabel}</Text>
                  </View>
                  <Text style={styles.logTime}>{formatDate(log.dateTimeUpdate)}</Text>
                  
                  {statusChange && (
                    <View style={styles.statusPreview}>
                      <Text style={styles.statusPreviewText}>
                        {statusChange.from} → {statusChange.to}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.expandIconContainer}>
                  {isExpanded ? (
                    <ChevronUp size={20} color="#6B7280" />
                  ) : (
                    <ChevronDown size={20} color="#6B7280" />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.logDetails}>
                {statusChange && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Thay đổi trạng thái</Text>
                    <View style={styles.statusChangeBox}>
                      <View style={styles.statusColumn}>
                        <Text style={styles.statusLabel}>Trước</Text>
                        <Text style={styles.statusValue}>{statusChange.from}</Text>
                      </View>
                      <Text style={styles.arrow}>→</Text>
                      <View style={styles.statusColumn}>
                        <Text style={styles.statusLabel}>Sau</Text>
                        <Text style={styles.statusValue}>{statusChange.to}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {log.newEntity && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Thông tin đấu giá</Text>
                    <View style={styles.entityBox}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Mã phiên:</Text>
                        <Text style={styles.detailValue}>{log.newEntity.sessionCode}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Giá khởi đầu:</Text>
                        <Text style={styles.detailValue}>
                          {new Intl.NumberFormat('vi-VN').format(log.newEntity.startingPrice)} VND
                        </Text>
                      </View>
                      {log.newEntity.note && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailKey}>Ghi chú:</Text>
                          <Text style={styles.detailValue}>{log.newEntity.note}</Text>
                        </View>
                      )}
                      <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Ngày dự kiến:</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(log.newEntity.expectedHarvestDate)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Số lượng dự kiến:</Text>
                        <Text style={styles.detailValue}>{log.newEntity.expectedTotalQuantity}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Lịch sử thay đổi</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
            </View>
          ) : logs.length > 0 ? (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={styles.logsCountText}>
                Tổng cộng {logs.length} thay đổi
              </Text>
              {logs.map((log, index) => renderLogItem(log, index, logs.length))}
              <View style={styles.bottomPadding} />
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có lịch sử thay đổi</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  logsCountText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
    fontWeight: '500',
  },
  timelineItem: {
    marginBottom: 8,
  },
  timelineContainer: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 40,
    alignItems: 'center',
    paddingTop: 8,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    paddingRight: 16,
    paddingBottom: 16,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  logCardExpanded: {
    shadowOpacity: 0.12,
    elevation: 4,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logCardTop: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  logTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  logTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  logTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusPreview: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusPreviewText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  expandIconContainer: {
    paddingLeft: 8,
  },
  logItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  logTypeContainer: {
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  logSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  expandIcon: {
    marginLeft: 8,
  },
  logDetails: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  detailSection: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusChangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  statusColumn: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  arrow: {
    fontSize: 16,
    color: '#9CA3AF',
    marginHorizontal: 8,
  },
  entityBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4, 
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailKey: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 100,
  },
  detailValue: {
    fontSize: 12,
    color: '#1F2937',
    flex: 1,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});
