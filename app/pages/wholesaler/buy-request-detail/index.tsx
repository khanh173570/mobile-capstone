import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { getBuyRequestDetail, getCustardAppleTypes } from '../../../../services/buyRequestService';

export default function BuyRequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [buyRequest, setBuyRequest] = useState<any>(null);
  const [custardAppleTypes, setCustardAppleTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [detail, types] = await Promise.all([
        getBuyRequestDetail(id as string),
        getCustardAppleTypes(),
      ]);
      setBuyRequest(detail);
      setCustardAppleTypes(types);
    } catch (error) {
      console.error('Error loading buy request detail:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết yêu cầu');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getProductTypeName = (productTypeId: string) => {
    const type = custardAppleTypes.find(t => t.id === productTypeId);
    return type?.name || 'Chưa xác định';
  };

  const getProductTypeDescription = (productTypeId: string) => {
    const type = custardAppleTypes.find(t => t.id === productTypeId);
    return type?.description || '';
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
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'Chờ xử lý';
      case 'Accepted':
        return 'Đã chấp nhận';
      case 'Rejected':
        return 'Bị từ chối';
      case 'Completed':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết yêu cầu mua</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      </View>
    );
  }

  if (!buyRequest) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết yêu cầu mua</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy yêu cầu</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết yêu cầu mua</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.cardTitle}>{buyRequest.title}</Text>
              <Text style={styles.productName}>
                {getProductTypeName(buyRequest.productTypeId)}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(buyRequest.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(buyRequest.status)}</Text>
            </View>
          </View>
        </View>

        {/* Product Type Description */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin sản phẩm</Text>
          <Text style={styles.sectionContent}>
            {getProductTypeDescription(buyRequest.productTypeId)}
          </Text>
        </View>

        {/* Quantity and Price */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Yêu cầu</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Số lượng cần</Text>
              <Text style={styles.infoValue}>
                {buyRequest.requiredQuantity ? buyRequest.requiredQuantity.toLocaleString('vi-VN') : '0'} kg
              </Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Giá mong muốn</Text>
              <Text style={styles.infoValue}>
                {buyRequest.desiredPrice ? buyRequest.desiredPrice.toLocaleString('vi-VN') : '0'}₫
              </Text>
            </View>
          </View>
        </View>

        {/* Date and Location */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thời gian và địa điểm</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Ngày cần thiết</Text>
              <Text style={styles.infoValue}>
                {new Date(buyRequest.requiredDate).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Vị trí</Text>
              <Text style={styles.infoValue}>{buyRequest.location}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {buyRequest.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <Text style={styles.sectionContent}>{buyRequest.notes}</Text>
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.card}>
          <View style={styles.additionalInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ngày tạo</Text>
              <Text style={styles.infoValue}>
                {new Date(buyRequest.createdAt).toLocaleString('vi-VN')}
              </Text>
            </View>
            {/* <View style={[styles.infoItem, { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 }]}>
              <Text style={styles.infoLabel}>ID yêu cầu</Text>
              <Text style={[styles.infoValue, { fontSize: 12, fontFamily: 'monospace' }]}>
                {buyRequest.id}
              </Text>
            </View> */}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 12 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  additionalInfo: {
    gap: 12,
  },
  infoItem: {
    paddingBottom: 12,
  },
});
