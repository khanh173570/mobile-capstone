import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Wallet, CreditCard } from 'lucide-react-native';
import { payEscrowWithWallet, getPaymentUrl } from '../../services/escrowPaymentService';
import { useRouter } from 'expo-router';

interface BuyRequestDepositModalProps {
  visible: boolean;
  escrowId: string;
  depositAmount: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const BuyRequestDepositModal: React.FC<BuyRequestDepositModalProps> = ({
  visible,
  escrowId,
  depositAmount,
  onClose,
  onPaymentSuccess,
}) => {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'payos' | null>(null);

  const handlePayFromWallet = async () => {
    try {
      setPaying(true);
      setPaymentMethod('wallet');

      await payEscrowWithWallet(escrowId);

      Alert.alert('Thành công', 'Thanh toán cọc từ ví thành công!', [
        {
          text: 'OK',
          onPress: () => {
            onPaymentSuccess();
            onClose();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error paying from wallet:', error);
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể thanh toán từ ví. Vui lòng kiểm tra số dư.'
      );
    } finally {
      setPaying(false);
      setPaymentMethod(null);
    }
  };

  const handlePayWithPayOS = async () => {
    try {
      setPaying(true);
      setPaymentMethod('payos');

      const paymentUrl = await getPaymentUrl(escrowId);
      // Navigate to payment page with WebView
      router.push({
        pathname: '/pages/payment-remaining',
        params: {
          paymentUrl,
          amount: depositAmount,
          escrowId,
        },
      });
      onClose();
    } catch (error: any) {
      console.error('Error getting PayOS URL:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo liên kết thanh toán');
    } finally {
      setPaying(false);
      setPaymentMethod(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thanh toán cọc 30%</Text>
            <TouchableOpacity onPress={onClose} disabled={paying}>
              <MaterialIcons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Amount Display */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Số tiền cần thanh toán</Text>
            <Text style={styles.amountValue}>
              {depositAmount ? depositAmount.toLocaleString('vi-VN') : '0'} VND
            </Text>
            <View style={styles.warningBox}>
              <Text style={styles.amountNote}>
                ⚠️ BẠN PHẢI THANH TOÁN TRONG VÒNG 2 GIỜ
              </Text>
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.methodsSection}>
            <Text style={styles.methodsTitle}>Chọn phương thức thanh toán</Text>

            {/* Wallet Payment */}
            <TouchableOpacity
              style={[
                styles.methodButton,
                paymentMethod === 'wallet' && styles.methodButtonActive,
              ]}
              onPress={handlePayFromWallet}
              disabled={paying}
            >
              <View style={styles.methodIcon}>
                <Wallet size={24} color="#059669" />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>Thanh toán từ ví</Text>
                <Text style={styles.methodSubtitle}>
                  Thanh toán nhanh chóng từ ví của bạn
                </Text>
              </View>
              {paying && paymentMethod === 'wallet' && (
                <ActivityIndicator size="small" color="#059669" />
              )}
            </TouchableOpacity>

            {/* PayOS Payment */}
            <TouchableOpacity
              style={[
                styles.methodButton,
                paymentMethod === 'payos' && styles.methodButtonActive,
              ]}
              onPress={handlePayWithPayOS}
              disabled={paying}
            >
              <View style={styles.methodIcon}>
                <CreditCard size={24} color="#3B82F6" />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>Thanh toán PayOS</Text>
                <Text style={styles.methodSubtitle}>
                  Thanh toán qua ngân hàng hoặc thẻ
                </Text>
              </View>
              {paying && paymentMethod === 'payos' && (
                <ActivityIndicator size="small" color="#3B82F6" />
              )}
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={paying}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
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
    paddingVertical: 24,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  amountNote: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
  },
  warningBox: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  methodsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  methodsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  methodButtonActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});
