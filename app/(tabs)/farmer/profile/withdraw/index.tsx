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
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Landmark,
  TrendingDown,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react-native';
import {
  getMyBankAccounts,
  getMyWithdrawRequests,
  getBanks,
  createUserBankAccount,
  updateUserBankAccount,
  deleteUserBankAccount,
  createWithdrawRequest,
  getWithdrawStatusName,
  getWithdrawStatusColor,
  UserBankAccount,
  WithdrawRequest,
  Bank as BankType,
} from '../../../../../services/withdrawService';
import { getMyWallet } from '../../../../../services/walletService';
import { getUserProfile } from '../../../../../services/authService';
import { handleError } from '../../../../../utils/errorHandler';

export default function FarmerWithdrawScreen() {
  const [bankAccounts, setBankAccounts] = useState<UserBankAccount[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [banks, setBanks] = useState<BankType[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');

  // Form states
  const [selectedBank, setSelectedBank] = useState<BankType | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<UserBankAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showBankSelector, setShowBankSelector] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [editingAccount, setEditingAccount] = useState<UserBankAccount | null>(null);

  const getFilteredBanks = (searchText: string) => {
    if (!searchText.trim()) return banks;
    const lowerSearch = searchText.toLowerCase();
    return banks.filter(
      (bank) =>
        bank.name.toLowerCase().includes(lowerSearch) ||
        bank.shortName.toLowerCase().includes(lowerSearch)
    );
  };

  const filteredBanks = getFilteredBanks(bankSearch);

  const formatNumber = (num: string) => {
    const numericValue = num.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue).toLocaleString('vi-VN');
  };

  const getNumericValue = (formatted: string) => {
    return parseFloat(formatted.replace(/\./g, '')) || 0;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();
      if (profile && profile.data) {
        setUserId(profile.data.id);
      }

      const walletData = await getMyWallet();
      setWallet(walletData);
      setWalletId(walletData.id);

      const [accounts, requests, bankList] = await Promise.all([
        getMyBankAccounts(),
        getMyWithdrawRequests(),
        getBanks(),
      ]);

      setBankAccounts(accounts);
      setWithdrawRequests(requests);
      setBanks(bankList);
    } catch (error) {
      handleError(error, 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddBankAccount = async () => {
    if (!selectedBank || !accountNumber || !accountName) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    Alert.alert(
      'Xác nhận thêm tài khoản',
      `Bạn có chắc muốn thêm tài khoản ${selectedBank.shortName} - ${accountNumber}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setSubmitting(true);
            try {
              if (editingAccount) {
                await updateUserBankAccount(editingAccount.id, {
                  accountNumber,
                  accountName,
                  bankId: selectedBank.id,
                  isPrimary: true,
                });
                Alert.alert('Thành công', 'Cập nhật tài khoản thành công!');
              } else {
                await createUserBankAccount({
                  userId,
                  accountNumber,
                  accountName,
                  bankId: selectedBank.id,
                  isPrimary: true,
                });
                Alert.alert('Thành công', 'Thêm tài khoản thành công!');
              }

              setShowAddAccount(false);
              resetForm();
              await loadData();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể thêm tài khoản');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setSelectedBank(null);
    setAccountNumber('');
    setAccountName('');
    setBankSearch('');
    setShowBankSelector(false);
    setEditingAccount(null);
  };

  const handleEditAccount = (account: UserBankAccount) => {
    setEditingAccount(account);
    setSelectedBank(account.bank || null);
    setAccountNumber(account.accountNumber);
    setAccountName(account.accountName);
    setShowAddAccount(true);
  };

  const handleDeleteAccount = (account: UserBankAccount) => {
    Alert.alert(
      'Xác nhận xóa',
      `Xóa tài khoản ${account.accountName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserBankAccount(account.id);
              Alert.alert('Thành công', 'Đã xóa tài khoản!');
              await loadData();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa tài khoản');
            }
          },
        },
      ]
    );
  };

  const handleCreateWithdraw = async () => {
    if (!selectedAccount || !withdrawAmount) {
      Alert.alert('Lỗi', 'Vui lòng chọn tài khoản và nhập số tiền');
      return;
    }

    const amount = getNumericValue(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Lỗi', 'Số tiền không hợp lệ');
      return;
    }

    if (amount < 5000) {
      Alert.alert('Lỗi', 'Số tiền rút tối thiểu là 5.000 ₫');
      return;
    }

    if (amount > (wallet?.balance || 0)) {
      Alert.alert('Lỗi', 'Số tiền rút vượt quá số dư ví');
      return;
    }

    Alert.alert(
      'Xác nhận rút tiền',
      `Rút ${amount.toLocaleString('vi-VN')} ₫ vào tài khoản ${selectedAccount.accountName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setSubmitting(true);
            try {
              await createWithdrawRequest({
                userId,
                walletId,
                userBankAccountId: selectedAccount.id,
                amount,
              });

              Alert.alert('Thành công', 'Yêu cầu rút tiền đã được tạo!', [
                {
                  text: 'OK',
                  onPress: () => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                    setSelectedAccount(null);
                    loadData();
                  },
                },
              ]);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể tạo yêu cầu');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rút tiền</Text>
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
        <Text style={styles.headerTitle}>Rút tiền</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <RefreshCw size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư ví</Text>
          <Text style={styles.balanceAmount}>
            {(wallet?.balance || 0).toLocaleString('vi-VN')} ₫
          </Text>
        </View>

        {/* Bank Accounts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tài khoản ngân hàng</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                resetForm();
                setShowAddAccount(true);
              }}
            >
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {bankAccounts.length > 0 ? (
            <>
              {bankAccounts.map((account) => (
                <View key={account.id} style={styles.accountCard}>
                  <View style={styles.accountLeft}>
                    <View style={styles.accountIcon}>
                      <Landmark size={24} color="#22C55E" />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{account.accountName}</Text>
                      <Text style={styles.accountNumber}>{account.accountNumber}</Text>
                      <Text style={styles.accountBank}>
                        {account.bank?.shortName || 'Ngân hàng'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.accountActions}>
                    <TouchableOpacity onPress={() => handleEditAccount(account)}>
                      <Edit2 size={20} color="#22C55E" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteAccount(account)}>
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.withdrawButton}
                onPress={() => setShowWithdrawModal(true)}
              >
                <TrendingDown size={20} color="#FFFFFF" />
                <Text style={styles.withdrawButtonText}>Rút tiền</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Chưa có tài khoản. Hãy thêm tài khoản để rút tiền.
              </Text>
            </View>
          )}
        </View>

        {/* Withdraw History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sử rút tiền</Text>

          {withdrawRequests.length > 0 ? (
            withdrawRequests.map((request) => (
              <View key={request.id} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View
                    style={[
                      styles.historyIcon,
                      { backgroundColor: getWithdrawStatusColor(request.status) + '20' },
                    ]}
                  >
                    <TrendingDown
                      size={20}
                      color={getWithdrawStatusColor(request.status)}
                    />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyAmount}>
                      -{request.amount.toLocaleString('vi-VN')} ₫
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getWithdrawStatusColor(request.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: getWithdrawStatusColor(request.status) },
                    ]}
                  >
                    {getWithdrawStatusName(request.status)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Clock size={32} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>Chưa có yêu cầu rút tiền</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Account Modal */}
      <Modal
        visible={showAddAccount}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddAccount(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản'}
              </Text>
              <TouchableOpacity onPress={() => { setShowAddAccount(false); resetForm(); }}>
                <Text style={{ fontSize: 24, color: '#6B7280' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Chọn ngân hàng</Text>
              <TouchableOpacity
                style={styles.bankSelector}
                onPress={() => setShowBankSelector(!showBankSelector)}
              >
                <Text style={styles.bankSelectorText}>
                  {selectedBank ? selectedBank.shortName : 'Chọn ngân hàng...'}
                </Text>
              </TouchableOpacity>

              {showBankSelector && (
                <>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm ngân hàng..."
                    value={bankSearch}
                    onChangeText={setBankSearch}
                  />
                  <View style={styles.bankList}>
                    {filteredBanks.map((bank) => (
                      <TouchableOpacity
                        key={bank.id}
                        style={styles.bankOption}
                        onPress={() => {
                          setSelectedBank(bank);
                          setShowBankSelector(false);
                          setBankSearch('');
                        }}
                      >
                        <Text style={styles.bankOptionText}>{bank.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.label}>Số tài khoản</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số tài khoản"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Tên chủ tài khoản</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên chủ tài khoản"
                value={accountName}
                onChangeText={setAccountName}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddBankAccount}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingAccount ? 'Cập nhật' : 'Thêm tài khoản'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rút tiền</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Text style={{ fontSize: 24, color: '#6B7280' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Chọn tài khoản</Text>
              <ScrollView style={styles.accountSelector} horizontal showsHorizontalScrollIndicator={false}>
                {bankAccounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountSelectItem,
                      selectedAccount?.id === account.id && styles.accountSelectItemActive,
                    ]}
                    onPress={() => setSelectedAccount(account)}
                  >
                    <Text style={styles.accountSelectText} numberOfLines={1}>
                      {account.bank?.shortName}
                    </Text>
                    <Text style={styles.accountSelectNumber} numberOfLines={1}>
                      {account.accountNumber}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Số tiền rút (₫)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số tiền (tối thiểu 5.000)"
                value={withdrawAmount}
                onChangeText={(text) => setWithdrawAmount(formatNumber(text))}
                keyboardType="numeric"
              />

              <Text style={styles.note}>
                Số dư: {(wallet?.balance || 0).toLocaleString('vi-VN')} ₫
              </Text>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateWithdraw}
                disabled={submitting || !selectedAccount}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Rút tiền</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#22C55E',
  },
  section: {
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  accountBank: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  accountActions: {
    flexDirection: 'row',
    gap: 12,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalForm: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },
  bankSelector: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  bankSelectorText: {
    fontSize: 14,
    color: '#111827',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
    marginTop: 8,
    marginBottom: 8,
  },
  bankList: {
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bankOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bankOptionText: {
    fontSize: 14,
    color: '#111827',
  },
  accountSelector: {
    marginTop: 8,
    marginBottom: 16,
  },
  accountSelectItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 100,
  },
  accountSelectItemActive: {
    backgroundColor: '#22C55E',
  },
  accountSelectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  accountSelectNumber: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  note: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
