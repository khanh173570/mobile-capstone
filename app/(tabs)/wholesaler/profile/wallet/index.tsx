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
  ArrowLeft,
  Plus,
  RefreshCw,
  CreditCard,
  TrendingUp,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Eye,
  EyeOff,
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
import { getUserProfile } from '../../../../../services/authService';
import AddFundsModal from '../../../../../components/wholesaler/AddFundsModal';
import { handleError } from '../../../../../utils/errorHandler';

export default function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [showBalance, setShowBalance] = useState(true);

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
      // Don't show error for ledgers as it's not critical
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải thông tin ví...</Text>
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
            <WalletIcon size={32} color="#3B82F6" />
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
            {/* <View style={styles.walletInfoRow}>
              <Text style={styles.walletInfoLabel}>ID Ví:</Text>
              <Text style={styles.walletInfoValueSmall} numberOfLines={1}>
                {wallet?.id || '-'}
              </Text>
            </View> */}
          </View>

          {/* Add Funds Button */}
          <TouchableOpacity
            style={styles.addFundsButton}
            onPress={handleAddFunds}
            disabled={wallet?.walletStatus !== 0}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addFundsButtonText}>Nạp tiền</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lịch sử biến động</Text>
            <View style={styles.transactionCount}>
              <Text style={styles.transactionCountText}>
                {ledgers.length} giao dịch
              </Text>
            </View>
          </View>

          {ledgers.length > 0 ? (
            <View style={styles.transactionList}>
              {ledgers.slice(0, 10).map((ledger, index) => (
                <View 
                  key={ledger.id} 
                  style={[
                    styles.transactionItem,
                    index === Math.min(ledgers.length - 1, 9) && { borderBottomWidth: 0 }
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
                      <Text style={styles.transactionDate}>
                        {formatDate(ledger.createdAt)}
                      </Text>
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
                    <Text style={styles.transactionBalance}>
                      Số dư: {formatCurrency(ledger.balanceAfter)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTransactions}>
              <Clock size={48} color="#9CA3AF" />
              <Text style={styles.emptyTransactionsTitle}>
                Chưa có giao dịch nào
              </Text>
              <Text style={styles.emptyTransactionsSubtitle}>
                Lịch sử giao dịch sẽ hiển thị tại đây
              </Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        {/* <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 Lưu ý</Text>
          <Text style={styles.infoText}>
            • Số tiền nạp tối thiểu là 10,000 ₫{'\n'}
            • Số tiền nạp tối đa là 100,000,000 ₫{'\n'}
            • Giao dịch được xử lý ngay lập tức{'\n'}
            • Liên hệ hỗ trợ nếu có vấn đề với ví
          </Text>
        </View> */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    gap: 8,
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
  walletInfoValueSmall: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    maxWidth: 200,
  },
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addFundsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuresSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 20,
  },
  // Transaction History Styles
  transactionSection: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionCount: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  transactionCountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  transactionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    marginBottom: 4,
  },
  transactionBalance: {
    fontSize: 11,
    color: '#6B7280',
  },
  emptyTransactions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTransactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTransactionsSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
