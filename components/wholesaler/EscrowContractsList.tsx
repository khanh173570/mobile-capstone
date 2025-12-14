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
import { FileText, Calendar, Wallet, TrendingUp, Award } from 'lucide-react-native';
import {
  getWholesalerEscrows,
  EscrowData,
  getEscrowStatusName,
  getEscrowStatusColor,
} from '../../services/escrowService';
import { handleError } from '../../utils/errorHandler';

export default function EscrowContractsList() {
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEscrows();
  }, []);

  const loadEscrows = async () => {
    try {
      setLoading(true);
      const data = await getWholesalerEscrows();
      setEscrows(data);
    } catch (error) {
      handleError(error, 'Không thể tải danh sách giao dịch kí quỹ');
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
            <FileText size={24} color="#3B82F6" />
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

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Wallet size={16} color="#6B7280" />
              <Text style={styles.amountLabel}>Tổng tiền</Text>
            </View>
            <Text style={styles.amountValue}>{formatCurrency(item.totalAmount)}</Text>
          </View>

          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <TrendingUp size={16} color="#6B7280" />
              <Text style={styles.amountLabel}>Phí dịch vụ</Text>
            </View>
            <Text style={styles.feeValue}>{formatCurrency(item.feeAmount)}</Text>
          </View>

          <View style={[styles.amountRow, styles.highlightRow]}>
            <View style={styles.amountItem}>
              <Award size={16} color="#22C55E" />
              <Text style={styles.receiveLabel}>Người bán nhận</Text>
            </View>
            <Text style={styles.receiveValue}>{formatCurrency(item.sellerReceiveAmount)}</Text>
          </View>
        </View>

        {/* Timeline Section */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Thông tin thanh toán</Text>

          <View style={styles.timelineItem}>
            <Calendar size={14} color="#6B7280" />
            <Text style={styles.timelineLabel}>Ngày tạo:</Text>
            <Text style={styles.timelineValue}>{formatDate(item.createdAt)}</Text>
          </View>

          {item.paymentAt && (
            <View style={styles.timelineItem}>
              <Calendar size={14} color="#10B981" />
              <Text style={styles.timelineLabel}>Đã thanh toán:</Text>
              <Text style={[styles.timelineValue, styles.successText]}>
                {formatDate(item.paymentAt)}
              </Text>
            </View>
          )}

          {item.releasedAt && (
            <View style={styles.timelineItem}>
              <Calendar size={14} color="#3B82F6" />
              <Text style={styles.timelineLabel}>Đã giải ngân:</Text>
              <Text style={[styles.timelineValue, styles.infoText]}>
                {formatDate(item.releasedAt)}
              </Text>
            </View>
          )}

          {item.refundAt && (
            <View style={styles.timelineItem}>
              <Calendar size={14} color="#F59E0B" />
              <Text style={styles.timelineLabel}>Đã hoàn tiền:</Text>
              <Text style={[styles.timelineValue, styles.warningText]}>
                {formatDate(item.refundAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Transaction IDs */}
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
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải giao dịch kí quỹ...</Text>
      </View>
    );
  }

  if (escrows.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <FileText size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Chưa có giao dịch kí quỹ</Text>
        <Text style={styles.emptyText}>
          Bạn chưa có giao dịch kí quỹ ký quỹ nào. Giao dịch sẽ được tạo khi bạn thắng đấu giá.
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
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
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  feeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F59E0B',
  },
  receiveLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  receiveValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#10B981',
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
    color: '#10B981',
  },
  infoText: {
    color: '#3B82F6',
  },
  warningText: {
    color: '#F59E0B',
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
