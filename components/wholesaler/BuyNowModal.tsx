import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { executeBuyNow } from '../../services/auctionBuyNowService';
import { formatCurrency } from '../../services/escrowPaymentService';

interface BuyNowModalProps {
  visible: boolean;
  auction: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BuyNowModal({
  visible,
  auction,
  onClose,
  onSuccess,
}: BuyNowModalProps) {
  const [loading, setLoading] = useState(false);

  const handleBuyNow = async () => {
    try {
      setLoading(true);

      // Execute buy now - Only call API, no payment
      const result = await executeBuyNow(auction.id);
      console.log('Buy now result:', result);

      setLoading(false);
      
      // Show success message
      Alert.alert(
        'Mua ngay thành công',
        'Bạn đã mua sản phẩm này thành công. Phiên đấu giá đã kết thúc.',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              onSuccess();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error in buy now:', error);
      setLoading(false);
      Alert.alert('Lỗi', error.message || 'Không thể thực hiện mua ngay');
    }
  };

  const handlePayWithWallet = async () => {
    try {
      setLoading(true);
      console.log('Paying buy now with wallet, escrowId:', escrowId);
      
      const result = await payEscrowWithWallet(escrowId);
      
      if (result) {
        Alert.alert(
          'Thanh toán thành công',
          'Mua ngay và thanh toán thành công!',
          [
            {
              text: 'OK',
              onPress: () => {
                handleClose();
                onSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Thanh toán thất bại',
          'Không thể thanh toán. Vui lòng thử lại.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error paying with wallet:', error);
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể thanh toán. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithQR = async () => {
    try {
      setLoading(true);
      
      // Get payment URL
      const url = await getPaymentUrl(escrowId);
      console.log('Payment URL:', url);
      
      setPaymentUrl(url);
      setLoading(false);
      setShowPaymentWebView(true);
    } catch (error: any) {
      console.error('Error getting payment URL:', error);
      setLoading(false);
      Alert.alert('Lỗi', error.message || 'Không thể tạo link thanh toán');
    }
  };

  const handleClose = () => {
    onClose();
    setStep('confirm');
    setShowPaymentWebView(false);
    setPaymentUrl('');
    setEscrowId('');
  };

  const handlePaymentSuccess = () => {
    setShowPaymentWebView(false);
    Alert.alert(
      'Thanh toán thành công',
      'Mua ngay và thanh toán thành công!',
      [
        {
          text: 'OK',
          onPress: () => {
            handleClose();
            onSuccess();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Mua ngay</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Product Info */}
          <View style={styles.content}>
            <View style={styles.infoSection}>
              <Text style={styles.label}>Giá mua ngay</Text>
              <Text style={styles.buyNowPrice}>
                {formatCurrency(auction.buyNowPrice || auction.currentPrice)}
              </Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.label}>Số lượng dự kiến</Text>
              <Text style={styles.value}>
                {auction.expectedTotalQuantity.toLocaleString('vi-VN')} kg
              </Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.label}>Ngày cần hàng</Text>
              <Text style={styles.value}>
                {new Date(auction.expectedHarvestDate).toLocaleDateString('vi-VN')}
              </Text>
            </View>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Bằng cách bấm "Xác nhận mua ngay", bạn đồng ý mua sản phẩm này với giá trên. Phiên đấu giá sẽ kết thúc ngay lập tức.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.disabledButton]}
              onPress={handleBuyNow}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Xác nhận mua ngay</Text>
              )}
            </TouchableOpacity>
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
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  buyNowPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#DC2626',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
