import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Edit2, Trash2, Trophy, Clock } from 'lucide-react-native';
import { BidResponse } from '../../services/bidService';

interface BidListDisplayProps {
  bids: BidResponse[];
  loading: boolean;
  onEditBid?: (bid: BidResponse) => void;
  minBidIncrement: number;
}

export default function BidListDisplay({
  bids,
  loading,
  onEditBid,
  minBidIncrement,
}: BidListDisplayProps) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#16A34A" />
        <Text style={styles.loadingText}>Đang tải bids...</Text>
      </View>
    );
  }

  if (!bids || bids.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Chưa có bid nào</Text>
        <Text style={styles.emptySubText}>Bấm "Tham gia đấu giá" để đặt giá đầu tiên</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}> Bids của bạn</Text>
        <Text style={styles.count}>{bids.length} bid{bids.length > 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.listCenterContainer}>
        {bids.map((bid, index) => (
          <View key={`${bid.auctionSessionId}-${index}`} style={styles.bidCard}>
            {/* Status Badge */}
            {/* <View
              style={[
                styles.statusBadge,
                bid.isWinning && styles.winningBadge,
                bid.isCancelled && styles.cancelledBadge,
              ]}
            >
              {bid.isWinning && <Trophy size={12} color="#FFFFFF" />}
              <Text
                style={[
                  styles.statusText,
                  bid.isWinning && styles.winningText,
                  bid.isCancelled && styles.cancelledText,
                ]}
              >
                {bid.isCancelled ? 'Đã hủy' : bid.isWinning ? 'Dẫn đầu' : 'Đang chờ'}
              </Text>
            </View> */}

            {/* Bid Type */}
            <View style={styles.bidTypeRow}>
              <Text style={styles.bidTypeLabel}>
                {bid.isAutoBid ? '🤖 Tự động' : '🤝 Thủ công'}
              </Text>
            </View>

            {/* Bid Amount */}
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>Giá đặt</Text>
              <Text style={styles.amountValue}>
                {bid.bidAmount.toLocaleString('vi-VN')} ₫
              </Text>
            </View>

            {/* Auto Bid Max Limit */}
            {bid.isAutoBid && bid.autoBidMaxLimit && (
              <View style={styles.maxLimitSection}>
                <Text style={styles.maxLimitLabel}>Giá tối đa</Text>
                <Text style={styles.maxLimitValue}>
                  {bid.autoBidMaxLimit.toLocaleString('vi-VN')} ₫
                </Text>
              </View>
            )}

            {/* Action Button */}
            {!bid.isCancelled && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => onEditBid?.(bid)}
              >
                <Edit2 size={14} color="#2563EB" />
                <Text style={styles.editButtonText}>Mua với giá mới</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    marginVertical: 12,
    marginTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
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
  listContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  listContent: {
    gap: 12,
    paddingRight: 16,
    alignItems: 'center',
  },
  listCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Bid Card
  bidCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
    marginBottom: 10,
  },
  winningBadge: {
    backgroundColor: '#FCD34D',
  },
  cancelledBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  winningText: {
    color: '#78350F',
  },
  cancelledText: {
    color: '#991B1B',
  },

  // Bid Type
  bidTypeRow: {
    marginBottom: 10,
  },
  bidTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },

  // Amount Section
  amountSection: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  amountLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
  },

  // Max Limit Section
  maxLimitSection: {
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },
  maxLimitLabel: {
    fontSize: 11,
    color: '#65A30D',
    marginBottom: 2,
  },
  maxLimitValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
  },

  // Edit Button
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
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
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
