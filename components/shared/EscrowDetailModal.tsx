import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  EscrowContract,
  formatCurrency,
  getEscrowStatusLabel,
  setEscrowReadyToHarvest,
  getPayRemainingEscrowUrl,
} from '../../services/escrowContractService';
import { getAuctionDetail } from '../../services/auctionService';
import { getUserById, getUserInfoByUsername } from '../../services/authService';
import PayRemainingModal from './PayRemainingModal';

interface EscrowDetailModalProps {
  visible: boolean;
  contract: EscrowContract | null;
  onClose: () => void;
  role: 'farmer' | 'wholesaler';
  onStatusUpdated?: () => void;
}

export const EscrowDetailModal: React.FC<EscrowDetailModalProps> = ({
  visible,
  contract,
  onClose,
  role,
  onStatusUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auctionInfo, setAuctionInfo] = useState<any>(null);
  const [farmerInfo, setFarmerInfo] = useState<any>(null);
  const [winnerInfo, setWinnerInfo] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleReadyToHarvest = async () => {
    if (!contract) return;

    setLoading(true);
    setError(null);

    try {
      await setEscrowReadyToHarvest(contract.id);
      onStatusUpdated?.();
      onClose();
    } catch (err) {
      setError('Không thể cập nhật trạng thái. Vui lòng thử lại.');
      console.error('Error updating escrow status:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuctionAndUserDetails = async () => {
    if (!contract) {
      setLoadingDetails(false);
      return;
    }

    setLoadingDetails(true);
    try {
      // Fetch auction details
      const auctionData = await getAuctionDetail(contract.auctionId);
      console.log('Auction data:', auctionData);
      setAuctionInfo(auctionData);

      // Fetch farmer info
      if (auctionData?.farmerId) {
        console.log('Fetching farmer with ID:', auctionData.farmerId);
        const farmerData = await getUserInfoByUsername(auctionData.farmerId);
        console.log('Farmer data:', farmerData);
        setFarmerInfo(farmerData);
      }

      // Fetch winner info
      if (contract.winnerId) {
        console.log('Fetching winner with ID:', contract.winnerId);
        const winnerData = await getUserInfoByUsername(contract.winnerId);
        console.log('Winner data:', winnerData);
        setWinnerInfo(winnerData);
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (visible && contract) {
      fetchAuctionAndUserDetails();
    }
  }, [visible, contract]);

  const handlePayRemaining = () => {
    setShowPaymentModal(true);
  };

  if (!contract) {
    return null;
  }

  const getStatusColor = (status: number): string => {
    const colors: Record<number, string> = {
      0: '#F59E0B',
      1: '#3B82F6',
      2: '#8B5CF6',
      3: '#10B981',
      4: '#059669',
      5: '#EF4444',
      6: '#6B7280',
      7: '#9CA3AF',
      8: '#D1D5DB',
    };
    return colors[status] || '#6B7280';
  };

  const statusColor = getStatusColor(contract.escrowStatus);
  const statusLabel = getEscrowStatusLabel(contract.escrowStatus);
  const createdDate = new Date(contract.createdAt).toLocaleDateString('vi-VN');
  const canReadyToHarvest = role === 'farmer' && contract.escrowStatus <= 1;
  const canPayRemaining = role === 'wholesaler' && contract.escrowStatus === 2;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chi tiết hợp đồng</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <MaterialIcons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {loadingDetails ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
              </View>
            ) : (
              <>
                {/* Status Section */}
                <View style={[styles.statusSection, { backgroundColor: statusColor + '15' }]}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>{statusLabel}</Text>
                  </View>
                  <Text style={styles.statusDate}>{createdDate}</Text>
                </View>

                {/* Auction Information */}
                {auctionInfo && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin đấu giá</Text>

                    {/* <DetailRow label="ID Đấu giá" value={contract.auctionId} /> */}
                    <DetailRow
                      label="Mã phiên"
                      value={auctionInfo.sessionCode || 'N/A'}
                    />
                    <DetailRow
                      label="Ghi chú"
                      value={auctionInfo.note || 'Không có'}
                    />
                    <DetailRow
                      label="Giá khởi điểm"
                      value={formatCurrency(auctionInfo.startingPrice || 0)}
                    />
                    <DetailRow
                      label="Giá hiện tại"
                      value={formatCurrency(auctionInfo.currentPrice || 0)}
                      highlight
                    />
                    <DetailRow
                      label="Số lượng dự kiến"
                      value={`${auctionInfo.expectedTotalQuantity || 0} kg`}
                    />
                    <DetailRow
                      label="Ngày thu hoạch dự kiến"
                      value={
                        auctionInfo.expectedHarvestDate
                          ? new Date(auctionInfo.expectedHarvestDate).toLocaleDateString('vi-VN')
                          : 'N/A'
                      }
                    />
                  </View>
                )}

                {/* Farmer Information */}
                {farmerInfo && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin nông dân</Text>

                    <DetailRow
                      label="Tên"
                      value={`${farmerInfo.firstName || ''} ${farmerInfo.lastName || ''}`}
                    />
                    <DetailRow label="Email" value={farmerInfo.email || 'N/A'} />
                    <DetailRow
                      label="Số điện thoại"
                      value={farmerInfo.phoneNumber || 'N/A'}
                    />
                    <DetailRow
                      label="Địa chỉ"
                      value={farmerInfo.address || 'N/A'}
                    />
                  </View>
                )}

                {/* Winner Information */}
                {winnerInfo && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin thương lái</Text>

                    <DetailRow
                      label="Tên"
                      value={`${winnerInfo.firstName || ''} ${winnerInfo.lastName || ''}`}
                    />
                    <DetailRow label="Email" value={winnerInfo.email || 'N/A'} />
                    <DetailRow
                      label="Số điện thoại"
                      value={winnerInfo.phoneNumber || 'N/A'}
                    />
                    <DetailRow
                      label="Địa chỉ"
                      value={winnerInfo.address || 'N/A'}
                    />
                  </View>
                )}

                {/* Main Details */}
                <View style={styles.section}>
            

                  {contract.paymentAt && (
                    <DetailRow
                      label="Ngày thanh toán"
                      value={new Date(contract.paymentAt).toLocaleDateString('vi-VN')}
                    />
                  )}
                </View>

                {/* Financial Details */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Chi tiết tài chính</Text>

                  <DetailRow
                    label="Tổng tiền"
                    value={formatCurrency(contract.totalAmount)}
                    highlight
                  />
                  <DetailRow label="Phí dịch vụ" value={formatCurrency(contract.feeAmount)} />
                  <DetailRow label="Số tiền cọc" value={formatCurrency(contract.escrowAmount)} />

                  {role === 'farmer' ? (
                    <DetailRow
                      label="Bạn sẽ nhận"
                      value={formatCurrency(contract.sellerReceiveAmount)}
                      highlight
                    />
                  ) : (
                    <DetailRow
                      label="Bạn cần thanh toán"
                      value={formatCurrency(contract.totalAmount)}
                      highlight
                    />
                  )}
                </View>

                {/* Transaction Details */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Chi tiết giao dịch</Text>

                  {contract.paymentTransactionId ? (
                    <DetailRow
                      label="Giao dịch thanh toán"
                      value={contract.paymentTransactionId}
                      isTransaction
                    />
                  ) : (
                    <DetailRow label="Giao dịch thanh toán" value="Chưa thanh toán" />
                  )}

                  {contract.releasedTransactioId ? (
                    <DetailRow
                      label="Giao dịch phát hành"
                      value={contract.releasedTransactioId}
                      isTransaction
                    />
                  ) : (
                    <DetailRow label="Giao dịch phát hành" value="Chưa phát hành" />
                  )}
                     <DetailRow label="Ngày tạo" value={createdDate} />
                </View>

                {/* Error Message */}
                {error && (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error" size={20} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            {canReadyToHarvest && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleReadyToHarvest}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>
                      Sẵn sàng thu hoạch
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {canPayRemaining && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handlePayRemaining}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="payment" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>
                      Thanh toán phần còn lại
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Payment Modal for remaining amount */}
      {contract && (
        <PayRemainingModal
          visible={showPaymentModal}
          escrowId={contract.id}
          amount={contract.totalAmount}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            onStatusUpdated?.();
          }}
        />
      )}
    </Modal>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  isTransaction?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, highlight, isTransaction }) => (
  <View style={[styles.detailRow, highlight && styles.highlightRow]}>
    <Text style={[styles.detailLabel, highlight && styles.highlightLabel]}>{label}</Text>
    <Text
      style={[
        styles.detailValue,
        highlight && styles.highlightValue,
        isTransaction && styles.transactionValue,
      ]}
      numberOfLines={isTransaction ? 1 : 0}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  statusSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightRow: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    borderRadius: 6,
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  highlightLabel: {
    color: '#1F2937',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  highlightValue: {
    fontSize: 15,
    color: '#0284C7',
    fontWeight: '700',
  },
  transactionValue: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#DC2626',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});
