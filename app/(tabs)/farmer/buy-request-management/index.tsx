import React, { useState, useEffect, useMemo } from 'react';
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
import { ChevronRight, Package, AlertCircle, Filter } from 'lucide-react-native';
import {
  getFarmerBuyRequests,
  FarmerBuyRequest,
  BuyRequestListResponse,
  getWholesalerInfo,
  WholesalerInfo,
} from '../../../../services/farmerBuyRequestManagementService';

export default function BuyRequestManagementScreen() {
  const router = useRouter();
  const [buyRequests, setBuyRequests] = useState<FarmerBuyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [wholesalerInfoMap, setWholesalerInfoMap] = useState<Record<string, WholesalerInfo>>({});

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
      
      // Load wholesaler info for each buy request
      const wholesalerMap: Record<string, WholesalerInfo> = {};
      await Promise.all(
        data.items.map(async (request) => {
          if (request.wholesalerId) {
            try {
              const wholesalerInfo = await getWholesalerInfo(request.wholesalerId);
              wholesalerMap[request.id] = wholesalerInfo;
            } catch (error) {
              console.error(`Error loading wholesaler info for ${request.id}:`, error);
            }
          }
        })
      );
      setWholesalerInfoMap(wholesalerMap);
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
      
      // Load wholesaler info for each buy request
      const wholesalerMap: Record<string, WholesalerInfo> = {};
      await Promise.all(
        data.items.map(async (request) => {
          if (request.wholesalerId) {
            try {
              const wholesalerInfo = await getWholesalerInfo(request.wholesalerId);
              wholesalerMap[request.id] = wholesalerInfo;
            } catch (error) {
              console.error(`Error loading wholesaler info for ${request.id}:`, error);
            }
          }
        })
      );
      setWholesalerInfoMap(wholesalerMap);
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
        
        // Load wholesaler info for new items
        const newWholesalerMap: Record<string, WholesalerInfo> = { ...wholesalerInfoMap };
        await Promise.all(
          data.items.map(async (request) => {
            if (request.wholesalerId) {
              try {
                const wholesalerInfo = await getWholesalerInfo(request.wholesalerId);
                newWholesalerMap[request.id] = wholesalerInfo;
              } catch (error) {
                console.error(`Error loading wholesaler info for ${request.id}:`, error);
              }
            }
          })
        );
        setWholesalerInfoMap(newWholesalerMap);
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

  // Filter buy requests by status
  const filteredBuyRequests = useMemo(() => {
    if (selectedFilter === null) {
      return buyRequests;
    }
    return buyRequests.filter(request => request.status === selectedFilter);
  }, [buyRequests, selectedFilter]);

  // Filter options
  const filterOptions = [
    { value: null, label: 'Tất cả' },
    { value: 'Pending', label: 'Chờ duyệt' },
    { value: 'Accepted', label: 'Đã duyệt' },
    { value: 'Rejected', label: 'Bị từ chối' },
    { value: 'Completed', label: 'Hoàn thành' },
    { value: 'Cancelled', label: 'Đã hủy' },
  ];

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
      {/* Filter chips - At the top */}
      {buyRequests.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <Filter size={18} color="#6B7280" style={styles.filterIcon} />
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.value || 'all'}
                style={[
                  styles.filterChip,
                  selectedFilter === option.value && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(option.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === option.value && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {buyRequests.length === 0 ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.emptyContainer}>
          <Package size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Chưa có yêu cầu mua hàng nào</Text>
        </ScrollView>
      ) : filteredBuyRequests.length === 0 ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.emptyContainer}>
          <Package size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Không có yêu cầu mua hàng nào</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredBuyRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.requestCard}
              onPress={() => handleViewDetail(item.id)}
            >
              <View style={styles.cardContent}>
                {/* Header with Request Code and Status */}
                <View style={styles.cardHeader}>
                  <Text style={styles.requestCode}>
                    {(item as any).requestCode || (item.id ? `BRQ-${item.id.slice(0, 99).toUpperCase()}` : 'N/A')}
                  </Text>
                  <View style={styles.headerRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status), borderColor: getStatusColor(item.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  {/* Wholesaler Info - Highlighted */}
                  {wholesalerInfoMap[item.id] && (
                    <View style={styles.wholesalerCard}>
                      <Text style={styles.wholesalerLabel}>Thương lái</Text>
                      <Text style={styles.wholesalerName}>
                        {wholesalerInfoMap[item.id].firstName} {wholesalerInfoMap[item.id].lastName}
                      </Text>
                      {wholesalerInfoMap[item.id].address && (
                        <Text style={styles.wholesalerAddress}>
                          {wholesalerInfoMap[item.id].address}
                          {wholesalerInfoMap[item.id].communes && `, ${wholesalerInfoMap[item.id].communes}`}
                          {wholesalerInfoMap[item.id].province && `, ${wholesalerInfoMap[item.id].province}`}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Details Grid */}
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Giá dự tính</Text>
                        <Text style={styles.detailValue}>
                          {item.expectedPrice.toLocaleString('vi-VN')} đ
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailItem}>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Số lượng</Text>
                        <Text style={styles.detailValue}>
                          {item.totalQuantity} {item.totalQuantity > 0 ? 'kg' : '-'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailItem}>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Ngày cần</Text>
                        <Text style={styles.detailValue}>
                          {new Date(item.requiredDate).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Message */}
                  {item.message && (
                    <View style={styles.messageCard}>
                      <Text style={styles.messageLabel}>Ghi chú</Text>
                      <Text style={styles.messageText} numberOfLines={2}>
                        {item.message}
                      </Text>
                    </View>
                  )}

                  {/* Bulk Badge */}
                  
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
    paddingTop: 40,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  requestCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardDetails: {
    gap: 8,
  },
  // Wholesaler Card
  wholesalerCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: 4,
  },
  wholesalerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  wholesalerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  wholesalerAddress: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  // Details Grid
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
  },
  detailContent: {
    width: '100%',
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    flexWrap: 'nowrap',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Message Card
  messageCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  messageRow: {
    marginTop: 4,
  },
  // Bulk Badge
  bulkBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  bulkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  // Old styles (kept for compatibility)
  wholesalerInfoRow: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  wholesalerInfo: {
    flex: 1,
    marginTop: 4,
  },
  // Filter
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  filterIcon: {
    marginRight: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
