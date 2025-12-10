import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react-native';
import {
  getMyTransactions,
  Transaction,
  getTransactionTypeName,
  formatCurrency,
  formatDate,
} from '../../../../../services/transactionService';
import { handleError } from '../../../../../utils/errorHandler';

export default function FarmerTransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getMyTransactions();
      // Sắp xếp theo thời gian mới nhất
      const sorted = data.sort((a: Transaction, b: Transaction) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTransactions(sorted);
    } catch (error) {
      handleError(error, 'Không thể tải giao dịch');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const handleTransactionPress = (transaction: Transaction) => {
    router.push({
      pathname: '/(tabs)/farmer/profile/transactions/detail',
      params: { transactionId: transaction.id },
    });
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncoming = item.amount > 0;
    const displayAmount = Math.abs(item.amount);

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => handleTransactionPress(item)}
      >
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <View style={[styles.iconCircle, isIncoming ? styles.incomingIcon : styles.outgoingIcon]}>
              {isIncoming ? (
                <TrendingUp size={20} color="#fff" />
              ) : (
                <TrendingDown size={20} color="#fff" />
              )}
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionType}>
                {getTransactionTypeName(item.transactionType)}
              </Text>
              <Text style={styles.transactionDate}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
          <Text style={[
            styles.transactionAmount,
            isIncoming ? styles.positiveAmount : styles.negativeAmount
          ]}>
            {isIncoming ? '+' : '-'}{formatCurrency(displayAmount)}
          </Text>
        </View>
        {item.escrowId && item.escrowId !== '00000000-0000-0000-0000-000000000000' && (
          <View style={styles.escrowBadge}>
            <Text style={styles.escrowBadgeText}>Liên quan đến hợp đồng</Text>
          </View>
        )}
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
          <Text style={styles.headerTitle}>Giao dịch</Text>
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
        <Text style={styles.headerTitle}>Giao dịch</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Clock size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          </View>
        }
      />
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
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
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
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
  escrowBadge: {
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  escrowBadgeText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '500',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
});
