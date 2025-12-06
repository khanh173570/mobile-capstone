import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronRight, Package, AlertCircle } from 'lucide-react-native';
import {
  getFarmerBuyRequests,
  FarmerBuyRequest,
  BuyRequestListResponse,
} from '../../../../services/farmerBuyRequestManagementService';

export default function BuyRequestManagementScreen() {
  const router = useRouter();
  const [buyRequests, setBuyRequests] = useState<FarmerBuyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      loadBuyRequests();
    }, [])
  );

  const loadBuyRequests = async () => {
    try {
      setLoading(true);
      const data = await getFarmerBuyRequests(pageNumber, 10);
      setBuyRequests(data.items);
      setHasNextPage(data.nextPage);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Error loading buy requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setPageNumber(1);
      const data = await getFarmerBuyRequests(1, 10);
      setBuyRequests(data.items);
      setHasNextPage(data.nextPage);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (hasNextPage) {
      try {
        const nextPage = pageNumber + 1;
        const data = await getFarmerBuyRequests(nextPage, 10);
        setBuyRequests([...buyRequests, ...data.items]);
        setPageNumber(nextPage);
        setHasNextPage(data.nextPage);
      } catch (error) {
        console.error('Error loading more:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return '#F59E0B'; // Amber
      case 'Accepted':
        return '#10B981'; // Green
      case 'Rejected':
        return '#EF4444'; // Red
      case 'Completed':
        return '#06B6D4'; // Cyan
      case 'Cancelled':
        return '#6B7280'; // Gray
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

  const handleViewDetail = (buyRequestId: string) => {
    // @ts-ignore
    router.push(`/farmer/buy-request-management/${buyRequestId}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {buyRequests.length === 0 ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.emptyContainer}>
          <Package size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Chưa có yêu cầu mua hàng nào</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={buyRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.requestCard}
              onPress={() => handleViewDetail(item.id)}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitle}>
                    <Text style={styles.requestId}>
                      {item.harvestId.substring(0, 8).toUpperCase()}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Giá dự tính:</Text>
                    <Text style={styles.detailValue}>
                      {item.expectedPrice.toLocaleString('vi-VN')} đ
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Số lượng:</Text>
                    <Text style={styles.detailValue}>
                      {item.totalQuantity} {item.totalQuantity > 0 ? 'kg' : '-'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ngày cần:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(item.requiredDate).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>

                  <View style={styles.messageRow}>
                    <Text style={styles.detailLabel}>Ghi chú:</Text>
                    <Text style={styles.messageText} numberOfLines={2}>
                      {item.message}
                    </Text>
                  </View>

                  {item.isBuyingBulk && (
                    <View style={styles.bulkBadge}>
                      <Text style={styles.bulkText}>Mua hàng loạt</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
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
  content: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    paddingTop: 90,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  messageRow: {
    marginTop: 4,
  },
  messageText: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  bulkBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  bulkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
});
