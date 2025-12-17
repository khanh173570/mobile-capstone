import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { X, Wallet, CreditCard } from 'lucide-react-native';
import {
  payRemainingEscrowWithWallet,
  getPayRemainingEscrowUrl,
} from '../../services/escrowContractService';
import { useRouter } from 'expo-router';

interface BuyRequestPayRemainingModalProps {
  visible: boolean;
  escrowId: string;
  remainingAmount: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const BuyRequestPayRemainingModal: React.FC<BuyRequestPayRemainingModalProps> = ({
  visible,
  escrowId,
  remainingAmount,
  onClose,
  onPaymentSuccess,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'payos' | null>(null);

  const handlePayWithWallet = async () => {
    try {
      setLoading(true);
      setPaymentMethod('wallet');

      const success = await payRemainingEscrowWithWallet(escrowId);

      if (success) {
        Alert.alert(
          'Thanh toán thành công',
          'Bạn đã thanh toán phần còn lại bằng ví thành công!',
          [
            {
              text: 'OK',
              onPress: () => {
                onPaymentSuccess();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Lỗi', 'Không thể thanh toán. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Error paying with wallet:', error);
      const errorMessage = error?.message || 'Có lỗi xảy ra khi thanh toán';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
      setPaymentMethod(null);
    }
  };

  const handlePayWithPayOS = async () => {
    try {
      setLoading(true);
      setPaymentMethod('payos');

      const paymentUrl = await getPayRemainingEscrowUrl(escrowId);

      if (paymentUrl) {
        // Navigate to payment page with the URL
        router.push({
          pathname: '/pages/payment-remaining',
          params: {
            paymentUrl,
            amount: remainingAmount,
            escrowId,
          },
        });
        onClose();
      } else {
        Alert.alert('Lỗi', 'Không thể lấy link thanh toán');
      }
    } catch (error: any) {
      console.error('Error getting PayOS URL:', error);
      const errorMessage = error?.message || 'Có lỗi xảy ra khi tạo link thanh toán';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
      setPaymentMethod(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Thanh toán phần còn lại</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Số tiền cần thanh toán</Text>
              <Text style={styles.amountValue}>
                {remainingAmount.toLocaleString('vi-VN')} VND
              </Text>
            </View>

            <Text style={styles.methodTitle}>Chọn phương thức thanh toán</Text>

            {/* Wallet Payment */}
            <TouchableOpacity
              style={[
                styles.methodButton,
                loading && paymentMethod !== 'wallet' && styles.methodButtonDisabled,
              ]}
              onPress={handlePayWithWallet}
              disabled={loading}
            >
              <View style={styles.methodContent}>
                <View style={styles.methodIcon}>
                  <Wallet size={24} color="#10B981" />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>Ví của tôi</Text>
                  <Text style={styles.methodDesc}>Thanh toán nhanh từ ví</Text>
                </View>
              </View>
              {loading && paymentMethod === 'wallet' && (
                <ActivityIndicator size="small" color="#10B981" />
              )}
            </TouchableOpacity>

            {/* PayOS Payment */}
            <TouchableOpacity
              style={[
                styles.methodButton,
                loading && paymentMethod !== 'payos' && styles.methodButtonDisabled,
              ]}
              onPress={handlePayWithPayOS}
              disabled={loading}
            >
              <View style={styles.methodContent}>
                <View style={styles.methodIcon}>
                  <CreditCard size={24} color="#3B82F6" />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>PayOS</Text>
                  <Text style={styles.methodDesc}>Thanh toán qua ngân hàng</Text>
                </View>
              </View>
              {loading && paymentMethod === 'payos' && (
                <ActivityIndicator size="small" color="#3B82F6" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 20,
  },
  amountCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#15803D',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16A34A',
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  methodButtonDisabled: {
    opacity: 0.5,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
});
