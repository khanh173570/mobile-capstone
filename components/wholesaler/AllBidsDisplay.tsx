import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { TrendingUp, Clock, User } from 'lucide-react-native';
import { BidLog } from '../../services/bidService';

interface AllBidsDisplayProps {
  bidLogs: BidLog[];
  loading: boolean;
}

export default function AllBidsDisplay({
  bidLogs,
  loading,
}: AllBidsDisplayProps) {
  // Debug: Log when component receives new props
  React.useEffect(() => {
    console.log('🎨 AllBidsDisplay re-rendered with', bidLogs.length, 'bid logs');
    if (bidLogs.length > 0) {
      const sorted = [...bidLogs].sort((a, b) => 
        new Date(b.dateTimeUpdate).getTime() - new Date(a.dateTimeUpdate).getTime()
      );
      console.log('🎨 After sorting, first bid:', sorted[0].userName, '-', sorted[0].type);
      const firstBidData = JSON.parse(sorted[0].newEntity).Bid;
      console.log('🎨 First bid amount:', firstBidData?.BidAmount || 'N/A');
    }
  }, [bidLogs]);

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
      console.error('Error parsing bid data:', error);
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
        <Text style={styles.title}>📊 Tất cả lượt đấu giá</Text>
        <Text style={styles.count}>{sortedBidLogs.length} lượt</Text>
      </View>

      <ScrollView style={styles.bidList} showsVerticalScrollIndicator={false}>
        {sortedBidLogs.map((log, index) => {
          const bidData = parseBidData(log.newEntity);
          const bidAmount = bidData.BidAmount || 0;
          const isAutoBid = log.isAutoBidding;

          // Get type label from log.type
          const typeLabel = log.type === 'Created' ? '🆕 Tạo mới' : 
                           log.type === 'Updated' ? '🔄 Cập nhật' : 
                           log.type;

          return (
            <View key={`${log.id}-${index}`} style={styles.bidItem}>
              {/* Rank */}
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>

              {/* Content */}
              <View style={styles.bidContent}>
                {/* User and Type */}
                <View style={styles.userRow}>
                  <View style={styles.userInfo}>
                    <User size={14} color="#6B7280" />
                    <Text style={styles.userName}>{log.userName}</Text>
                  </View>
                  <View style={styles.typeLabel}>
                    <Text style={styles.typeLabelText}>{typeLabel}</Text>
                  </View>
                  <View
                    style={[
                      styles.typeBadge,
                      isAutoBid ? styles.autoBidBadge : styles.manualBidBadge,
                    ]}
                  >
                    <Text style={styles.typeText}>
                      {isAutoBid ? '🤖' : '🤝'}
                    </Text>
                  </View>
                </View>

                {/* Bid Amount */}
                <View style={styles.amountRow}>
                  <TrendingUp size={14} color="#16A34A" />
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
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
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
  bidList: {
    maxHeight: 400,
  },
  bidItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  bidContent: {
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
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  typeBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoBidBadge: {
    backgroundColor: '#EDE9FE',
  },
  manualBidBadge: {
    backgroundColor: '#FEF3C7',
  },
  typeText: {
    fontSize: 14,
  },
  typeLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginLeft: 8,
  },
  typeLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

  // Empty State
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
