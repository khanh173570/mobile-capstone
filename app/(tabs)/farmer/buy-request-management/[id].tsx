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
import { ArrowLeft, Check, X, AlertCircle, User } from 'lucide-react-native';
import Header from '../../../../components/shared/Header';
import {
  getBuyRequestById,
  updateBuyRequestStatus,
  getWholesalerInfo,
  FarmerBuyRequest,
  WholesalerInfo,
} from '../../../../services/farmerBuyRequestManagementService';

export default function BuyRequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [buyRequest, setBuyRequest] = useState<FarmerBuyRequest | null>(null);
  const [wholesaler, setWholesaler] = useState<WholesalerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    action: 'accept' | 'reject' | null;
  }>({ visible: false, action: null });

  useEffect(() => {
    loadBuyRequest();
  }, [id]);

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
      }
    } catch (error) {
      console.error('Error loading buy request:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết yêu cầu mua hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'Accepted' | 'Rejected') => {
    if (!buyRequest) return;

    try {
      setUpdating(true);
      await updateBuyRequestStatus(buyRequest.id, status);
      Alert.alert(
        'Thành công',
        status === 'Accepted'
          ? 'Đã duyệt yêu cầu mua hàng'
          : 'Đã từ chối yêu cầu mua hàng',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
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
        {/* Wholesaler Information */}
        {wholesaler && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.wholesalerTitleRow}>
                <User size={16} color="#10B981" />
                <Text style={styles.cardTitle}>Thông Tin Người Mua</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Họ tên:</Text>
              <Text style={styles.value}>
                {wholesaler.lastName} {wholesaler.firstName}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Số điện thoại:</Text>
              <Text style={styles.value}>{wholesaler.phoneNumber}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{wholesaler.email}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Địa chỉ:</Text>
              <Text style={styles.value}>{wholesaler.address}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Khu vực:</Text>
              <Text style={styles.value}>
                {wholesaler.communes}, {wholesaler.province}
              </Text>
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
            <Text style={styles.label}>Số lượng dự kiến:</Text>
            <Text style={styles.value}>
              {buyRequest.totalQuantity} {buyRequest.totalQuantity > 0 ? 'kg' : '-'}
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
                : 'Xác Nhận Từ Chối?'}
            </Text>

            <Text style={styles.confirmMessage}>
              {confirmModal.action === 'accept'
                ? 'Bạn có chắc chắn muốn duyệt yêu cầu mua hàng này không?'
                : 'Bạn có chắc chắn muốn từ chối yêu cầu mua hàng này không?'}
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.cancelConfirmButton}
                onPress={() => setConfirmModal({ visible: false, action: null })}
                disabled={updating}
              >
                <Text style={styles.cancelConfirmText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor:
                      confirmModal.action === 'accept' ? '#10B981' : '#EF4444',
                  },
                ]}
                onPress={() => {
                  if (confirmModal.action === 'accept' || confirmModal.action === 'reject') {
                    const status = confirmModal.action === 'accept' ? 'Accepted' : 'Rejected';
                    handleUpdateStatus(status);
                  }
                }}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {confirmModal.action === 'accept' ? 'Duyệt' : 'Từ Chối'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
});
