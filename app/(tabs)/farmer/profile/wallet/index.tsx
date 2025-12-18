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
} from 'react-native';
import { router } from 'expo-router';
import {
  Wallet as WalletIcon,
  RefreshCw,
  CreditCard,
  TrendingUp,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Eye,
  EyeOff,
  Plus,
} from 'lucide-react-native';
import {
  getMyWallet,
  getMyLedgers,
  Wallet,
  Ledger,
  getWalletStatusName,
  getWalletStatusColor,
  getLedgerDirectionName,
  getLedgerDirectionColor,
  formatCurrency,
} from '../../../../../services/walletService';
import { handleError } from '../../../../../utils/errorHandler';
import { getUserProfile } from '../../../../../services/authService';
import AddFundsModal from '../../../../../components/wholesaler/AddFundsModal';

export default function FarmerWalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadWallet();
    loadLedgers();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      if (profile && profile.data) {
        setUserId(profile.data.id);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadWallet = async () => {
    try {
      setLoading(true);
      const data = await getMyWallet();
      setWallet(data);
    } catch (error) {
      handleError(error, 'Không thể tải thông tin ví');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLedgers = async () => {
    try {
      const data = await getMyLedgers();
      setLedgers(data);
    } catch (error) {
      console.error('Error loading ledgers:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWallet();
    loadLedgers();
  };

  const handleAddFunds = () => {
    if (!userId) {
      Alert.alert('Lỗi', 'Không thể xác định người dùng');
      return;
    }
    setShowAddFundsModal(true);
  };

  const handleAddFundsSuccess = () => {
    loadWallet(); // Reload wallet to get updated balance
    loadLedgers(); // Reload ledgers to show new transaction
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <WalletIcon size={32} color="#22C55E" />
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getWalletStatusColor(wallet?.walletStatus || 0) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getWalletStatusColor(wallet?.walletStatus || 0) },
                ]}
              >
                {getWalletStatusName(wallet?.walletStatus || 0)}
              </Text>
            </View>
          </View>

          <View style={styles.balanceLabelRow}>
            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
            <TouchableOpacity
              onPress={() => setShowBalance(!showBalance)}
              style={styles.eyeButton}
            >
              {showBalance ? (
                <Eye size={20} color="#6B7280" />
              ) : (
                <EyeOff size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {showBalance ? formatCurrency(wallet?.balance || 0) : '********'}
          </Text>

          <View style={styles.walletInfo}>
            <View style={styles.walletInfoRow}>
              <Text style={styles.walletInfoLabel}>Loại tiền:</Text>
              <Text style={styles.walletInfoValue}>{wallet?.currency || 'VND'}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.addFundsButton, { flex: 1, marginRight: 8 }]}
              onPress={handleAddFunds}
              disabled={wallet?.walletStatus !== 0}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addFundsButtonText}>Nạp tiền</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.withdrawButton, { flex: 1 }]}
              onPress={() => router.push('/(tabs)/farmer/profile/withdraw' as any)}
            >
              <ArrowUpRight size={20} color="#FFFFFF" />
              <Text style={styles.withdrawButtonText}>Rút tiền</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lịch sử biến động</Text>
          </View>

          {ledgers.length > 0 ? (
            <View style={styles.transactionList}>
              {ledgers.slice(0, 5).map((ledger, index) => (
                <View
                  key={ledger.id}
                  style={[
                    styles.transactionItem,
                    index === Math.min(ledgers.length - 1, 4) && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIconContainer,
                        {
                          backgroundColor: getLedgerDirectionColor(ledger.direction) + '20',
                        },
                      ]}
                    >
                      {ledger.direction === 1 ? (
                        <ArrowDownLeft size={20} color={getLedgerDirectionColor(ledger.direction)} />
                      ) : (
                        <ArrowUpRight size={20} color={getLedgerDirectionColor(ledger.direction)} />
                      )}
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {ledger.description || getLedgerDirectionName(ledger.direction)}
                      </Text>
                      <Text style={styles.transactionDate}>{formatDate(ledger.createdAt)}</Text>
                    </View>
                  </View>

                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: getLedgerDirectionColor(ledger.direction) },
                      ]}
                    >
                      {ledger.direction === 1 ? '+' : '-'}{formatCurrency(ledger.amount)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTransactions}>
              <Clock size={48} color="#D1D5DB" />
              <Text style={styles.emptyTransactionsTitle}>Chưa có giao dịch nào</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Funds Modal */}
      {userId && (
        <AddFundsModal
          visible={showAddFundsModal}
          onClose={() => setShowAddFundsModal(false)}
          onSuccess={handleAddFundsSuccess}
          userId={userId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  eyeButton: {
    padding: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  walletInfo: {
    marginBottom: 20,
  },
  walletInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletInfoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  walletInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addFundsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addFundsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  withdrawButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  transactionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyTransactions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyTransactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
});
