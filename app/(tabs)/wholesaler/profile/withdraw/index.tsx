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
  Animated,
  Dimensions,
  Switch,
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

// Marquee Text Component
function MarqueeText({ text, style }: { text: string; style?: any }) {
  const scrollAnim = React.useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = React.useState(0);
  const [containerWidth, setContainerWidth] = React.useState(100);
  const isOverflow = textWidth > containerWidth;

  React.useEffect(() => {
    if (isOverflow) {
      Animated.loop(
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(scrollAnim, {
            toValue: -textWidth,
            duration: textWidth * 50,
            useNativeDriver: false,
          }),
          Animated.timing(scrollAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isOverflow, textWidth]);

  return (
    <View
      style={[{ overflow: 'hidden', flex: 1 }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.Text
        style={[
          style,
          {
            transform: [{ translateX: scrollAnim }],
            width: isOverflow ? textWidth : undefined,
          },
        ]}
        onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
        numberOfLines={1}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

export default function WithdrawScreen() {
  const [bankAccounts, setBankAccounts] = useState<UserBankAccount[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [banks, setBanks] = useState<BankType[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWithdrawRequest, setSelectedWithdrawRequest] = useState<WithdrawRequest | null>(null);
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
  const [showAllBanks, setShowAllBanks] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserBankAccount | null>(null);
  const [displayedHistoryCount, setDisplayedHistoryCount] = useState(10);

  // Optimized bank filtering function
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
  const displayedBanks = showAllBanks ? filteredBanks : filteredBanks.slice(0, 16);

  // Format number with thousand separator
  const formatNumber = (num: string) => {
    const numericValue = num.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue).toLocaleString('vi-VN');
  };

  // Get numeric value from formatted string
  const getNumericValue = (formatted: string) => {
    return parseFloat(formatted.replace(/\./g, '')) || 0;
  };

  // Validate withdraw amount
  const validateWithdrawAmount = (amount: string) => {
    const numericAmount = getNumericValue(amount);
    if (numericAmount === 0) return null;
    if (numericAmount < 5000) return 'invalid'; // Less than minimum
    if (numericAmount > (wallet?.balance || 0)) return 'exceeded'; // Exceeds balance
    return 'valid';
  };

  const withdrawAmountStatus = validateWithdrawAmount(withdrawAmount);

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
    setDisplayedHistoryCount(10); // Reset về 10 items khi refresh
    loadData();
  };

  const handleAddBankAccount = async () => {
    if (!selectedBank || !accountNumber || !accountName) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    Alert.alert(
      'Xác nhận thêm tài khoản',
      `Bạn có chắc muốn thêm tài khoản ngân hàng ${selectedBank.shortName} - ${accountNumber}${isPrimary ? ' làm tài khoản chính' : ''}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setSubmitting(true);
            try {
              await createUserBankAccount({
                userId,
                accountNumber,
                accountName,
                bankId: selectedBank.id,
                isPrimary,
              });
              Alert.alert('Thành công', 'Thêm tài khoản ngân hàng thành công!');
              
              setShowAddAccount(false);
              setSelectedBank(null);
              setAccountNumber('');
              setAccountName('');
              setBankSearch('');
              setShowAllBanks(false);
              setIsPrimary(false);
              setEditingAccount(null);
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

  const handleDeleteAccount = (account: UserBankAccount) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa tài khoản ${account.accountName} - ${account.bank?.shortName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserBankAccount(account.id);
              Alert.alert('Thành công', 'Đã xóa tài khoản ngân hàng!');
              await loadData();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa tài khoản');
            }
          },
        },
      ]
    );
  };

  const handleWithdrawAmountChange = (text: string) => {
    const formatted = formatNumber(text);
    setWithdrawAmount(formatted);
  };

  const handleViewWithdrawDetail = (request: WithdrawRequest) => {
    setSelectedWithdrawRequest(request);
    setShowDetailModal(true);
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
      `Bạn sắp rút ${amount.toLocaleString('vi-VN')} ₫ vào tài khoản ${selectedAccount.accountName}.\n\nHành động này không thể hoàn tác.`,
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

              Alert.alert(
                'Thành công',
                'Yêu cầu rút tiền đã được tạo. Vui lòng đợi xử lý.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setShowWithdrawModal(false);
                      setWithdrawAmount('');
                      setSelectedAccount(null);
                      loadData();
                    },
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể tạo yêu cầu rút tiền');
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Wallet Balance Card */}
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
              onPress={() => setShowAddAccount(true)}
            >
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {bankAccounts.length > 0 ? (
            bankAccounts.map((account) => (
              <View key={account.id} style={styles.accountCard}>
                {account.bank?.logo ? (
                  <Image
                    source={{ uri: account.bank.logo }}
                    style={styles.accountBankLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.accountIcon}>
                    <Landmark size={24} color="#3B82F6" />
                  </View>
                )}
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.accountName}</Text>
                  <Text style={styles.accountNumber}>
                    {account.accountNumber}
                  </Text>
                  <Text style={styles.accountBank}>
                    {account.bank?.shortName || 'Ngân hàng'}
                  </Text>
                </View>
                <View style={styles.accountActions}>
                  {account.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Chính</Text>
                    </View>
                  )}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAccount(account)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Chưa có tài khoản ngân hàng. Hãy thêm tài khoản để rút tiền.
              </Text>
            </View>
          )}

          {bankAccounts.length > 0 && (
            <TouchableOpacity
              style={styles.withdrawButton}
              onPress={() => setShowWithdrawModal(true)}
            >
              <TrendingDown size={20} color="#FFFFFF" />
              <Text style={styles.withdrawButtonText}>Rút tiền</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Withdraw History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biến động số dư</Text>

          {withdrawRequests.length > 0 ? (
            <>
              {withdrawRequests.slice(0, displayedHistoryCount).map((request) => (
                <TouchableOpacity
                  key={request.id}
                  style={styles.historyCard}
                  onPress={() => handleViewWithdrawDetail(request)}
                >
                  <View style={styles.historyLeft}>
                    <View
                      style={[
                        styles.historyIcon,
                        {
                          backgroundColor:
                            getWithdrawStatusColor(request.status) + '20',
                        },
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
                        {new Date(request.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </Text>
                      <Text style={styles.historyTime}>
                        {new Date(request.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getWithdrawStatusColor(request.status) + '20',
                        },
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
                </TouchableOpacity>
              ))}
              {withdrawRequests.length > displayedHistoryCount && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setDisplayedHistoryCount(withdrawRequests.length)}
                >
                  <Text style={styles.showMoreText}>
                    Xem thêm ({withdrawRequests.length - displayedHistoryCount} yêu cầu)
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Clock size={32} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                Chưa có yêu cầu rút tiền nào
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Bank Account Modal */}
      <Modal
        visible={showAddAccount}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddAccount(false);
          setBankSearch('');
          setShowAllBanks(false);
          setIsPrimary(false);
          setEditingAccount(null);
          setSelectedBank(null);
          setAccountNumber('');
          setAccountName('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản ngân hàng'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddAccount(false);
                  setBankSearch('');
                  setShowAllBanks(false);
                  setIsPrimary(false);
                  setEditingAccount(null);
                  setSelectedBank(null);
                  setAccountNumber('');
                  setAccountName('');
                }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalContent}>
              <Text style={styles.label}>Chọn ngân hàng</Text>
              
              {/* Search Input */}
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm ngân hàng..."
                placeholderTextColor="#9CA3AF"
                value={bankSearch}
                onChangeText={setBankSearch}
              />
              
              {/* Bank Grid - Show first 16 (4 cols x 4 rows) by default */}
              <View style={styles.bankGrid}>
                {displayedBanks.map((bank) => (
                  <TouchableOpacity
                    key={bank.id}
                    style={[
                      styles.bankGridItem,
                      selectedBank?.id === bank.id && styles.bankGridItemSelected,
                    ]}
                    onPress={() => setSelectedBank(bank)}
                  >
                    {bank.logo ? (
                      <Image
                        source={{ uri: bank.logo }}
                        style={styles.bankGridLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <Landmark size={40} color="#3B82F6" />
                    )}
                    <Text style={styles.bankGridName} numberOfLines={2}>
                      {bank.shortName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Show More Button */}
              {!showAllBanks && filteredBanks.length > 16 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllBanks(true)}
                >
                  <Text style={styles.showMoreText}>Xem thêm ({filteredBanks.length - 16} ngân hàng)</Text>
                </TouchableOpacity>
              )}

              {/* Show Less Button */}
              {showAllBanks && filteredBanks.length > 16 && (
                <TouchableOpacity
                  style={styles.showLessButton}
                  onPress={() => setShowAllBanks(false)}
                >
                  <Text style={styles.showLessText}>Ẩn bớt</Text>
                </TouchableOpacity>
              )}

              {/* Selected Bank Display */}
              {selectedBank && (
                <View style={styles.selectedBankInfo}>
                  {selectedBank.logo ? (
                    <Image
                      source={{ uri: selectedBank.logo }}
                      style={styles.selectedBankInfoLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <Landmark size={32} color="#3B82F6" />
                  )}
                  <Text
                    style={styles.selectedBankInfoText}
                    numberOfLines={2}
                  >
                    Đã chọn: {selectedBank.name}
                  </Text>
                </View>
              )}

              {/* Account Number */}
              <Text style={styles.label}>Số tài khoản</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số tài khoản"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
              />

              {/* Account Name */}
              <Text style={styles.label}>Tên chủ tài khoản</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên chủ tài khoản"
                value={accountName}
                onChangeText={setAccountName}
              />

              {/* Is Primary Switch */}
              <View style={styles.switchContainer}>
                <View>
                  <Text style={styles.switchLabel}>Đặt làm tài khoản chính</Text>
                  <Text style={styles.switchDescription}>
                    Tài khoản chính sẽ được ưu tiên hiển thị
                  </Text>
                </View>
                <Switch
                  value={isPrimary}
                  onValueChange={setIsPrimary}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={isPrimary ? '#3B82F6' : '#F3F4F6'}
                />
              </View>

              {/* Buttons */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowAddAccount(false);
                    setBankSearch('');
                    setShowAllBanks(false);
                    setIsPrimary(false);
                    setEditingAccount(null);
                    setSelectedBank(null);
                    setAccountNumber('');
                    setAccountName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={handleAddBankAccount}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      Thêm
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rút tiền</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Select Account */}
              <Text style={styles.label}>Chọn tài khoản nhận tiền</Text>
              <View style={styles.accountSelectList}>
                {bankAccounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountSelectItem,
                      selectedAccount?.id === account.id &&
                        styles.accountSelectItemSelected,
                    ]}
                    onPress={() => setSelectedAccount(account)}
                  >
                    <View>
                      <Text style={styles.accountSelectName}>
                        {account.accountName}
                      </Text>
                      <Text style={styles.accountSelectBank}>
                        {account.bank?.shortName} - {account.accountNumber}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount Input */}
              <Text style={styles.label}>Số tiền rút</Text>
              <View>
                <TextInput
                  style={[
                    styles.input,
                    withdrawAmountStatus === 'valid' && styles.inputValid,
                    withdrawAmountStatus === 'exceeded' && styles.inputError,
                    withdrawAmountStatus === 'invalid' && styles.inputError,
                  ]}
                  placeholder="Nhập số tiền (tối thiểu 5.000 ₫)"
                  placeholderTextColor="#9CA3AF"
                  value={withdrawAmount}
                  onChangeText={handleWithdrawAmountChange}
                  keyboardType="numeric"
                />
                {withdrawAmount && (
                  <View style={styles.amountValidation}>
                    {withdrawAmountStatus === 'valid' && (
                      <Text style={styles.validText}>
                        ✓ Số tiền hợp lệ: {withdrawAmount} ₫
                      </Text>
                    )}
                    {withdrawAmountStatus === 'exceeded' && (
                      <Text style={styles.errorText}>
                        ✗ Số tiền vượt quá số dư ({(wallet?.balance || 0).toLocaleString('vi-VN')} ₫)
                      </Text>
                    )}
                    {withdrawAmountStatus === 'invalid' && (
                      <Text style={styles.errorText}>
                        ✗ Số tiền tối thiểu là 5.000 ₫
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <Text style={styles.amountNote}>
                Số dư hiện tại: {(wallet?.balance || 0).toLocaleString('vi-VN')} ₫
              </Text>

              {/* Buttons */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowWithdrawModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={handleCreateWithdraw}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Rút tiền</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Withdraw Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết yêu cầu rút tiền</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedWithdrawRequest && (
                <View style={styles.detailContainer}>
                  {/* Amount */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Số tiền</Text>
                    <Text style={styles.detailAmountValue}>
                      {selectedWithdrawRequest.amount.toLocaleString('vi-VN')} ₫
                    </Text>
                  </View>

                  {/* Status */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Trạng thái</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getWithdrawStatusColor(selectedWithdrawRequest.status) + '20',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: getWithdrawStatusColor(selectedWithdrawRequest.status) },
                        ]}
                      >
                        {getWithdrawStatusName(selectedWithdrawRequest.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Bank Account */}
                  {(() => {
                    const bankAccount = bankAccounts.find(
                      (acc) => acc.id === selectedWithdrawRequest.userBankAccountId
                    );
                    return bankAccount ? (
                      <View style={styles.detailRowColumn}>
                        <Text style={styles.detailLabel}>Tài khoản ngân hàng</Text>
                        <View style={styles.bankInfoContainer}>
                          {bankAccount.bank?.logo && (
                            <Image
                              source={{ uri: bankAccount.bank.logo }}
                              style={styles.detailBankLogo}
                              resizeMode="contain"
                            />
                          )}
                          <View style={styles.bankInfoText}>
                            <Text style={styles.bankInfoName}>
                              {bankAccount.bank?.name || 'N/A'}
                            </Text>
                            <Text style={styles.bankInfoAccount}>
                              {bankAccount.accountName} - {bankAccount.accountNumber}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ) : null;
                  })()}

                  {/* Created Date */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ngày tạo</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedWithdrawRequest.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                      {' '}
                      {new Date(selectedWithdrawRequest.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  {/* Transaction ID */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mã giao dịch</Text>
                    <Text style={styles.detailValue}>
                      {selectedWithdrawRequest.transactionId}
                    </Text>
                  </View>

                  {/* Reason */}
                  <View style={styles.detailRowColumn}>
                    <Text style={styles.detailLabel}>Ghi chú từ Admin</Text>
                    {selectedWithdrawRequest.reason ? (
                      <View style={styles.reasonBox}>
                        <Text style={styles.reasonText}>
                          {selectedWithdrawRequest.reason}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.detailValue}>Chưa cập nhật</Text>
                    )}
                  </View>

                  {/* Updated Date */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cập nhật lúc</Text>
                    <Text style={styles.detailValue}>
                      {selectedWithdrawRequest.updatedAt
                        ? new Date(selectedWithdrawRequest.updatedAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          }) +
                          ' ' +
                          new Date(selectedWithdrawRequest.updatedAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Chưa cập nhật'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Close Button */}
              <TouchableOpacity
                style={[styles.button, styles.submitButton, { marginTop: 24 }]}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={styles.submitButtonText}>Đóng</Text>
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
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountBankLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
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
    fontSize: 11,
    color: '#9CA3AF',
  },
  accountActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
    marginBottom: 8,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    color: '#EF4444',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  showMoreText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  showLessButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  showLessText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedBankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  selectedBankInfoLogo: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  selectedBankInfoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
    flex: 1,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    marginTop: 80,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    marginTop: 8,
  },
  searchInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    marginBottom: 14,
    color: '#111827',
  },
  bankSelectButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  selectedBankDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedBankLogo: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  selectedBankName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  bankSelectPlaceholder: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  bankSelectorContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  bankSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 16,
  },
  bankSelectorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 12,
    paddingHorizontal: 0,
    gap: 8,
    justifyContent: 'space-between',
  },
  bankGridItem: {
    width: 75,
    height: 75,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  bankGridItemSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  bankGridLogo: {
    width: 44,
    height: 44,
    marginBottom: 4,
  },
  bankGridName: {
    fontSize: 9,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 12,
  },
  bankList: {
    marginBottom: 16,
  },
  bankItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bankItemSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#0284C7',
  },
  bankItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    marginBottom: 12,
  },
  inputValid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  amountValidation: {
    marginTop: -8,
    marginBottom: 12,
  },
  validText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  accountSelectList: {
    marginBottom: 16,
  },
  accountSelectItem: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  accountSelectItemSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#0284C7',
  },
  accountSelectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  accountSelectBank: {
    fontSize: 12,
    color: '#6B7280',
  },
  amountNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 40,

  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailContainer: {
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailRowColumn: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  detailAmountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
  },
  reasonBox: {
    marginTop: 10,
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  reasonText: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  bankInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailBankLogo: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  bankInfoText: {
    flex: 1,
  },
  bankInfoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  bankInfoAccount: {
    fontSize: 13,
    color: '#6B7280',
  },
});
