import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react-native';
import {
  getTransactionLedgers,
  Ledger,
  getLedgerDirectionName,
  getLedgerDirectionColor,
  formatCurrency,
  formatDate,
} from '../../../../../services/transactionService';
import { handleError } from '../../../../../utils/errorHandler';

export default function TransactionDetailScreen() {
  const { transactionId } = useLocalSearchParams();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (transactionId) {
      loadLedgers();
    }
  }, [transactionId]);

  const loadLedgers = async () => {
    try {
      setLoading(true);
      const data = await getTransactionLedgers(transactionId as string);
      setLedgers(data);
    } catch (error) {
      handleError(error, 'Không thể tải chi tiết biến động');
    } finally {
      setLoading(false);
    }
  };

  const handleLedgerPress = (ledger: Ledger) => {
    router.push({
      pathname: '/(tabs)/farmer/profile/transactions/ledger-detail',
      params: { ledgerId: ledger.id },
    });
  };

  const renderLedgerItem = ({ item }: { item: Ledger }) => {
    const isIncoming = item.direction === 1;
    const displayAmount = Math.abs(item.amount);

    return (
      <TouchableOpacity
        style={styles.ledgerCard}
        onPress={() => handleLedgerPress(item)}
      >
        <View style={styles.ledgerHeader}>
          <View style={styles.ledgerInfo}>
            <View style={[styles.iconCircle, isIncoming ? styles.incomingIcon : styles.outgoingIcon]}>
              {isIncoming ? (
                <TrendingUp size={20} color="#fff" />
              ) : (
                <TrendingDown size={20} color="#fff" />
              )}
            </View>
            <View style={styles.ledgerDetails}>
              <Text style={styles.ledgerDescription}>{item.description}</Text>
              <Text style={styles.ledgerDate}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.ledgerAmountContainer}>
            <Text style={[
              styles.ledgerAmount,
              isIncoming ? styles.positiveAmount : styles.negativeAmount
            ]}>
              {isIncoming ? '+' : '-'}{formatCurrency(displayAmount)}
            </Text>
            <Text style={styles.balanceAfter}>
              Số dư: {formatCurrency(item.balanceAfter)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết giao dịch</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết giao dịch</Text>
        <View style={{ width: 24 }} />
      </View>

      {ledgers.length > 0 ? (
        <FlatList
          data={ledgers}
          renderItem={renderLedgerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Biến động số dư</Text>
              <Text style={styles.summaryInfo}>
                {ledgers.length} bản ghi
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Clock size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Chưa có biến động số dư</Text>
        </View>
      )}
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
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  summaryInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  ledgerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ledgerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  incomingIcon: {
    backgroundColor: '#10B981',
  },
  outgoingIcon: {
    backgroundColor: '#EF4444',
  },
  ledgerDetails: {
    flex: 1,
  },
  ledgerDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  ledgerDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  ledgerAmountContainer: {
    alignItems: 'flex-end',
  },
  ledgerAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
  balanceAfter: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
});
