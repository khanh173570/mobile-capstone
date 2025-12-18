import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, X, AlertCircle, User, AlertTriangle } from 'lucide-react-native';
import Header from '../../../../components/shared/Header';
import {
  getBuyRequestById,
  updateBuyRequestStatus,
  getWholesalerInfo,
  FarmerBuyRequest,
  WholesalerInfo,
  getBuyRequestEscrowForFarmer,
  setFarmerBuyRequestReadyToHarvest,
  BuyRequestEscrow,
} from '../../../../services/farmerBuyRequestManagementService';
import { DisputeInfoCard } from '../../../../components/shared/DisputeInfoCard';
import { ReviewDisputeModal } from '../../../../components/shared/ReviewDisputeModal';
import { CreateDisputeModal } from '../../../../components/shared/CreateDisputeModal';
import { Dispute, getDisputeByEscrowId } from '../../../../services/disputeService';
import { getCurrentUser, User as UserType } from '../../../../services/authService';

export default function BuyRequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [buyRequest, setBuyRequest] = useState<FarmerBuyRequest | null>(null);
  const [farmerInfo, setFarmerInfo] = useState<UserType | null>(null);
  const [wholesaler, setWholesaler] = useState<WholesalerInfo | null>(null);
  const [escrow, setEscrow] = useState<BuyRequestEscrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEscrow, setLoadingEscrow] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [settingReady, setSettingReady] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    action: 'accept' | 'reject' | 'ready' | null;
  }>({ visible: false, action: null });
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loadingDispute, setLoadingDispute] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCreateDisputeModal, setShowCreateDisputeModal] = useState(false);

  useEffect(() => {
    loadBuyRequest();
    loadFarmerInfo();
  }, [id]);

  const loadFarmerInfo = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setFarmerInfo(user);
      }
    } catch (error) {
      console.error('Error loading farmer info:', error);
    }
  };

  const loadBuyRequest = async () => {
    try {
      setLoading(true);
      if (typeof id === 'string') {
        const data = await getBuyRequestById(id);
        setBuyRequest(data);
        
        // Load wholesaler info
        if (data.wholesalerId) {
          try {
            const wholesalerData = await getWholesalerInfo(data.wholesalerId);
            setWholesaler(wholesalerData);
          } catch (error) {
            console.error('Error loading wholesaler info:', error);
          }
        }

        // Load escrow info if accepted
        if (data.status === 'Accepted') {
          loadEscrowInfo(data.id);
        }
      }
    } catch (error) {
      console.error('Error loading buy request:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết yêu cầu mua hàng');
    } finally {
      setLoading(false);
    }
  };

  const loadEscrowInfo = async (buyRequestId: string) => {
    try {
      setLoadingEscrow(true);
      const escrowData = await getBuyRequestEscrowForFarmer(buyRequestId);
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

  const handleUpdateStatus = async (status: 'Accepted' | 'Rejected') => {
    if (!buyRequest) return;

    try {
      setUpdating(true);
      await updateBuyRequestStatus(buyRequest.id, status);
      
      if (status === 'Accepted') {
        // Reload to get escrow info
        await loadBuyRequest();
      }
      
      Alert.alert(
        'Thành công',
        status === 'Accepted'
          ? 'Đã duyệt yêu cầu mua hàng. Chờ thương lái thanh toán cọc.'
          : 'Đã từ chối yêu cầu mua hàng',
        [
          {
            text: 'OK',
            onPress: () => {
              if (status === 'Rejected') {
                router.back();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
      setConfirmModal({ visible: false, action: null });
    }
  };

  const handleSetReadyToHarvest = async () => {
    if (!escrow) return;

    try {
      setSettingReady(true);
      await setFarmerBuyRequestReadyToHarvest(escrow.id);
      
      // Reload escrow info
      if (buyRequest) {
        await loadEscrowInfo(buyRequest.id);
      }
      
      Alert.alert(
        'Thành công',
        'Đã xác nhận sẵn sàng thu hoạch. Thương lái có thể thanh toán phần còn lại.',
        [
          {
            text: 'OK',
          },
        ]
      );
    } catch (error) {
      console.error('Error setting ready to harvest:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái sẵn sàng');
    } finally {
      setSettingReady(false);
      setConfirmModal({ visible: false, action: null });
    }
  };

  const handleDisputeReviewSuccess = () => {
    if (escrow) {
      loadDisputeInfo(escrow.id);
    }
  };

  const handleDisputeCreateSuccess = () => {
    if (escrow) {
      loadDisputeInfo(escrow.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return '#F59E0B';
      case 'Accepted':
        return '#10B981';
      case 'Rejected':
        return '#EF4444';
      case 'Completed':
        return '#06B6D4';
      case 'Cancelled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'Chờ duyệt';
      case 'Accepted':
        return 'Đã duyệt';
      case 'Rejected':
        return 'Bị từ chối';
      case 'Completed':
        return 'Hoàn thành';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getEscrowStatusLabel = (status: number | string) => {
    // Convert to number if string
    const numStatus = typeof status === 'string' ? parseInt(status) : status;
    
    switch (numStatus) {
      case 0:
        return 'Chờ thanh toán cọc';
      case 1:
        return 'Đã đặt cọc';
      case 2:
        return 'Sẵn sàng thu hoạch';
      case 3:
        return 'Đã thanh toán đủ';
      case 4:
        return 'Hoàn thành';
      case 5:
        return 'Đang tranh chấp';
      case 6:
        return 'Đã hoàn tiền';
      case 7:
        return 'Hoàn tiền một phần';
      case 8:
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  const getEscrowStatusColor = (status: number | string) => {
    const numStatus = typeof status === 'string' ? parseInt(status) : status;
    
    switch (numStatus) {
      case 0:
        return '#F59E0B';
      case 1:
        return '#3B82F6';
      case 2:
        return '#06B6D4';
      case 3:
        return '#10B981';
      case 4:
        return '#10B981';
      case 5:
        return '#EF4444';
      case 6:
        return '#6B7280';
      case 7:
        return '#F97316';
      case 8:
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getGradeLabel = (grade: number) => {
    switch (grade) {
      case 1:
        return 'Grade 1 (Cao)';
      case 2:
        return 'Grade 2 (Trung)';
      case 3:
        return 'Grade 3 (Thấp)';
      default:
        return `Grade ${grade}`;
    }
  };

  if (loading || !buyRequest) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi Tiết Yêu Cầu</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  const canUpdateStatus = buyRequest.status === 'Pending';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi Tiết Yêu Cầu</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Farmer & Wholesaler Info Section - 2 Column Layout */}
        {(farmerInfo || wholesaler) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin các bên liên quan</Text>

            <View style={styles.roleCardsContainer}>
              {/* Farmer Card - Left Column (Current User) */}
              {farmerInfo && (
                <View style={styles.roleCardColumn}>
                  <View style={styles.farmerCard}>
                    <View style={styles.simpleRoleHeader}>
                      <Text style={styles.simpleRoleText}>Nông Dân (Bạn)</Text>
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
                    </View>
                  </View>
                </View>
              )}

              {/* Wholesaler Card - Right Column */}
              {wholesaler && (
                <View style={styles.roleCardColumn}>
                  <View style={styles.wholesalerCard}>
                    <View style={styles.simpleRoleHeader}>
                      <Text style={styles.simpleRoleText}>Thương lái </Text>
                    </View>

                    <View style={[styles.infoCard, { borderWidth: 0 }]}>
                      <View style={styles.simpleInfoRow}>
                        <Text style={styles.simpleLabel}>Tên</Text>
                        <Text style={styles.simpleValue}>
                          {wholesaler.lastName} {wholesaler.firstName}
                        </Text>
                      </View>

                     



                      {wholesaler.address && (
                        <View style={styles.simpleInfoRow}>
                          <Text style={styles.simpleLabel}>Địa chỉ</Text>
                          <Text style={styles.simpleValue}>{wholesaler.address}</Text>
                        </View>
                      )}

                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Main Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Thông Tin Chính</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(buyRequest.status) },
              ]}
            >
              <Text style={styles.statusText}>{getStatusLabel(buyRequest.status)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Giá dự tính:</Text>
            <Text style={styles.value}>
              {buyRequest.expectedPrice.toLocaleString('vi-VN')} đ
            </Text>
          </View>

          <View style={styles.divider} />


         

          <View style={styles.infoRow}>
            <Text style={styles.label}>Ngày cần hàng:</Text>
            <Text style={styles.value}>
              {new Date(buyRequest.requiredDate).toLocaleDateString('vi-VN')}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Loại mua:</Text>
            <Text style={styles.value}>
              {buyRequest.isBuyingBulk ? 'Mua hàng loạt' : 'Mua lẻ'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.messageSection}>
            <Text style={styles.label}>Ghi chú từ người mua:</Text>
            <Text style={styles.messageText}>{buyRequest.message}</Text>
          </View>
        </View>

        {/* Grade Details */}
        {buyRequest.details && buyRequest.details.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chi Tiết Phân Loại</Text>

            {buyRequest.details.map((detail, index) => (
              <View key={detail.id}>
                <View style={styles.detailCard}>
                  <View style={styles.gradeHeader}>
                    <Text style={styles.gradeLabel}>{getGradeLabel(detail.grade)}</Text>
                    <View style={styles.quantityBadge}>
                      <Text style={styles.quantityText}>{detail.quantity} kg</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Giá:</Text>
                    <Text style={styles.detailValue}>
                      {detail.price.toLocaleString('vi-VN')} đ
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Dung sai:</Text>
                    <Text style={styles.detailValue}>{detail.allowedDeviationPercent}%</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Đơn vị:</Text>
                    <Text style={styles.detailValue}>{detail.unit}</Text>
                  </View>
                </View>

                {index < buyRequest.details.length - 1 && (
                  <View style={styles.detailDivider} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Dispute Section */}
        {escrow && dispute && (
          <View style={styles.card}>
            <DisputeInfoCard 
              dispute={dispute}
              showReviewButton={
                dispute.disputeStatus === 0 && 
                dispute.isWholeSalerCreated === true
              }
              onReview={() => setShowReviewModal(true)}
            />
          </View>
        )}

        {/* Escrow Section - Only show when Accepted */}
        {buyRequest.status === 'Accepted' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông Tin Ký Quỹ</Text>
            
            {loadingEscrow ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={styles.loadingCardText}>Đang tải...</Text>
              </View>
            ) : escrow ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Trạng thái:</Text>
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

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Tổng giá trị:</Text>
                  <Text style={styles.valueHighlight}>
                    {escrow.totalAmount.toLocaleString('vi-VN')} VND
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Tiền cọc (30%):</Text>
                  <Text style={styles.value}>
                    {escrow.escrowAmount.toLocaleString('vi-VN')} VND
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Bạn sẽ nhận:</Text>
                  <Text style={styles.valueHighlight}>
                    {escrow.sellerReceiveAmount.toLocaleString('vi-VN')} VND
                  </Text>
                </View>

                {escrow.paymentAt && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Ngày thanh toán cọc:</Text>
                      <Text style={styles.value}>
                        {new Date(escrow.paymentAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>
                Chờ thương lái thanh toán cọc
              </Text>
            )}
          </View>
        )}

        {/* Metadata */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông Tin Bổ Sung</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Ngày tạo:</Text>
            <Text style={styles.value}>
              {new Date(buyRequest.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Lần cập nhật cuối:</Text>
            <Text style={styles.value}>
              {buyRequest.updatedAt
                ? new Date(buyRequest.updatedAt).toLocaleDateString('vi-VN')
                : 'Chưa cập nhật'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {canUpdateStatus && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => setConfirmModal({ visible: true, action: 'accept' })}
              disabled={updating}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Duyệt Yêu Cầu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => setConfirmModal({ visible: true, action: 'reject' })}
              disabled={updating}
            >
              <X size={20} color="#FFFFFF" />
              <Text style={styles.rejectButtonText}>Từ Chối</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ready to Harvest Button - Show when escrow is PartiallyFunded (status = 1) */}
        {escrow && parseInt(escrow.escrowStatus) === 1 && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.readyButton}
              onPress={() => setConfirmModal({ visible: true, action: 'ready' })}
              disabled={settingReady}
            >
              {settingReady ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={20} color="#FFFFFF" />
                  <Text style={styles.readyButtonText}>Sẵn Sàng Thu Hoạch</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Create Dispute Button - Show when escrow is FullyFunded (status = 3) and no dispute exists */}
        {escrow && parseInt(escrow.escrowStatus) === 3 && !dispute && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.disputeButton}
              onPress={() => setShowCreateDisputeModal(true)}
            >
              <AlertTriangle size={20} color="#FFFFFF" />
              <Text style={styles.disputeButtonText}>Tạo Yêu Cầu Tranh Chấp</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal({ visible: false, action: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmHeader}>
              <AlertCircle
                size={28}
                color={confirmModal.action === 'accept' ? '#10B981' : '#EF4444'}
              />
            </View>

            <Text style={styles.confirmTitle}>
              {confirmModal.action === 'accept'
                ? 'Xác Nhận Duyệt?'
                : confirmModal.action === 'ready'
                ? 'Xác Nhận Sẵn Sàng?'
                : 'Xác Nhận Từ Chối?'}
            </Text>

            <Text style={styles.confirmMessage}>
              {confirmModal.action === 'accept'
                ? 'Bạn có chắc chắn muốn duyệt yêu cầu mua hàng này không?'
                : confirmModal.action === 'ready'
                ? 'Xác nhận rằng hàng đã sẵn sàng để thu hoạch. Thương lái sẽ có thể thanh toán phần còn lại.'
                : 'Bạn có chắc chắn muốn từ chối yêu cầu mua hàng này không?'}
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.cancelConfirmButton}
                onPress={() => setConfirmModal({ visible: false, action: null })}
                disabled={updating || settingReady}
              >
                <Text style={styles.cancelConfirmText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor:
                      confirmModal.action === 'accept' || confirmModal.action === 'ready' 
                        ? '#10B981' 
                        : '#EF4444',
                  },
                ]}
                onPress={() => {
                  if (confirmModal.action === 'accept' || confirmModal.action === 'reject') {
                    const status = confirmModal.action === 'accept' ? 'Accepted' : 'Rejected';
                    handleUpdateStatus(status);
                  } else if (confirmModal.action === 'ready') {
                    handleSetReadyToHarvest();
                  }
                }}
                disabled={updating || settingReady}
              >
                {(updating || settingReady) ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {confirmModal.action === 'accept' 
                      ? 'Duyệt' 
                      : confirmModal.action === 'ready'
                      ? 'Xác Nhận'
                      : 'Từ Chối'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Dispute Modal */}
      {dispute && (
        <ReviewDisputeModal
          visible={showReviewModal}
          disputeId={dispute.id}
          onClose={() => setShowReviewModal(false)}
          onSuccess={handleDisputeReviewSuccess}
        />
      )}

      {/* Create Dispute Modal */}
      {escrow && (
        <CreateDisputeModal
          visible={showCreateDisputeModal}
          escrowId={escrow.id}
          totalAmount={escrow.totalAmount}
          isWholeSalerCreating={false}
          onClose={() => setShowCreateDisputeModal(false)}
          onSuccess={handleDisputeCreateSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  backButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 24,
    marginTop: 15,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  wholesalerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  messageSection: {
    marginTop: 4,
  },
  messageText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 8,
    lineHeight: 18,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  detailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gradeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  quantityBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  confirmModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    maxWidth: 320,
  },
  confirmHeader: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelConfirmButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelConfirmText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingCard: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingCardText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  escrowStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  escrowStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // 2-Column Layout Styles
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  roleCardsContainer: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  roleCardColumn: {
    flex: 1,
  },
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
  infoCard: {
    borderWidth: 0,
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
    minWidth: 32,
  },
  simpleValue: {
    fontSize: 10,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  valueHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  readyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  readyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disputeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  disputeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
