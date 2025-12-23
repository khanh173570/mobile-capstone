import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Package, Calendar, DollarSign, Tag, ChevronLeft, AlertCircle, Sprout, Store } from 'lucide-react-native';
import { BuyRequest } from '../../../../services/buyRequestHistoryService';
import { getBuyRequestEscrow, BuyRequestEscrow } from '../../../../services/buyRequestService';
import { BuyRequestDepositModal } from '../../../../components/shared/BuyRequestDepositModal';
import { BuyRequestPayRemainingModal } from '../../../../components/shared/BuyRequestPayRemainingModal';
import { CreateDisputeModal } from '../../../../components/shared/CreateDisputeModal';
import { ReviewDisputeModal } from '../../../../components/shared/ReviewDisputeModal';
import { DisputeInfoCard } from '../../../../components/shared/DisputeInfoCard';
import { Dispute, getDisputeByEscrowId } from '../../../../services/disputeService';
import { getUserById, User, getUserByUsername } from '../../../../services/authService';
import { getHarvestById, Harvest } from '../../../../services/harvestService';
import { getCropById, Crop } from '../../../../services/cropService';

export default function BuyRequestHistoryDetailScreen() {
  const params = useLocalSearchParams();
  const buyRequest = params.buyRequest ? JSON.parse(params.buyRequest as string) : null;
  
  const [escrow, setEscrow] = useState<BuyRequestEscrow | null>(null);
  const [loadingEscrow, setLoadingEscrow] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showPayRemainingModal, setShowPayRemainingModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loadingDispute, setLoadingDispute] = useState(false);
  const [farmerInfo, setFarmerInfo] = useState<User | null>(null);
  const [wholesalerInfo, setWholesalerInfo] = useState<User | null>(null);
  const [harvestInfo, setHarvestInfo] = useState<Harvest | null>(null);
  const [cropInfo, setCropInfo] = useState<Crop | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(false);

  if (!buyRequest) {
    return (
      <View style={styles.container}>
        <Text>Không tìm thấy yêu cầu</Text>
      </View>
    );
  }

  const getStatusColor = (status: string | number): string => {
    // Convert number to string if needed
    let statusStr = typeof status === 'number' ? String(status) : status;
    
    switch (statusStr) {
      case 'Pending':
      case '0':
        return '#F59E0B';
      case 'Accepted':
      case '1':
        return '#10B981';
      case 'Rejected':
      case '2':
        return '#EF4444';
      case 'Completed':
      case '3':
        return '#3B82F6';
      case 'Canceled':
      case '4':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string | number): string => {
    // Convert number to string if needed
    let statusStr = typeof status === 'number' ? String(status) : status;
    
    switch (statusStr) {
      case 'Pending':
      case '0':
        return 'Chờ xử lý';
      case 'Accepted':
      case '1':
        return 'Đã chấp nhận';
      case 'Rejected':
      case '2':
        return 'Bị từ chối';
      case 'Completed':
      case '3':
        return 'Hoàn thành';
      case 'Canceled':
      case '4':
        return 'Đã hủy';
      default:
        return statusStr;
    }
  };

  const getEscrowStatusLabel = (status: string | number): string => {
    let statusStr = typeof status === 'number' ? String(status) : status;
    
    switch (statusStr) {
      case 'PendingPayment':
      case '0':
        return 'Chờ thanh toán cọc';
      case 'Deposited':
      case '1':
        return 'Đã đặt cọc';
      case 'ReadyToHarvest':
      case '2':
        return 'Sẵn sàng thu hoạch';
      case 'FullyFunded':
      case '3':
        return 'Đã thanh toán đủ';
      case 'Completed':
      case '4':
        return 'Hoàn thành';
      case 'Disputed':
      case '5':
        return 'Đang tranh chấp';
      case 'Refunded':
      case '6':
        return 'Đã hoàn tiền';
      case 'PartialRefund':
      case '7':
        return 'Hoàn tiền một phần';
      case 'Canceled':
      case '8':
        return 'Đã hủy';
      default:
        return statusStr;
    }
  };

  const getEscrowStatusColor = (status: string | number): string => {
    let statusStr = typeof status === 'number' ? String(status) : status;
    
    switch (statusStr) {
      case 'PendingPayment':
      case '0':
        return '#F59E0B';
      case 'Deposited':
      case '1':
        return '#10B981';
      case 'ReadyToHarvest':
      case '2':
        return '#3B82F6';
      case 'FullyFunded':
      case '3':
        return '#8B5CF6';
      case 'Completed':
      case '4':
        return '#06B6D4';
      case 'Disputed':
      case '5':
        return '#DC2626';
      case 'Refunded':
      case '6':
        return '#6B7280';
      case 'PartialRefund':
      case '7':
        return '#EC4899';
      case 'Canceled':
      case '8':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  useEffect(() => {
    if (buyRequest && buyRequest.status === 'Accepted') {
      loadEscrowInfo();
    }
  }, [buyRequest?.id, buyRequest?.status]);

  useEffect(() => {
    loadUserAndHarvestData();
  }, [buyRequest?.farmerId, buyRequest?.wholesalerId, buyRequest?.harvestId]);

  const loadEscrowInfo = async () => {
    if (!buyRequest) return;
    
    try {
      setLoadingEscrow(true);
      const escrowData = await getBuyRequestEscrow(buyRequest.id);
      setEscrow(escrowData);
      
      // Load dispute if escrow exists
      if (escrowData) {
        loadDisputeInfo(escrowData.id);
      }
    } catch (error) {
      console.error('Error loading escrow:', error);
      // Escrow might not exist yet
    } finally {
      setLoadingEscrow(false);
    }
  };

  const loadDisputeInfo = async (escrowId: string) => {
    try {
      setLoadingDispute(true);
      const disputeData = await getDisputeByEscrowId(escrowId);
      setDispute(disputeData);
    } catch (error) {
      console.error('Error loading dispute:', error);
      setDispute(null);
    } finally {
      setLoadingDispute(false);
    }
  };

  const loadUserAndHarvestData = async () => {
    if (!buyRequest) return;
    
    try {
      setLoadingUserData(true);

      //console.log('=== LOADING USER AND HARVEST DATA ===');
      //console.log('Buy Request:', buyRequest);
      //console.log('Farmer ID:', buyRequest.farmerId);
      //console.log('Wholesaler ID:', buyRequest.wholesalerId);
      //console.log('Harvest ID:', buyRequest.harvestId);

      // Load farmer info
      if (buyRequest.farmerId) {
        //console.log('Fetching farmer info for:', buyRequest.farmerId);
        try {
          const farmer = await getUserByUsername(buyRequest.farmerId);
          //console.log('Farmer info received:', farmer);
          setFarmerInfo(farmer);
        } catch (err) {
          console.error('Error fetching farmer:', err);
        }
      }

      // Load wholesaler info
      if (buyRequest.wholesalerId) {
        //console.log('Fetching wholesaler info for:', buyRequest.wholesalerId);
        try {
          const wholesaler = await getUserByUsername(buyRequest.wholesalerId);
          //console.log('Wholesaler info received:', wholesaler);
          setWholesalerInfo(wholesaler);
        } catch (err) {
          console.error('Error fetching wholesaler:', err);
        }
      }

      // Load harvest and crop info
      if (buyRequest.harvestId) {
        //console.log('Fetching harvest info for:', buyRequest.harvestId);
        try {
          const harvest = await getHarvestById(buyRequest.harvestId);
          //console.log('Harvest info received:', harvest);
          setHarvestInfo(harvest);

          if (harvest && harvest.cropID) {
            // //console.log('Fetching crop info for:', harvest.cropID);
            const crop = await getCropById(harvest.cropID);
            // //console.log('Crop info received:', crop);
            setCropInfo(crop);
          }
        } catch (err) {
          // console.error('Error fetching harvest/crop:', err);
        }
      }
      
      // //console.log('=== LOADING COMPLETED ===');
    } catch (error) {
      // console.error('Error loading user and harvest data:', error);
    } finally {
      setLoadingUserData(false);
    }
  };

  const handlePaymentSuccess = () => {
    loadEscrowInfo();
  };

  const handleDisputeSuccess = () => {
    if (escrow) {
      loadDisputeInfo(escrow.id);
    }
  };

  const handleDisputeReviewSuccess = () => {
    if (escrow) {
      loadDisputeInfo(escrow.id);
    }
  };

  // Check if should show deposit button
  // EscrowStatus: 0=PendingPayment, 1=PartiallyFunded, 2=ReadyToHarvest, 3=FullyFunded, 4=Completed, 5=Disputed, 6=Refunded, 7=PartialRefund, 8=Canceled
  const shouldShowDepositButton = 
    buyRequest?.status === 'Accepted' && 
    escrow && 
    escrow.escrowStatus === 0; // PendingPayment

  // Check if should show pay remaining button
  const shouldShowPayRemainingButton =
    buyRequest?.status === 'Accepted' &&
    escrow &&
    escrow.escrowStatus === 2; // ReadyToHarvest
  
  // Calculate remaining amount (70%)
  const remainingAmount = escrow ? escrow.totalAmount - escrow.escrowAmount : 0;

  // Check if should show dispute button
  const shouldShowDisputeButton =
    buyRequest?.status === 'Accepted' &&
    escrow &&
    escrow.escrowStatus === 3 && // FullyFunded
    !dispute;
  
  // //console.log('=== BUTTON VISIBILITY DEBUG ===');
  // //console.log('Buy Request Status:', buyRequest?.status);
  // //console.log('Escrow Status:', escrow?.escrowStatus);
  // //console.log('Should Show Deposit Button:', shouldShowDepositButton);
  // //console.log('Should Show Pay Remaining Button:', shouldShowPayRemainingButton);
  // //console.log('Should Show Dispute Button:', shouldShowDisputeButton);
  // //console.log('Has Dispute:', !!dispute);
  // //console.log('==============================');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardRow}>
            <Text style={styles.statusCardLabel}>Trạng thái</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(buyRequest.status) },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {getStatusLabel(buyRequest.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Request Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Thông tin yêu cầu</Text>

          <View style={styles.infoCard}>
            {/* <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Tag size={18} color="#6B7280" />
              </View>
              {/* <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Mã yêu cầu</Text>
                <Text style={styles.infoValue}>{buyRequest.id}</Text>
              </View> */}
            {/* </View> */} 

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={18} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày cần thiết</Text>
                <Text style={styles.infoValue}>
                  {new Date(buyRequest.requiredDate).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <DollarSign size={18} color="#059669" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Giá dự kiến</Text>
                <Text style={styles.infoValuePrice}>
                  {buyRequest.expectedPrice.toLocaleString('vi-VN')} ₫
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Package size={18} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Loại mua</Text>
                <Text style={styles.infoValue}>
                  {buyRequest.isBuyingBulk ? 'Mua toàn bộ' : 'Mua theo loại'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={18} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày tạo</Text>
                <Text style={styles.infoValue}>
                  {new Date(buyRequest.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Farmer & Wholesaler Info Section - 2 Column Layout */}
        {(farmerInfo || wholesalerInfo || loadingUserData) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Thông tin các bên liên quan</Text>

            {loadingUserData && !farmerInfo && !wholesalerInfo ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#059669" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
              </View>
            ) : (
              <View style={styles.roleCardsContainer}>
                {/* Farmer Card - Left Column */}
                {farmerInfo && (
                  <View style={styles.roleCardColumn}>
                    <View style={styles.farmerCard}>
                      <View style={styles.simpleRoleHeader}>
                        <Text style={styles.simpleRoleText}>Nông Dân</Text>
                      </View>

                      <View style={[styles.infoCard, { borderWidth: 0 }]}>
                        <View style={styles.simpleInfoRow}>
                          <Text style={styles.simpleLabel}>Tên</Text>
                          <Text style={styles.simpleValue}>
                            {farmerInfo.firstName} {farmerInfo.lastName}
                          </Text>
                        </View>
                      
                        

                        {farmerInfo.address && (
                          <View style={styles.simpleInfoRow}>
                            <Text style={styles.simpleLabel}>Địa chỉ</Text>
                            <Text style={styles.simpleValue}>{farmerInfo.address}</Text>
                          </View>
                        )}

                        {farmerInfo.reputationScore !== undefined && (
                          <View style={styles.simpleInfoRow}>
                            <Text style={styles.simpleLabel}>Uy tín</Text>
                            <Text style={styles.simpleValue}>{farmerInfo.reputationScore}/100</Text>
                          </View>
                        )}

                        
                      </View>
                    </View>
                  </View>
                )}

                {/* Wholesaler Card - Right Column */}
                {wholesalerInfo && (
                  <View style={styles.roleCardColumn}>
                    <View style={styles.wholesalerCard}>
                      <View style={styles.simpleRoleHeader}>
                        <Text style={styles.simpleRoleText}>Nhà Buôn</Text>
                      </View>

                      <View style={[styles.infoCard, { borderWidth: 0 }]}>
                        <View style={styles.simpleInfoRow}>
                          <Text style={styles.simpleLabel}>Tên</Text>
                          <Text style={styles.simpleValue}>
                            {wholesalerInfo.firstName} {wholesalerInfo.lastName}
                          </Text>
                        </View>
                       

                        {wholesalerInfo.address && (
                          <View style={styles.simpleInfoRow}>
                            <Text style={styles.simpleLabel}>Địa chỉ</Text>
                            <Text style={styles.simpleValue}>{wholesalerInfo.address}</Text>
                          </View>
                        )}

                        {wholesalerInfo.reputationScore !== undefined && (
                          <View style={styles.simpleInfoRow}>
                            <Text style={styles.simpleLabel}>Uy tín</Text>
                            <Text style={styles.simpleValue}>{wholesalerInfo.reputationScore}/100</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Harvest & Crop Info Section */}
        {(harvestInfo || cropInfo || loadingUserData) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Thông tin thu hoạch</Text>

            <View style={styles.infoCard}>
              {/* Crop Info */}
              {cropInfo && (
                <>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Package size={18} color="#6B7280" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Tên vườn</Text>
                      <Text style={styles.infoValue}>{cropInfo.name}</Text>
                      {cropInfo.custardAppleType && (
                        <Text style={styles.infoSubtext}>Loại: {cropInfo.custardAppleType}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Package size={18} color="#6B7280" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Khu vực canh tác</Text>
                      <Text style={styles.infoValue}>
                        {cropInfo.address && cropInfo.district && cropInfo.province
                          ? `${cropInfo.district}, ${cropInfo.province}`
                          : 'Không xác định'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {/* Harvest Info */}
              {harvestInfo && (
                <>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Calendar size={18} color="#6B7280" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Ngày bắt đầu thu hoạch</Text>
                      <Text style={styles.infoValue}>
                        {new Date(harvestInfo.startDate).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.divider} />

                  {/* <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Package size={18} color="#6B7280" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Số lượng</Text>
                      <Text style={styles.infoValue}>
                        {harvestInfo.totalQuantity} {harvestInfo.unit}
                      </Text>
                    </View>
                  </View> */}
                  <View style={styles.divider} />

                  {/* <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <DollarSign size={18} color="#059669" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Giá bán</Text>
                      <Text style={styles.infoValuePrice}>
                        {harvestInfo.salePrice.toLocaleString('vi-VN')} ₫/{harvestInfo.unit}
                      </Text>
                    </View>
                  </View> */}

                  {harvestInfo.note && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                          <Package size={18} color="#6B7280" />
                        </View>
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Ghi chú thông tin thu hoạch</Text>
                          <Text style={styles.infoValue}>{harvestInfo.note}</Text>
                        </View>
                      </View>
                    </>
                  )}
                </>
              )}

              {loadingUserData && (
                <View style={styles.infoRow}>
                  <ActivityIndicator size="small" color="#059669" />
                  <Text style={styles.infoLabel}>Đang tải thông tin...</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Message Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Ghi chú yêu cầu</Text>
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{buyRequest.message}</Text>
          </View>
        </View>

        {/* Details Section */}
        {buyRequest.details && buyRequest.details.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Chi tiết loại hàng ({buyRequest.details.length})
            </Text>

            {buyRequest.details.map((detail: any, index: number) => (
              <View key={detail.id || index} style={styles.detailCard}>
                <View style={styles.detailCardHeader}>
                  <Text style={styles.detailCardTitle}>Hạng {detail.grade}</Text>
                  <Text style={styles.detailCardBadge}>{detail.unit}</Text>
                </View>

                <View style={styles.detailCardContent}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Số lượng:</Text>
                    <Text style={styles.detailValue}>
                      {detail.quantity} {detail.unit}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Giá:</Text>
                    <Text style={styles.detailValuePrice}>
                      {detail.price.toLocaleString('vi-VN')} VND
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Độ lệch cho phép:</Text>
                    <Text style={styles.detailValue}>
                      ±{detail.allowedDeviationPercent}%
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tổng giá trị:</Text>
                    <Text style={styles.detailValuePrice}>
                      {(detail.quantity * detail.price).toLocaleString('vi-VN')} VND
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Tóm tắt</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tổng số lượng:</Text>
                <Text style={styles.summaryValue}>
                  {buyRequest.details.reduce((sum: number, d: any) => sum + d.quantity, 0)} kg
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tổng giá trị:</Text>
                <Text style={styles.summaryValuePrice}>
                  {buyRequest.details
                    .reduce((sum: number, d: any) => sum + d.quantity * d.price, 0)
                    .toLocaleString('vi-VN')} VND
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Dispute Section */}
        {escrow && dispute && (
          <View style={styles.section}>
            <DisputeInfoCard 
              dispute={dispute}
              showReviewButton={
                dispute.disputeStatus === 0 && 
                dispute.isWholeSalerCreated === false
              }
              onReview={() => setShowReviewModal(true)}
            />
          </View>
        )}

        {/* Escrow Section - Only show when Accepted */}
        {buyRequest.status === 'Accepted' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Thông tin ký quỹ</Text>
            
            {loadingEscrow ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#059669" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
              </View>
            ) : escrow ? (
              <View style={styles.escrowCard}>
                <View style={styles.escrowRow}>
                  <Text style={styles.escrowLabel}>Trạng thái:</Text>
                  <View
                    style={[
                      styles.escrowStatusBadge,
                      { backgroundColor: getEscrowStatusColor(escrow.escrowStatus) },
                    ]}
                  >
                    <Text style={styles.escrowStatusText}>
                      {getEscrowStatusLabel(escrow.escrowStatus)}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.escrowRow}>
                  <Text style={styles.escrowLabel}>Tổng giá trị:</Text>
                  <Text style={styles.escrowValue}>
                    {escrow.totalAmount.toLocaleString('vi-VN')} VND
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.escrowRow}>
                  <Text style={styles.escrowLabel}>Tiền cọc (30%):</Text>
                  <Text style={styles.escrowValueHighlight}>
                    {escrow.escrowAmount.toLocaleString('vi-VN')} VND
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.escrowRow}>
                  <Text style={styles.escrowLabel}>Phí dịch vụ:</Text>
                  <Text style={styles.escrowValue}>
                    {escrow.feeAmount.toLocaleString('vi-VN')} VND
                  </Text>
                </View>

                {escrow.paymentAt && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.escrowRow}>
                      <Text style={styles.escrowLabel}>Ngày thanh toán:</Text>
                      <Text style={styles.escrowValue}>
                        {new Date(escrow.paymentAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.messageCard}>
                <Text style={styles.messageText}>
                  Thông tin ký quỹ chưa được tạo
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Deposit Payment Button - Fixed at bottom */}
      {shouldShowDepositButton && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.depositButton}
            onPress={() => setShowDepositModal(true)}
          >
           
            <Text style={styles.depositButtonText}>
              Thanh toán cọc {escrow!.escrowAmount.toLocaleString('vi-VN')} VND
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pay Remaining Button - Fixed at bottom */}
      {shouldShowPayRemainingButton && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.payRemainingButton}
            onPress={() => setShowPayRemainingModal(true)}
          >
            {/* <DollarSign size={20} color="#FFFFFF" /> */}
            <Text style={styles.payRemainingButtonText}>
              Thanh toán phần còn lại {remainingAmount.toLocaleString('vi-VN')} VND
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dispute Button - Fixed at bottom */}
      {shouldShowDisputeButton && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.disputeButton}
            onPress={() => setShowDisputeModal(true)}
          >
            <AlertCircle size={20} color="#FFFFFF" />
            <Text style={styles.disputeButtonText}>
              Tạo yêu cầu tranh chấp
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Deposit Payment Modal */}
      {escrow && (
        <BuyRequestDepositModal
          visible={showDepositModal}
          escrowId={escrow.id}
          depositAmount={escrow.escrowAmount}
          onClose={() => setShowDepositModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Pay Remaining Modal */}
      {escrow && (
        <BuyRequestPayRemainingModal
          visible={showPayRemainingModal}
          escrowId={escrow.id}
          remainingAmount={remainingAmount}
          onClose={() => setShowPayRemainingModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Dispute Modal */}
      {escrow && (
        <CreateDisputeModal
          visible={showDisputeModal}
          escrowId={escrow.id}
          totalAmount={escrow.totalAmount}
          isWholeSalerCreating={true}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={handleDisputeSuccess}
        />
      )}

      {/* Review Dispute Modal */}
      {dispute && (
        <ReviewDisputeModal
          visible={showReviewModal}
          disputeId={dispute.id}
          onClose={() => setShowReviewModal(false)}
          onSuccess={handleDisputeReviewSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  // Status section - modern badge style
  statusCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  statusCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  
  // Info Card - cleaner design
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '400',
    marginTop: 3,
  },
  infoValuePrice: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },
  
  // Farmer & Wholesaler Role Cards
  farmerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    overflow: 'hidden' as const,
  },
  wholesalerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    overflow: 'hidden' as const,
  },
  roleHeader: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  farmerRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
  },
  farmerRoleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  wholesalerRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  wholesalerRoleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  
  roleCardsContainer: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  roleCardColumn: {
    flex: 1,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 12,
  },
  
  simpleRoleHeader: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  simpleRoleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  simpleInfoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minHeight: 56,
  },
  simpleLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    minWidth:25,
  },
  simpleValue: {
    fontSize: 10,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
  },
  
  messageCard: {
    backgroundColor: '#F9F9F9',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  messageText: {
    fontSize: 13,
    color: '#555555',
    fontWeight: '500',
    lineHeight: 19,
  },
  
  // Detail cards for grades
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  detailCardBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
    backgroundColor: '#EFEFEF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  detailCardContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  detailValuePrice: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
  },
  
  // Summary card - highlighted
  summaryCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 14,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  summaryValuePrice: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '800',
  },
  
  // Escrow card - improved styling
  escrowCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  escrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  escrowLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  escrowValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  escrowValueHighlight: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },
  escrowStatusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 7,
  },
  escrowStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Bottom action buttons - modern sticky footer
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  depositButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
  },
  depositButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  payRemainingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
  },
  payRemainingButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  disputeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
  },
  disputeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
