import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react-native';
import {
  getTransactionsByEscrow,
  Transaction,
  formatCurrency,
  formatDate,
  getTransactionTypeName,
} from '../../services/transactionService';

interface EscrowTransactionsProps {
  escrowId: string;
}

export const EscrowTransactions: React.FC<EscrowTransactionsProps> = ({ escrowId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [escrowId]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactionsByEscrow(escrowId);
      setTransactions(data);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Không thể tải giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Chờ',
      completed: 'Hoàn tất',
      failed: 'Thất bại',
      processing: 'Đang xử lý',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: '#F59E0B',
      completed: '#10B981',
      failed: '#EF4444',
      processing: '#3B82F6',
    };
    return colorMap[status] || '#6B7280';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#22C55E" />
        <Text style={styles.loadingText}>Đang tải giao dịch...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Clock size={32} color="#D1D5DB" />
        <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
      </View>
    );
  }

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isIncoming = item.amount > 0;
    const displayAmount = Math.abs(item.amount);
    const status = item.status || 'completed';

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionColumn1}>
          <View
            style={[
              styles.iconCircle,
              isIncoming ? styles.incomingIcon : styles.outgoingIcon,
            ]}
          >
            {isIncoming ? (
              <TrendingUp size={16} color="#fff" />
            ) : (
              <TrendingDown size={16} color="#fff" />
            )}
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionType}>
              {getTransactionTypeName(item.transactionType)}
            </Text>
            <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.transactionColumn2}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(status) + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {getStatusLabel(status)}
            </Text>
          </View>
        </View>
        <View style={styles.transactionColumn3}>
          <Text
            style={[
              styles.transactionAmount,
              isIncoming ? styles.positiveAmount : styles.negativeAmount,
            ]}
          >
            {isIncoming ? '+' : '-'}{formatCurrency(displayAmount)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Giao dịch liên quan</Text>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  loadingText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  listContent: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  transactionColumn1: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.5,
    marginRight: 8,
  },
  transactionColumn2: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionColumn3: {
    flex: 0.7,
    alignItems: 'flex-end',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  incomingIcon: {
    backgroundColor: '#10B981',
  },
  outgoingIcon: {
    backgroundColor: '#EF4444',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 4,
  },
  transactionType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    flexWrap: 'wrap',
    maxWidth: '100%',
    lineHeight: 16,
  },
  transactionDate: {
    fontSize: 11,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    minWidth: 40,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
});
