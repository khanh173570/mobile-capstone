import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { FileText, Calendar, Wallet, TrendingUp, Award, User } from 'lucide-react-native';
import {
  getFarmerEscrows,
  EscrowData,
  getEscrowStatusName,
  getEscrowStatusColor,
} from '../../services/escrowService';
import { handleError } from '../../utils/errorHandler';

export default function FarmerEscrowContractsList() {
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEscrows();
  }, []);

  const loadEscrows = async () => {
    try {
      setLoading(true);
      const data = await getFarmerEscrows();
      setEscrows(data);
    } catch (error) {
      handleError(error, 'Không thể tải danh sách giao dịch ký quỹ');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEscrows();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEscrowCard = ({ item }: { item: EscrowData }) => {
    const statusColor = getEscrowStatusColor(item.escrowStatus);
    const statusName = getEscrowStatusName(item.escrowStatus);

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <FileText size={24} color="#22C55E" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.contractTitle}>Giao dịch ký quỹ</Text>
              <Text style={styles.auctionId} numberOfLines={1}>
                ID: {item.auctionId.substring(0, 8)}...
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusName}
            </Text>
          </View>
        </View>

        {/* Amount Section - Farmer's perspective */}
        <View style={styles.amountSection}>
          <View style={[styles.amountRow, styles.highlightRow]}>
            <View style={styles.amountItem}>
              <Award size={18} color="#22C55E" />
              <Text style={styles.receiveLabel}>Bạn sẽ nhận</Text>
            </View>
            <Text style={styles.receiveValue}>{formatCurrency(item.sellerReceiveAmount)}</Text>
          </View>

          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Wallet size={16} color="#6B7280" />
              <Text style={styles.amountLabel}>Tổng giá trị</Text>
            </View>
            <Text style={styles.amountValue}>{formatCurrency(item.totalAmount)}</Text>
          </View>

          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <TrendingUp size={16} color="#6B7280" />
              <Text style={styles.amountLabel}>Phí nền tảng</Text>
            </View>
            <Text style={styles.feeValue}>-{formatCurrency(item.feeAmount)}</Text>
          </View>
        </View>

        {/* Winner Info */}
        <View style={styles.winnerSection}>
          <View style={styles.winnerRow}>
            <User size={16} color="#3B82F6" />
            <Text style={styles.winnerLabel}>Người thắng đấu giá</Text>
          </View>
          <Text style={styles.winnerId} numberOfLines={1}>
            ID: {item.winnerId}
          </Text>
        </View>

        {/* Timeline Section */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Tiến trình thanh toán</Text>

          <View style={styles.timelineItem}>
            <Calendar size={14} color="#6B7280" />
            <Text style={styles.timelineLabel}>Tạo giao dịch:</Text>
            <Text style={styles.timelineValue}>{formatDate(item.createdAt)}</Text>
          </View>

          {item.paymentAt && (
            <View style={styles.timelineItem}>
              <Calendar size={14} color="#10B981" />
              <Text style={styles.timelineLabel}>Người mua đã cọc:</Text>
              <Text style={[styles.timelineValue, styles.successText]}>
                {formatDate(item.paymentAt)}
              </Text>
            </View>
          )}

          {item.releasedAt && (
            <View style={styles.timelineItem}>
              <Calendar size={14} color="#22C55E" />
              <Text style={styles.timelineLabel}>Đã nhận tiền:</Text>
              <Text style={[styles.timelineValue, styles.successText]}>
                {formatDate(item.releasedAt)}
              </Text>
            </View>
          )}

          {item.refundAt && (
            <View style={styles.timelineItem}>
              <Calendar size={14} color="#EF4444" />
              <Text style={styles.timelineLabel}>Đã hoàn tiền:</Text>
              <Text style={[styles.timelineValue, styles.errorText]}>
                {formatDate(item.refundAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Transaction IDs */}
        {(item.paymentTransactionId || item.releasedTransactioId || item.refundTransactionId) && (
          <View style={styles.transactionSection}>
            {item.paymentTransactionId && (
              <View style={styles.transactionItem}>
                <Text style={styles.transactionLabel}>Mã thanh toán:</Text>
                <Text style={styles.transactionValue} numberOfLines={1}>
                  {item.paymentTransactionId}
                </Text>
              </View>
            )}

            {item.releasedTransactioId && (
              <View style={styles.transactionItem}>
                <Text style={styles.transactionLabel}>Mã giải ngân:</Text>
                <Text style={styles.transactionValue} numberOfLines={1}>
                  {item.releasedTransactioId}
                </Text>
              </View>
            )}

            {item.refundTransactionId && (
              <View style={styles.transactionItem}>
                <Text style={styles.transactionLabel}>Mã hoàn tiền:</Text>
                <Text style={styles.transactionValue} numberOfLines={1}>
                  {item.refundTransactionId}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Đang tải giao dịch kí quỹ...</Text>
      </View>
    );
  }

  if (escrows.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <FileText size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Chưa có giao dich</Text>
        <Text style={styles.emptyText}>
          Bạn chưa có giao dịch ký quỹ nào. Giao dịch sẽ được tạo khi có người thắng đấu giá của bạn.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={escrows}
        renderItem={renderEscrowCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#22C55E']} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  auctionId: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountSection: {
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightRow: {
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  amountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  receiveLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#22C55E',
  },
  receiveValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
  },
  winnerSection: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  winnerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  winnerId: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  timelineSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timelineLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  timelineValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  successText: {
    color: '#22C55E',
  },
  errorText: {
    color: '#EF4444',
  },
  transactionSection: {
    gap: 8,
  },
  transactionItem: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  transactionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  transactionValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    fontFamily: 'monospace',
  },
});
