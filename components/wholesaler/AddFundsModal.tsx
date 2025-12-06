import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Wallet, DollarSign } from 'lucide-react-native';
import { getAddFundsUrl } from '../../services/walletService';
import PaymentWebView from '../shared/PaymentWebView';

interface AddFundsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function AddFundsModal({
  visible,
  onClose,
  onSuccess,
  userId,
}: AddFundsModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');

  // Suggested amounts
  const suggestedAmounts = [
    100000, // 100k
    500000, // 500k
    1000000, // 1M
    5000000, // 5M
    10000000, // 10M
    20000000, // 20M
  ];

  const handleAmountSelect = (value: number) => {
    setAmount(value.toString());
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `${value / 1000000}M`;
    } else if (value >= 1000) {
      return `${value / 1000}K`;
    }
    return value.toString();
  };

  const handleAddFunds = async () => {
    const amountValue = parseFloat(amount);

    if (!amount || isNaN(amountValue)) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền');
      return;
    }

    if (amountValue < 10000) {
      Alert.alert('Lỗi', 'Số tiền nạp tối thiểu là 10,000 ₫');
      return;
    }

    if (amountValue > 100000000) {
      Alert.alert('Lỗi', 'Số tiền nạp tối đa là 100,000,000 ₫');
      return;
    }

    setLoading(true);
    try {
      console.log('AddFundsModal - Calling getAddFundsUrl with userId:', userId, 'amount:', amountValue);
      const url = await getAddFundsUrl(userId, amountValue);
      console.log('AddFundsModal - Got payment URL:', url);
      setPaymentUrl(url);
      setShowPayment(true);
    } catch (error: any) {
      console.error('AddFundsModal - Error:', error);
      Alert.alert(
        'Không thể tạo link thanh toán',
        error.message || 'Không thể tạo yêu cầu nạp tiền. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setPaymentUrl('');
    setAmount('');
    Alert.alert(
      'Thành công',
      'Nạp tiền thành công! Số dư ví của bạn đã được cập nhật.',
      [
        {
          text: 'OK',
          onPress: () => {
            onSuccess();
            onClose();
          },
        },
      ]
    );
  };

  const handlePaymentFailure = () => {
    setShowPayment(false);
    setPaymentUrl('');
    Alert.alert(
      'Thất bại',
      'Giao dịch nạp tiền không thành công. Vui lòng thử lại.',
      [{ text: 'OK' }]
    );
  };

  const handleClosePayment = () => {
    setShowPayment(false);
    setPaymentUrl('');
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Wallet size={24} color="#3B82F6" />
                <Text style={styles.headerTitle}>Nạp tiền vào ví</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Số tiền nạp</Text>
              <View style={styles.inputContainer}>
                <DollarSign size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Nhập số tiền"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.currency}>₫</Text>
              </View>
              <Text style={styles.inputHint}>
                Tối thiểu: 10,000 ₫ | Tối đa: 100,000,000 ₫
              </Text>
            </View>

            {/* Suggested Amounts */}
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsLabel}>Chọn nhanh:</Text>
              <View style={styles.suggestionsGrid}>
                {suggestedAmounts.map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.suggestionButton,
                      amount === value.toString() && styles.suggestionButtonActive,
                    ]}
                    onPress={() => handleAmountSelect(value)}
                  >
                    <Text
                      style={[
                        styles.suggestionText,
                        amount === value.toString() && styles.suggestionTextActive,
                      ]}
                    >
                      {formatCurrency(value)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addButton, loading && styles.addButtonDisabled]}
                onPress={handleAddFunds}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addButtonText}>Nạp tiền</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment WebView */}
      {showPayment && (
        <PaymentWebView
          visible={showPayment}
          paymentUrl={paymentUrl}
          onClose={handleClosePayment}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
    fontWeight: '600',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  suggestionsSection: {
    marginBottom: 24,
  },
  suggestionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  suggestionButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  suggestionTextActive: {
    color: '#3B82F6',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  addButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
