import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, DollarSign, Calendar, Package, User } from 'lucide-react-native';
import { getAuctionsByStatus, getAuctionStatusInfo } from '../../../../services/auctionService';
import { getCurrentUser } from '../../../../services/authService';
import Header from '../../../../components/shared/Header';

interface Auction {
  id: string;
  publishDate: string;
  endDate: string;
  farmerId: string;
  sessionCode: string;
  startingPrice: number;
  currentPrice: number | null;
  minBidIncrement: number;
  status: string;
  expectedHarvestDate: string;
  expectedTotalQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export default function WholesalerHomeScreen() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load current user
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }

      // Load auctions
      const auctionData = await getAuctionsByStatus('OnGoing', 1, 10);
      if (auctionData.isSuccess && auctionData.data.items) {
        setAuctions(auctionData.data.items);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đấu giá');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const auctionData = await getAuctionsByStatus('OnGoing', 1, 10);
      if (auctionData.isSuccess && auctionData.data.items) {
        setAuctions(auctionData.data.items);
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: string) => {
    return getAuctionStatusInfo(status);
  };

  const handleAuctionPress = (auctionId: string) => {
    router.push({
      pathname: '/(tabs)/wholesaler/home/auction-detail',
      params: { auctionId },
    } as any);
  };

  const renderAuctionCard = ({ item }: { item: Auction }) => {
    const statusInfo = getStatusInfo(item.status);
    const currentPrice = item.currentPrice || item.startingPrice;

    return (
      <TouchableOpacity
        style={styles.auctionCard}
        onPress={() => handleAuctionPress(item.id)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.sessionCodeContainer}>
            <Text style={styles.sessionCode}>{item.sessionCode}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.backgroundColor }
            ]}
          >
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.name}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          {/* Price & Quantity Row */}
          <View style={styles.twoColumnRow}>
            <View style={[styles.infoBox, { flex: 1, marginRight: 8 }]}>
              <View style={styles.infoBoxHeader}>
                <DollarSign size={16} color="#16A34A" />
                <Text style={styles.infoBoxLabel}>Giá hiện tại</Text>
              </View>
              <Text style={styles.priceValue}>
                {formatCurrency(currentPrice)}
              </Text>
              <Text style={styles.minBidText}>
                Tối thiểu: {formatCurrency(item.minBidIncrement)}
              </Text>
            </View>

            <View style={[styles.infoBox, { flex: 1 }]}>
              <View style={styles.infoBoxHeader}>
                <Package size={16} color="#F59E0B" />
                <Text style={styles.infoBoxLabel}>Dự kiến</Text>
              </View>
              <View style={styles.quantityRow}>
                <Text style={styles.quantityValue}>{item.expectedTotalQuantity}</Text>
                <Text style={styles.quantityUnit}>kg</Text>
              </View>
            </View>
          </View>

          {/* Date Information - Highlighted */}
          <View style={styles.dateHighlight}>
            <View style={styles.dateItem}>
              <Calendar size={16} color="#059669" />
              <View style={styles.dateContent}>
                <Text style={styles.dateLabel}>Bắt đầu:</Text>
                <Text style={styles.dateValue}>
                  {formatDate(item.publishDate)}
                </Text>
              </View>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateItem}>
              <Calendar size={16} color="#3B82F6" />
              <View style={styles.dateContent}>
                <Text style={styles.dateLabel}>Kết thúc:</Text>
                <Text style={styles.dateValue}>
                  {formatDate(item.endDate)}
                </Text>
              </View>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateItem}>
              <Calendar size={16} color="#059669" />
              <View style={styles.dateContent}>
                <Text style={styles.dateLabel}>Thu hoạch:</Text>
                <Text style={styles.dateValue}>
                  {formatDate(item.expectedHarvestDate)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.viewDetailButton}
            onPress={() => handleAuctionPress(item.id)}
          >
            <Text style={styles.viewDetailButtonText}>Xem chi tiết →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Trang chủ - Nhà bán buôn" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Đang tải đấu giá...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Trang chủ - Nhà bán buôn" />
      
      <View style={styles.content}>
        {user && (
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              Chào mừng, {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.subtitleText}>
              Các đấu giá đang diễn ra
            </Text>
          </View>
        )}

        {auctions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Không có đấu giá nào</Text>
            <Text style={styles.emptyText}>
              Hiện tại không có đấu giá nào đang diễn ra
            </Text>
          </View>
        ) : (
          <FlatList
            data={auctions}
            renderItem={renderAuctionCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#22C55E']}
                tintColor="#22C55E"
              />
            }
          />
        )}
      </View>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  auctionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  sessionCodeContainer: {
    flex: 1,
  },
  sessionCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 12,
    gap: 8,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  infoBoxLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  quantityUnit: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  minBidText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  dateHighlight: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dateDivider: {
    height: 1,
    backgroundColor: '#DBEAFE',
    marginVertical: 10,
  },
  dateContent: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
  },
  minBid: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  subValue: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cardFooter: {
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    paddingTop: 12,
    marginTop: 8,
  },
  viewDetailButton: {
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewDetailButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});