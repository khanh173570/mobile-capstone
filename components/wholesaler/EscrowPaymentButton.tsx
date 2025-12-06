import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CreditCard, CheckCircle } from 'lucide-react-native';
import {
  getEscrowByAuctionId,
  getPaymentUrl,
  EscrowData,
  EscrowStatus,
  getEscrowStatusName,
  getEscrowStatusColor,
} from '../../services/escrowService';
import { handleError } from '../../utils/errorHandler';
import PaymentWebView from '../shared/PaymentWebView';
import EscrowPaymentModal from '../shared/EscrowPaymentModal';

interface EscrowPaymentButtonProps {
  auctionId: string;
  isWinner: boolean;
  currentPrice: number;
  onPaymentComplete?: () => void;
}

export default function EscrowPaymentButton({ 
  auctionId, 
  isWinner, 
  currentPrice,
  onPaymentComplete 
}: EscrowPaymentButtonProps) {
  const [escrow, setEscrow] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentWebViewVisible, setPaymentWebViewVisible] = useState(false);

  useEffect(() => {
    if (isWinner) {
      loadEscrowInfo();
    }
  }, [isWinner, auctionId]);

  const loadEscrowInfo = async () => {
    try {
      setLoading(true);
      const escrowData = await getEscrowByAuctionId(auctionId);
      setEscrow(escrowData);
    } catch (error) {
      console.error('Error loading escrow:', error);
      // Silently fail - escrow might not exist yet
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentPress = async () => {
    if (!escrow) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin hợp đồng ký quỹ');
      return;
    }

    // Check if already paid
    if (escrow.escrowStatus === EscrowStatus.FullyFunded || 
        escrow.escrowStatus === EscrowStatus.Completed) {
      Alert.alert('Thông báo', 'Bạn đã thanh toán đủ số tiền ký quỹ');
      return;
    }

    // Show payment option modal
    setShowPaymentModal(true);
  };

  const handleOpenPaymentWebView = async () => {
    if (!escrow) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin hợp đồng ký quỹ');
      return;
    }

    try {
      setLoading(true);
      const url = await getPaymentUrl(escrow.id);
      setPaymentUrl(url);
      setPaymentWebViewVisible(true);
      setShowPaymentModal(false);
    } catch (error) {
      handleError(error, 'Không thể tạo link thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    Alert.alert(
      'Thành công!',
      'Thanh toán đã hoàn tất. Vui lòng đợi xác nhận từ hệ thống.',
      [
        {
          text: 'OK',
          onPress: () => {
            loadEscrowInfo(); // Reload escrow info
            if (onPaymentComplete) {
              onPaymentComplete();
            }
          }
        }
      ]
    );
  };

  const handlePaymentFailure = () => {
    Alert.alert(
      'Thanh toán thất bại',
      'Không thể hoàn tất thanh toán. Vui lòng thử lại.',
      [{ text: 'OK' }]
    );
  };

  if (!isWinner || !escrow) {
    return null;
  }

  const isPending = escrow.escrowStatus === EscrowStatus.PendingPayment;
  const isPaid = escrow.escrowStatus === EscrowStatus.FullyFunded || 
                 escrow.escrowStatus === EscrowStatus.Completed;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <>
      <View style={styles.container}>
        {/* Escrow Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getEscrowStatusColor(escrow.escrowStatus) + '20' }]}>
          <Text style={[styles.statusText, { color: getEscrowStatusColor(escrow.escrowStatus) }]}>
            {getEscrowStatusName(escrow.escrowStatus)}
          </Text>
        </View>

        {/* Payment Button */}
        {isPending && (
          <TouchableOpacity
            style={styles.paymentButton}
            onPress={handlePaymentPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <CreditCard size={20} color="#FFFFFF" />
                <Text style={styles.paymentButtonText}>Đặt cọc ngay</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isPaid && (
          <View style={styles.paidBadge}>
            <CheckCircle size={20} color="#10B981" />
            <Text style={styles.paidText}>Đã thanh toán</Text>
          </View>
        )}

        {/* Escrow Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tổng tiền ký quỹ:</Text>
            <Text style={styles.detailValue}>{formatCurrency(escrow.totalAmount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phí dịch vụ:</Text>
            <Text style={styles.detailValue}>{formatCurrency(escrow.feeAmount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Người bán nhận:</Text>
            <Text style={[styles.detailValue, styles.sellerAmount]}>
              {formatCurrency(escrow.sellerReceiveAmount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Payment Method Modal */}
      <EscrowPaymentModal
        visible={showPaymentModal}
        escrowId={escrow?.id || ''}
        amount={escrow?.totalAmount || 0}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
        onOpenPaymentWebView={handleOpenPaymentWebView}
      />

      {/* Payment WebView */}
      <PaymentWebView
        visible={paymentWebViewVisible}
        paymentUrl={paymentUrl}
        onClose={() => setPaymentWebViewVisible(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  paidText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  sellerAmount: {
    color: '#22C55E',
    fontWeight: '700',
  },
});
