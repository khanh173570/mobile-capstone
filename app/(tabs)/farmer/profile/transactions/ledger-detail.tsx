import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Copy,
  Share2,
} from 'lucide-react-native';
import {
  getLedgerDetail,
  Ledger,
  getLedgerDirectionName,
  formatCurrency,
  formatDate,
} from '../../../../../services/transactionService';
import { handleError } from '../../../../../utils/errorHandler';

export default function LedgerDetailScreen() {
  const { ledgerId } = useLocalSearchParams();
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ledgerId) {
      loadLedger();
    }
  }, [ledgerId]);

  const loadLedger = async () => {
    try {
      setLoading(true);
      const data = await getLedgerDetail(ledgerId as string);
      setLedger(data);
    } catch (error) {
      handleError(error, 'Không thể tải chi tiết biến động');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !ledger) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết biến động</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      </View>
    );
  }

  const isIncoming = ledger.direction === 1;
  const displayAmount = Math.abs(ledger.amount);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết biến động</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Amount Card */}
        <View style={[styles.amountCard, isIncoming ? styles.incomingCard : styles.outgoingCard]}>
          <View style={[styles.largeIcon, isIncoming ? styles.incomingIcon : styles.outgoingIcon]}>
            {isIncoming ? (
              <TrendingUp size={40} color="#fff" />
            ) : (
              <TrendingDown size={40} color="#fff" />
            )}
          </View>
          <Text style={styles.amountText}>
            {isIncoming ? '+' : '-'}{formatCurrency(displayAmount)}
          </Text>
          <Text style={styles.directionText}>
            {getLedgerDirectionName(ledger.direction)}
          </Text>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mô tả</Text>
            <Text style={styles.detailValue}>{ledger.description}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Thời gian</Text>
            <Text style={styles.detailValue}>{formatDate(ledger.createdAt)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Số dư trước</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(ledger.balanceAfter - ledger.amount)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Số dư sau</Text>
            <Text style={[styles.detailValue, styles.balanceAfterValue]}>
              {formatCurrency(ledger.balanceAfter)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Loại giao dịch</Text>
            <Text style={styles.detailValue}>{getLedgerDirectionName(ledger.direction)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID biến động</Text>
            <View style={styles.idContainer}>
              <Text style={styles.idValue} numberOfLines={1}>
                {ledger.id}
              </Text>
              <TouchableOpacity style={styles.copyButton}>
                <Copy size={16} color="#0369A1" />
              </TouchableOpacity>
            </View>
          </View>

          {ledger.transactionId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID Giao dịch</Text>
              <View style={styles.idContainer}>
                <Text style={styles.idValue} numberOfLines={1}>
                  {ledger.transactionId}
                </Text>
                <TouchableOpacity style={styles.copyButton}>
                  <Copy size={16} color="#0369A1" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID Ví</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {ledger.walletId}
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, isIncoming ? styles.successBadge : styles.warningBadge]}>
            <Text style={styles.statusText}>
              {isIncoming ? '✓ Nhận tiền' : '✓ Thanh toán'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  amountCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  incomingCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  outgoingCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  largeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  incomingIcon: {
    backgroundColor: '#10B981',
  },
  outgoingIcon: {
    backgroundColor: '#EF4444',
  },
  amountText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  directionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 0,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  balanceAfterValue: {
    color: '#10B981',
    fontWeight: '700',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  idValue: {
    fontSize: 12,
    color: '#0369A1',
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
    marginRight: 8,
  },
  copyButton: {
    padding: 8,
  },
  statusSection: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  successBadge: {
    backgroundColor: '#DCFCE7',
  },
  warningBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});
