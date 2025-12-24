import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Clock3 } from 'lucide-react-native';
import {
  EscrowContract,
  formatCurrency,
  getEscrowStatusLabel,
  setEscrowReadyToHarvest,
  getPayRemainingEscrowUrl,
} from '../../services/escrowContractService';
import { completeEscrow } from '../../services/escrowPaymentService';
import { getAuctionDetail } from '../../services/auctionService';
import { getUserById, getUserInfoByUsername } from '../../services/authService';
import { getBuyRequestDetail, BuyRequest } from '../../services/buyRequestService';
import PayRemainingModal from './PayRemainingModal';
import { EscrowTransactions } from './EscrowTransactionsList';
import { DisputeInfoCard } from './DisputeInfoCard';
import { CreateDisputeModal } from './CreateDisputeModal';
import { ReviewDisputeModal } from './ReviewDisputeModal';
import { Dispute, getDisputeByEscrowId } from '../../services/disputeService';
import { RescheduleHarvestDateModal } from '../farmer/RescheduleHarvestDateModal';
import { BuyRequestDepositModal } from './BuyRequestDepositModal';
import { DollarSign, CheckCircle } from 'lucide-react-native';
import { DisputeResolutionModal } from './DisputeResolutionModal';

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
  const [completingEscrow, setCompletingEscrow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auctionInfo, setAuctionInfo] = useState<any>(null);
  const [buyRequestInfo, setBuyRequestInfo] = useState<BuyRequest | null>(null);
  const [farmerInfo, setFarmerInfo] = useState<any>(null);
  const [winnerInfo, setWinnerInfo] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loadingDispute, setLoadingDispute] = useState(false);
  const [showCreateDisputeModal, setShowCreateDisputeModal] = useState(false);
  const [showReviewDisputeModal, setShowReviewDisputeModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [disputeYPosition, setDisputeYPosition] = useState(0);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const handleCompleteEscrow = async () => {
    if (!contract) return;

    Alert.alert(
      'Xác nhận hoàn thành giao dịch',
      'Bạn có chắc chắn muốn hoàn thành giao dịch này? Hành động này không thể hoàn tác.',
      [
        {
          text: 'Hủy',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Hoàn thành',
          onPress: async () => {
            setCompletingEscrow(true);
            try {
              const success = await completeEscrow(contract.id);
              if (success) {
                Alert.alert(
                  'Thành công',
                  'Giao dịch đã được hoàn thành. Tiền đã được chuyển cho người bán.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        onStatusUpdated?.();
                        onClose();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Lỗi', 'Không thể hoàn thành giao dịch. Vui lòng thử lại.');
              }
            } catch (error: any) {
              console.error('Error completing escrow:', error);
              Alert.alert(
                'Lỗi',
                error.message || 'Không thể hoàn thành giao dịch. Vui lòng thử lại.'
              );
            } finally {
              setCompletingEscrow(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const fetchAuctionAndUserDetails = async () => {
    if (!contract) {
      setLoadingDetails(false);
      return;
    }

    setLoadingDetails(true);
    try {
      let farmerIdToFetch: string | null = null;
      let wholesalerIdToFetch: string | null = null;

      // Check if auctionId is valid (not empty UUID)
      const isValidAuctionId = contract.auctionId && contract.auctionId !== '00000000-0000-0000-0000-000000000000' && contract.buyRequestId === null;
      
      // Fetch auction details if auctionId exists and is valid (and buyRequestId is null)
      if (isValidAuctionId) {
        try {
          const auctionData = await getAuctionDetail(contract.auctionId);
          setAuctionInfo(auctionData);
          farmerIdToFetch = auctionData?.farmerId;
        } catch (auctionError: any) {
          // Silently handle 404 - auction might not exist or be deleted
          if (auctionError.message?.includes('404')) {
            //console.log('Auction not found for escrow, this is expected for buy request escrows');
          } else {
            console.error('Error fetching auction details:', auctionError);
          }
          setAuctionInfo(null);
        }
      }

      // Check if buyRequestId is valid (not empty UUID and not null)
      const isValidBuyRequestId = contract.buyRequestId !== null && contract.buyRequestId !== '00000000-0000-0000-0000-000000000000';
      // console.log('Contract data:', {
      //   auctionId: contract.auctionId,
      //   buyRequestId: contract.buyRequestId,
      //   isValidAuctionId,
      //   isValidBuyRequestId
      // });

      // Fetch buy request details if buyRequestId exists and is valid
      if (isValidBuyRequestId) {
        try {
          const buyRequestData = await getBuyRequestDetail(contract.buyRequestId!);
          //console.log('Buy request data fetched:', buyRequestData);
          setBuyRequestInfo(buyRequestData);
          farmerIdToFetch = buyRequestData.farmerId;
          wholesalerIdToFetch = buyRequestData.wholesalerId;
        } catch (buyRequestError: any) {
          console.error('Error fetching buy request details:', buyRequestError);
          setBuyRequestInfo(null);
        }
      } else {
        //console.log('buyRequestId is not valid, skipping buy request fetch');
      }

      // Fetch farmer info
      if (farmerIdToFetch) {
        //console.log('Fetching farmer with ID:', farmerIdToFetch);
        const farmerData = await getUserInfoByUsername(farmerIdToFetch);
        //console.log('Farmer data:', farmerData);
        setFarmerInfo(farmerData);
      }

      // Fetch winner/wholesaler info from winnerId or wholesalerId
      const winnerIdToFetch = contract.winnerId || wholesalerIdToFetch;
      if (winnerIdToFetch) {
        // //console.log('Fetching winner/wholesaler with ID:', winnerIdToFetch);
        const winnerData = await getUserInfoByUsername(winnerIdToFetch);
        // //console.log('Winner/wholesaler data:', winnerData);
        setWinnerInfo(winnerData);
      }

      // Fetch dispute info
      loadDisputeInfo(contract.id);
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadDisputeInfo = async (escrowId: string) => {
    try {
      setLoadingDispute(true);
      //console.log('[EscrowDetailModal] Loading dispute for escrowId:', escrowId);
      const disputeData = await getDisputeByEscrowId(escrowId);
      //console.log('[EscrowDetailModal] Dispute data loaded:', disputeData);
      setDispute(disputeData);
    } catch (error) {
      console.error('[EscrowDetailModal] Error loading dispute:', error);
      setDispute(null);
    } finally {
      setLoadingDispute(false);
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

  const handleDisputeSuccess = async () => {
    if (contract) {
      // Silent reload - fetch updated data without showing loading spinner
      try {
        // Reload dispute info
        await loadDisputeInfo(contract.id);
        
        // Silently refetch auction/buy request details to get updated status
        let farmerIdToFetch: string | null = null;
        let wholesalerIdToFetch: string | null = null;

        if (contract.auctionId) {
          try {
            const auctionData = await getAuctionDetail(contract.auctionId);
            setAuctionInfo(auctionData);
            farmerIdToFetch = auctionData?.farmerId;
          } catch (auctionError) {
            console.error('Error refetching auction details:', auctionError);
          }
        }

        if (contract.buyRequestId) {
          try {
            const buyRequestData = await getBuyRequestDetail(contract.buyRequestId);
            setBuyRequestInfo(buyRequestData);
            farmerIdToFetch = buyRequestData.farmerId;
            wholesalerIdToFetch = buyRequestData.wholesalerId;
          } catch (buyRequestError) {
            console.error('Error refetching buy request details:', buyRequestError);
          }
        }

        // Refresh user info if needed
        if (farmerIdToFetch && !farmerInfo) {
          const farmerData = await getUserInfoByUsername(farmerIdToFetch);
          setFarmerInfo(farmerData);
        }

        const winnerIdToFetch = contract.winnerId || wholesalerIdToFetch;
        if (winnerIdToFetch && !winnerInfo) {
          const winnerData = await getUserInfoByUsername(winnerIdToFetch);
          setWinnerInfo(winnerData);
        }
      } catch (error) {
        console.error('Error refreshing data after dispute:', error);
      }
      
      // Notify parent to refresh escrow list (silent reload)
      onStatusUpdated?.();
    }
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
  const shouldShowDepositButton = role === 'wholesaler' && contract.escrowStatus === 0; // Status 0: PendingPayment
  const shouldShowCompleteButton = role === 'wholesaler' && contract.escrowStatus === 3; // Status 3: FullyFunded
  const canCreateDispute = role === 'wholesaler' && contract.escrowStatus === 3 && !dispute; // Only wholesaler can create dispute
  const canReviewDispute = role === 'farmer' && dispute !== null && dispute?.disputeStatus === 0;
  // Show "View Dispute" button when dispute exists, but hide if farmer can review (to avoid duplicate buttons)
  const canViewDispute = dispute !== null && !canReviewDispute;
  // Show "View Dispute Resolution" button when dispute exists (for both farmer and wholesaler)
  const canViewResolution = dispute !== null;

  // Debug logs for dispute review
  //console.log('=== ESCROW DETAIL MODAL DEBUG ===');
  //console.log('Role:', role);
  //console.log('Escrow Status:', contract.escrowStatus);
  //console.log('Dispute:', dispute);
  //console.log('Loading Dispute:', loadingDispute);
  //console.log('Can Create Dispute:', canCreateDispute);
  //console.log('Can Review Dispute:', canReviewDispute);
  //console.log('Can View Dispute:', canViewDispute);
  if (dispute) {
    //console.log('Dispute Status:', dispute.disputeStatus);
    //console.log('Dispute ID:', dispute.id);
  }
  //console.log('================================');

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chi tiết giao dịch kí quỹ</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <MaterialIcons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView ref={scrollViewRef} style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {loadingDetails ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
              </View>
            ) : (
              <>
                {/* Status Section */}
                <View style={styles.statusSection}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>{statusLabel}</Text>
                  </View>
                  <Text style={styles.statusDate}>{createdDate}</Text>
                </View>

                {/* Auction Information */}
                {auctionInfo && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin đấu giá</Text>

                    <DetailRow
                      label="Mã phiên"
                      value={auctionInfo.sessionCode || 'Chưa cập nhật'}
                    />
                    <DetailRow
                      label="Ghi chú"
                      value={auctionInfo.note || 'Chưa cập nhật'}
                    />
                    <DetailRow
                      label="Số lượng dự kiến"
                      value={auctionInfo.expectedTotalQuantity ? `${auctionInfo.expectedTotalQuantity} kg` : 'Chưa cập nhật'}
                    />
                    <DetailRow
                      label="Ngày thu hoạch dự kiến"
                      value={
                        auctionInfo.expectedHarvestDate
                          ? new Date(auctionInfo.expectedHarvestDate).toLocaleDateString('vi-VN')
                          : 'Chưa cập nhật'
                      }
                    />
                  </View>
                )}

                {/* Buy Request Information */}
                {buyRequestInfo && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin yêu cầu mua</Text>

                    <DetailRow
                      label="Mã yêu cầu"
                      value={buyRequestInfo.requestCode || 'Chưa cập nhật'}
                    />
                    <DetailRow
                      label="Ngày cần thiết"
                      value={
                        buyRequestInfo.requiredDate
                          ? new Date(buyRequestInfo.requiredDate).toLocaleDateString('vi-VN')
                          : 'Chưa cập nhật'
                      }
                    />
                    <DetailRow
                      label="Giá dự kiến"
                      value={buyRequestInfo.expectedPrice ? formatCurrency(buyRequestInfo.expectedPrice) : 'Chưa cập nhật'}
                      highlight
                    />
                    <DetailRow
                      label="Loại mua"
                      value={buyRequestInfo.isBuyingBulk ? 'Mua toàn bộ' : 'Mua theo loại'}
                    />
                    <DetailRow
                      label="Trạng thái"
                      value={buyRequestInfo.status || 'Chưa cập nhật'}
                    />
                    <DetailRow
                      label="Ghi chú"
                      value={buyRequestInfo.message || 'Chưa cập nhật'}
                    />
                    {(buyRequestInfo.totalQuantity ?? 0) > 0 && (
                      <DetailRow
                        label="Tổng số lượng"
                        value={`${buyRequestInfo.totalQuantity} kg`}
                      />
                    )}
                  </View>
                )}

                {/* Farmer Information - Always show */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Thông tin nông dân</Text>

                  {farmerInfo ? (
                    <>
                      <DetailRow
                        label="Tên"
                        value={
                          farmerInfo.firstName || farmerInfo.lastName
                            ? `${farmerInfo.firstName || ''} ${farmerInfo.lastName || ''}`.trim()
                            : 'Chưa cập nhật'
                        }
                      />
                      <DetailRow 
                        label="Email" 
                        value={farmerInfo.email || 'Chưa cập nhật'} 
                      />
                      <DetailRow
                        label="Số điện thoại"
                        value={farmerInfo.phoneNumber || 'Chưa cập nhật'}
                      />
                      <DetailRow
                        label="Địa chỉ"
                        value={farmerInfo.address || 'Chưa cập nhật'}
                      />
                    </>
                  ) : (
                    <DetailRow
                      label="Trạng thái"
                      value="Đang tải..."
                    />
                  )}
                </View>

                {/* Winner Information - Always show */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Thông tin thương lái</Text>

                  {winnerInfo ? (
                    <>
                      <DetailRow
                        label="Tên"
                        value={
                          winnerInfo.firstName || winnerInfo.lastName
                            ? `${winnerInfo.firstName || ''} ${winnerInfo.lastName || ''}`.trim()
                            : 'Chưa cập nhật'
                        }
                      />
                      <DetailRow 
                        label="Email" 
                        value={winnerInfo.email || 'Chưa cập nhật'} 
                      />
                      <DetailRow
                        label="Số điện thoại"
                        value={winnerInfo.phoneNumber || 'Chưa cập nhật'}
                      />
                      <DetailRow
                        label="Địa chỉ"
                        value={winnerInfo.address || 'Chưa cập nhật'}
                      />
                    </>
                  ) : (
                    <DetailRow
                      label="Trạng thái"
                      value="Đang tải..."
                    />
                  )}
                </View>

                {/* Main Details */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Chi tiết giao dịch</Text>

                  <DetailRow
                    label="Mã giao dịch"
                    value={contract.id ? contract.id.slice(0, 8).toUpperCase() : 'Chưa cập nhật'}
                  />
                  <DetailRow
                    label="Ngày tạo"
                    value={contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                  />
                  {contract.paymentAt && (
                    <DetailRow
                      label="Ngày thanh toán"
                      value={new Date(contract.paymentAt).toLocaleDateString('vi-VN')}
                    />
                  )}
                  {contract.releasedAt && (
                    <DetailRow
                      label="Ngày phát hành"
                      value={new Date(contract.releasedAt).toLocaleDateString('vi-VN')}
                    />
                  )}
                  {contract.refundAt && (
                    <DetailRow
                      label="Ngày hoàn tiền"
                      value={new Date(contract.refundAt).toLocaleDateString('vi-VN')}
                    />
                  )}
                </View>

                {/* Financial Details */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Chi tiết tài chính</Text>

                  <DetailRow
                    label="Tổng tiền"
                    value={contract.totalAmount ? formatCurrency(contract.totalAmount) : 'Chưa cập nhật'}
                    highlight
                  />
                  <DetailRow 
                    label="Phí dịch vụ" 
                    value={contract.feeAmount ? formatCurrency(contract.feeAmount) : 'Chưa cập nhật'} 
                  />
                  <DetailRow 
                    label="Số tiền cọc" 
                    value={contract.escrowAmount ? formatCurrency(contract.escrowAmount) : 'Chưa cập nhật'} 
                  />

                  {role === 'farmer' ? (
                    <DetailRow
                      label="Bạn sẽ nhận"
                      value={contract.sellerReceiveAmount ? formatCurrency(contract.sellerReceiveAmount) : 'Chưa cập nhật'}
                      highlight
                    />
                  ) : (
                    <DetailRow
                      label="Bạn cần thanh toán"
                      value={contract.totalAmount ? formatCurrency(contract.totalAmount) : 'Chưa cập nhật'}
                      highlight
                    />
                  )}
                  {contract.paymentTransactionId && (
                    <DetailRow
                      label="Mã GD thanh toán"
                      value={contract.paymentTransactionId.slice(0, 12).toUpperCase()}
                    />
                  )}
                  {contract.releasedTransactioId && (
                    <DetailRow
                      label="Mã GD phát hành"
                      value={contract.releasedTransactioId.slice(0, 12).toUpperCase()}
                    />
                  )}
                  {contract.refundTransactionId && (
                    <DetailRow
                      label="Mã GD hoàn tiền"
                      value={contract.refundTransactionId.slice(0, 12).toUpperCase()}
                    />
                  )}
                </View>

                {/* Transaction Details */}
                {/* <View style={styles.section}>
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
                </View> */}

                {/* Dispute Section */}
                {loadingDispute ? (
                  <View 
                    style={styles.section}
                    onLayout={(event) => {
                      const { y } = event.nativeEvent.layout;
                      setDisputeYPosition(y);
                    }}
                  >
                    <View style={styles.loadingCard}>
                      <ActivityIndicator size="small" color="#EF4444" />
                      <Text style={styles.loadingCardText}>Đang tải tranh chấp...</Text>
                    </View>
                  </View>
                ) : dispute ? (
                  <View 
                    style={styles.section}
                    onLayout={(event) => {
                      const { y } = event.nativeEvent.layout;
                      setDisputeYPosition(y);
                    }}
                  >
                    <DisputeInfoCard
                      dispute={dispute}
                      showReviewButton={canReviewDispute}
                      onReview={() => setShowReviewDisputeModal(true)}
                    />
                  </View>
                ) : null}

                {/* Transactions List */}
                <EscrowTransactions escrowId={contract.id} />

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
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton, styles.flexButton]}
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

                {auctionInfo && (
                  <TouchableOpacity
                    style={[styles.button, styles.rescheduleButton]}
                    onPress={() => setShowRescheduleModal(true)}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Clock3 size={18} color="#FFFFFF" />
                        <Text style={styles.rescheduleButtonText}>
                          Gia hạn
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
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

            {shouldShowCompleteButton && (
              <TouchableOpacity
                style={[styles.button, styles.completeButton]}
                onPress={handleCompleteEscrow}
                disabled={completingEscrow}
              >
                {completingEscrow ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <CheckCircle size={20} color="#FFFFFF" />
                    <Text style={styles.completeButtonText}>
                      Hoàn thành giao dịch
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {canCreateDispute && (
              <TouchableOpacity
                style={[styles.button, styles.disputeButton]}
                onPress={() => setShowCreateDisputeModal(true)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="report-problem" size={20} color="#FFFFFF" />
                    <Text style={styles.disputeButtonText}>
                      Tạo tranh chấp
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {canReviewDispute && (
              <TouchableOpacity
                style={[styles.button, styles.reviewDisputeButton]}
                onPress={() => setShowReviewDisputeModal(true)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="rate-review" size={20} color="#FFFFFF" />
                    <Text style={styles.reviewDisputeButtonText}>
                      Xét duyệt tranh chấp
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {canViewDispute && (
              <TouchableOpacity
                style={[styles.button, styles.viewDisputeButton]}
                onPress={() => {
                  // Scroll to dispute section
                  if (disputeYPosition > 0) {
                    scrollViewRef.current?.scrollTo({ 
                      y: disputeYPosition - 20, 
                      animated: true 
                    });
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="info" size={20} color="#FFFFFF" />
                    <Text style={styles.viewDisputeButtonText}>
                      Xem tranh chấp
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {canViewResolution && (
              <TouchableOpacity
                style={[styles.button, styles.resolutionButton]}
                onPress={() => setShowResolutionModal(true)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="assessment" size={20} color="#FFFFFF" />
                    <Text style={styles.resolutionButtonText}>
                      Xem kết quả tranh chấp
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

            {shouldShowDepositButton && (
              <TouchableOpacity
                style={[styles.button, styles.depositButton]}
                onPress={() => setShowDepositModal(true)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    {/* <DollarSign size={20} color="#FFFFFF" /> */}
                    <Text style={styles.depositButtonText}>
                      Thanh toán cọc {contract?.escrowAmount.toLocaleString('vi-VN')} VND
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Deposit Payment Modal */}
      {contract && (
        <BuyRequestDepositModal
          visible={showDepositModal}
          escrowId={contract.id}
          depositAmount={contract.escrowAmount}
          onClose={() => setShowDepositModal(false)}
          onPaymentSuccess={() => {
            setShowDepositModal(false);
            onStatusUpdated?.();
          }}
        />
      )}

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

      {/* Create Dispute Modal */}
      {contract && (
        <CreateDisputeModal
          visible={showCreateDisputeModal}
          escrowId={contract.id}
          totalAmount={contract.totalAmount}
          isWholeSalerCreating={role === 'wholesaler'}
          onClose={() => setShowCreateDisputeModal(false)}
          onSuccess={handleDisputeSuccess}
        />
      )}

      {/* Review Dispute Modal */}
      {dispute && (
        <ReviewDisputeModal
          visible={showReviewDisputeModal}
          disputeId={dispute.id}
          onClose={() => setShowReviewDisputeModal(false)}
          onSuccess={handleDisputeSuccess}
        />
      )}

      {/* Dispute Resolution Modal */}
      {contract && (
        <DisputeResolutionModal
          visible={showResolutionModal}
          escrowId={contract.id}
          onClose={() => setShowResolutionModal(false)}
        />
      )}

      {/* Reschedule Harvest Modal */}
      {auctionInfo && contract && (
        <RescheduleHarvestDateModal
          visible={showRescheduleModal}
          auctionId={auctionInfo.id}
          currentExpectedHarvestDate={auctionInfo.expectedHarvestDate}
          onClose={() => setShowRescheduleModal(false)}
          onSuccess={() => {
            setShowRescheduleModal(false);
            // Reload auction info to show updated date
            if (auctionInfo.id) {
              getAuctionDetail(auctionInfo.id).then(updated => {
                setAuctionInfo(updated);
              });
            }
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
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loadingCardText: {
    fontSize: 13,
    color: '#6B7280',
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
    backgroundColor: '#FAFAFA',
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statusDate: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  flexButton: {
    flex: 1,
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
  disputeButton: {
    backgroundColor: '#EF4444',
  },
  disputeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  reviewDisputeButton: {
    backgroundColor: '#10B981',
  },
  reviewDisputeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  viewDisputeButton: {
    backgroundColor: '#3B82F6',
  },
  viewDisputeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  resolutionButton: {
    backgroundColor: '#6366F1',
  },
  resolutionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  depositButton: {
    backgroundColor: '#3B82F6',
  },
  depositButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: '#059669',
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  rescheduleButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 12,
    minWidth: 100,
  },
  rescheduleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
});
