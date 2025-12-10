import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { TrendingUp, Clock, User } from 'lucide-react-native';

interface BidLog {
  id: string;
  bidId: string;
  userId: string;
  userName: string;
  type: string; // 'Created' or 'Updated'
  isAutoBidding: boolean;
  dateTimeUpdate: string;
  oldEntity: string; // JSON string
  newEntity: string; // JSON string
  createdAt: string;
  updatedAt: string | null;
}

interface BidLogDisplayProps {
  bidLogs: BidLog[];
  loading: boolean;
  minBidIncrement?: number;
}

export default function BidLogDisplay({
  bidLogs,
  loading,
  minBidIncrement,
}: BidLogDisplayProps) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#22C55E" />
        <Text style={styles.loadingText}>Đang tải lịch sử đấu giá...</Text>
      </View>
    );
  }

  if (!bidLogs || bidLogs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Chưa có đấu giá nào</Text>
      </View>
    );
  }

  // Parse bid data from JSON string in newEntity
  const parseBidData = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      return data.Bid || {};
    } catch (error) {
      return {};
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  // Sort bid logs by dateTimeUpdate (newest first)
  const sortedBidLogs = [...bidLogs].sort((a, b) => {
    return new Date(b.dateTimeUpdate).getTime() - new Date(a.dateTimeUpdate).getTime();
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Lịch sử đấu giá</Text>
        <Text style={styles.count}>{sortedBidLogs.length} lượt</Text>
      </View>

      <ScrollView style={styles.logList} showsVerticalScrollIndicator={false}>
        {sortedBidLogs.map((log, index) => {
          const bidData = parseBidData(log.newEntity);
          const bidAmount = bidData.BidAmount || 0;
          const isAutoBid = bidData.IsAutoBid || false;

          return (
            <View key={log.id} style={styles.logItem}>
              {/* Index */}
              <View style={styles.indexBadge}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>

              {/* Content */}
              <View style={styles.logContent}>
                {/* User and Type */}
                <View style={styles.userRow}>
                  <View style={styles.userInfo}>
                    <User size={14} color="#6B7280" />
                    <Text style={styles.userName}>{log.userName}</Text>
                  </View>
                  <View
                    style={[
                      styles.typeBadge,
                      isAutoBid ? styles.autoBidBadge : styles.manualBidBadge,
                    ]}
                  >
                    <Text style={styles.typeText}>
                      {isAutoBid ? '🤖 Tự động' : '🤝 Thủ công'}
                    </Text>
                  </View>
                </View>

                {/* Bid Amount */}
                <View style={styles.amountRow}>
                  <TrendingUp size={14} color="#16A34A" />
                  <Text style={styles.amountLabel}>Giá đấu:</Text>
                  <Text style={styles.amountValue}>
                    {bidAmount.toLocaleString('vi-VN')} ₫
                  </Text>
                </View>

                {/* Timestamp */}
                <View style={styles.timestampRow}>
                  <Clock size={12} color="#9CA3AF" />
                  <Text style={styles.timestamp}>{formatDate(log.dateTimeUpdate)}</Text>
                </View>
              </View>

              {/* Status indicator */}
              {index === 0 && (
                <View style={styles.latestBadge}>
                  <Text style={styles.latestText}>Mới nhất</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginHorizontal: 0,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  count: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  logList: {
    maxHeight: 450,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    position: 'relative',
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  logContent: {
    flex: 1,
    gap: 8,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  autoBidBadge: {
    backgroundColor: '#EDE9FE',
  },
  manualBidBadge: {
    backgroundColor: '#FEF3C7',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  latestBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: '#16A34A',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  latestText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty State
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 16,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
