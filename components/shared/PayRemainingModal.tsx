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
  Image,
} from 'react-native';
import { X, Wallet, Smartphone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getPayRemainingEscrowUrl, payRemainingEscrowWithWallet } from '../../services/escrowContractService';

interface PayRemainingModalProps {
  visible: boolean;
  escrowId: string;
  amount: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onPaymentFailure?: () => void;
}

export default function PayRemainingModal({
  visible,
  escrowId,
  amount,
  onClose,
  onPaymentSuccess,
  onPaymentFailure,
}: PayRemainingModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'wallet' | 'qr' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setSelectedOption(null);
      setShowConfirm(false);
      setShowQRCode(false);
      setQrCodeUrl(null);
    }
  }, [visible]);

  const handleSelectWallet = () => {
    setSelectedOption('wallet');
    setShowConfirm(true);
  };

  const handleSelectQR = async () => {
    setSelectedOption('qr');
    setLoading(true);
    try {
      console.log('Getting QR code for remaining escrow:', escrowId);
      
      const paymentUrl = await getPayRemainingEscrowUrl(escrowId);
      
      if (paymentUrl) {
        console.log('Payment URL received:', paymentUrl);
        setSelectedOption(null);
        onClose();
        // Navigate to payment page
        router.push({
          pathname: '/pages/payment-remaining',
          params: {
            paymentUrl: paymentUrl,
            amount: amount.toLocaleString('vi-VN'),
            escrowId: escrowId,
          },
        });
      } else {
        Alert.alert(
          'Lỗi',
          'Không thể lấy mã QR. Vui lòng thử lại.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error getting QR code:', error);
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể lấy mã QR. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedOption) return;

    if (selectedOption === 'wallet') {
      await handlePayWithWallet();
    }
  };

  const handlePayWithWallet = async () => {
    setLoading(true);
    try {
      console.log('Paying remaining escrow with wallet, escrowId:', escrowId, 'amount:', amount);
      
      const success = await payRemainingEscrowWithWallet(escrowId);
      
      if (success) {
        Alert.alert(
          'Thanh toán thành công',
          `Đã thanh toán ${amount.toLocaleString('vi-VN')} ₫ thành công!`,
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
        throw new Error('Thanh toán thất bại');
      }
    } catch (error: any) {
      console.error('Error paying remaining escrow with wallet:', error);
      
      let errorMessage = error.message || 'Không thể thanh toán. Vui lòng thử lại.';
      
      Alert.alert(
        'Lỗi thanh toán',
        errorMessage,
        [
          { 
            text: 'OK',
            onPress: () => {
              setSelectedOption(null);
              setShowConfirm(false);
            }
          },
        ]
      );
      onPaymentFailure?.();
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithMoMo = async () => {
    setLoading(true);
    try {
      console.log('Getting MoMo payment URL for remaining escrow:', escrowId);
      
      const paymentUrl = await getPayRemainingEscrowUrl(escrowId);
      
      if (paymentUrl) {
        console.log('Payment URL received:', paymentUrl);
        setSelectedOption(null);
        setShowQRCode(false);
        onClose();
        // Navigate to payment page
        router.push({
          pathname: '/pages/payment-remaining',
          params: {
            paymentUrl: paymentUrl,
            amount: amount.toLocaleString('vi-VN'),
            escrowId: escrowId,
          },
        });
      } else {
        Alert.alert(
          'Thanh toán thất bại',
          'Không thể lấy mã QR. Vui lòng thử lại.',
          [{ text: 'OK' }]
        );
        onPaymentFailure?.();
      }
    } catch (error: any) {
      console.error('Error paying remaining escrow with MoMo:', error);
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể lấy mã QR. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
      onPaymentFailure?.();
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentScannedSuccess = () => {
    Alert.alert(
      'Thanh toán thành công',
      `Đã thanh toán ${amount.toLocaleString('vi-VN')} ₫ thành công!`,
      [
        {
          text: 'OK',
          onPress: () => {
            setQrCodeUrl(null);
            setShowQRCode(false);
            setSelectedOption(null);
            onClose();
            onPaymentSuccess();
          },
        },
      ]
    );
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
            <Text style={styles.headerTitle}>Thanh toán phần còn lại</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Số tiền thanh toán</Text>
            <Text style={styles.amountValue}>
              {amount.toLocaleString('vi-VN')} ₫
            </Text>
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
                    Quét mã QR bằng ứng dụng MoMo
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* Confirmation Screen */
            <View style={styles.confirmContainer}>
              <Text style={styles.confirmTitle}>
                Xác nhận {selectedOption === 'wallet' ? 'từ ví' : 'MoMo'}
              </Text>
              <Text style={styles.confirmMessage}>
                Bạn sắp thanh toán {amount.toLocaleString('vi-VN')} ₫ để hoàn tất giao dịch.
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
    maxHeight: '95%',
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
  amountLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 20,
  },
  confirmWarning: {
    fontSize: 13,
    color: '#D97706',
    marginBottom: 16,
  },
  qrContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  qrCode: {
    width: 320,
    height: 320,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  qrDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  qrAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    width: '100%',
  },
  paidButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  paidButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
