import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { X, Wallet, Smartphone } from 'lucide-react-native';
import { payEscrowWithWallet } from '../../services/escrowPaymentService';

interface EscrowPaymentModalProps {
  visible: boolean;
  escrowId: string;
  amount: number;
  fullPrice?: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onPaymentFailure?: () => void;
  onOpenPaymentWebView?: () => void; // For MoMo payment
}

export default function EscrowPaymentModal({
  visible,
  escrowId,
  amount,
  fullPrice,
  onClose,
  onPaymentSuccess,
  onPaymentFailure,
  onOpenPaymentWebView,
}: EscrowPaymentModalProps) {
  // Calculate deposit (30% of full price) if fullPrice is provided
  const depositAmount = fullPrice ? fullPrice * 0.3 : amount;
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'wallet' | 'qr' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTimeoutAlert, setShowTimeoutAlert] = useState(false);

  // Show timeout alert when modal opens
  useEffect(() => {
    if (visible && !showTimeoutAlert) {
      setShowTimeoutAlert(true);
      Alert.alert(
        'Xác nhận đặt cọc',
        'Bạn phải cọc trong vòng 2h, còn lại hệ thống sẽ hủy giao dịch.',
        [
          {
            text: 'Hủy',
            onPress: () => {
              setShowTimeoutAlert(false);
              onClose();
            },
            style: 'cancel',
          },
          {
            text: 'Đồng ý',
            onPress: () => {
              setShowTimeoutAlert(false);
            },
          },
        ]
      );
    }
  }, [visible]);

  // Reset states when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedOption(null);
      setShowConfirm(false);
      setShowTimeoutAlert(false);
    }
  }, [visible]);

  const handleSelectWallet = () => {
    setSelectedOption('wallet');
    setShowConfirm(true);
  };

  const handleSelectQR = () => {
    setSelectedOption('qr');
    setShowConfirm(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOption) return;

    if (selectedOption === 'wallet') {
      await handlePayWithWallet();
    } else if (selectedOption === 'qr') {
      handlePayWithQR();
    }
  };

  const handlePayWithWallet = async () => {
    setLoading(true);
    try {
      //console.log('Paying escrow with wallet, escrowId:', escrowId, 'amount:', amount);
      
      const result = await payEscrowWithWallet(escrowId);
      
      if (result) {
        Alert.alert(
          'Thanh toán thành công',
          `Đã thanh toán cọc ${depositAmount.toLocaleString('vi-VN')} ₫ thành công!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedOption(null);
                setShowConfirm(false);
                onClose();
                onPaymentSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Thanh toán thất bại',
          'Không thể thanh toán cọc. Vui lòng thử lại.',
          [{ text: 'OK' }]
        );
        onPaymentFailure?.();
      }
    } catch (error: any) {
      console.error('Error paying escrow with wallet:', error);
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể thanh toán cọc. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
      onPaymentFailure?.();
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithQR = () => {
    setSelectedOption(null);
    setShowConfirm(false);
    onClose();
    onOpenPaymentWebView?.();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thanh toán cọc</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.amountSection}>
            <View style={styles.depositInfoBox}>
              <Text style={styles.depositInfoText}>
                💡 Số tiền cọc là 30% giá trị đơn hàng
              </Text>
            </View>
            <Text style={styles.amountLabel}>Số tiền cọc cần thanh toán (30%)</Text>
            <Text style={styles.amountValue}>
              {depositAmount.toLocaleString('vi-VN')} ₫
            </Text>
            {fullPrice && (
              <Text style={styles.fullPriceText}>
                Tổng giá trị: {fullPrice.toLocaleString('vi-VN')} ₫
              </Text>
            )}
          </View>

          {/* Payment Options or Confirmation */}
          {!showConfirm ? (
            <ScrollView style={styles.optionsContainer}>
              <Text style={styles.optionsTitle}>Chọn phương thức thanh toán</Text>

              {/* Wallet Option */}
              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleSelectWallet}
                disabled={loading}
              >
                <View style={styles.optionIcon}>
                  <Wallet size={28} color="#3B82F6" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Thanh toán từ ví</Text>
                  <Text style={styles.optionDescription}>
                    Sử dụng số dư ví của bạn
                  </Text>
                </View>
              </TouchableOpacity>

              {/* QR Code Option */}
              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleSelectQR}
                disabled={loading}
              >
                <View style={styles.optionIcon}>
                  <Smartphone size={28} color="#A100F2" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Quét mã QR</Text>
                  <Text style={styles.optionDescription}>
                    Thanh toán qua PayOS
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* Confirmation Screen */
            <View style={styles.confirmContainer}>
              <Text style={styles.confirmTitle}>
                Xác nhận {selectedOption === 'wallet' ? 'từ ví' : 'qua QR'}
              </Text>
              <View style={styles.confirmDepositBox}>
                <Text style={styles.confirmDepositLabel}>Số tiền cọc (30%)</Text>
                <Text style={styles.confirmDepositAmount}>
                  {depositAmount.toLocaleString('vi-VN')} ₫
                </Text>
                {fullPrice && (
                  <Text style={styles.confirmFullPriceText}>
                    Tổng giá trị: {fullPrice.toLocaleString('vi-VN')} ₫
                  </Text>
                )}
              </View>
              <Text style={styles.confirmMessage}>
                Phần còn lại (70%) sẽ thanh toán khi nhận hàng
              </Text>
              <Text style={styles.confirmWarning}>
                ⚠️ Hành động này không thể hoàn tác
              </Text>

              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Đang xử lý...</Text>
                </View>
              )}
            </View>
          )}

          {/* Buttons */}
          <View style={styles.footer}>
            {showConfirm ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowConfirm(false);
                    setSelectedOption(null);
                  }}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Quay lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.confirmButton, loading && styles.buttonDisabled]}
                  onPress={handleConfirmPayment}
                  disabled={loading}
                >
                  <Text style={styles.confirmButtonText}>
                    {loading ? 'Đang xử lý...' : 'Xác nhận'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>Đóng</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  amountSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  depositInfoBox: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    marginBottom: 12,
  },
  depositInfoText: {
    fontSize: 13,
    color: '#1E40AF',
    textAlign: 'center',
  },
  amountLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
  },
  fullPriceText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  optionsContainer: {
    maxHeight: 350,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  confirmContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    minHeight: 200,
    justifyContent: 'center',
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmDepositBox: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#22C55E',
    marginBottom: 12,
    alignItems: 'center',
  },
  confirmDepositLabel: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
    marginBottom: 8,
  },
  confirmDepositAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#22C55E',
  },
  confirmFullPriceText: {
    fontSize: 12,
    color: '#166534',
    marginTop: 6,
  },
  confirmMessage: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmWarning: {
    fontSize: 13,
    color: '#D97706',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#E5E7EB',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
