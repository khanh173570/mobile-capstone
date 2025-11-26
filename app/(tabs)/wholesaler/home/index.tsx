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
  Modal,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MapPin, DollarSign, Calendar, Package, User, MoreVertical } from 'lucide-react-native';
import { getAuctionsByStatus, getAuctionStatusInfo } from '../../../../services/auctionService';
import { getCurrentUser } from '../../../../services/authService';
import Header from '../../../../components/shared/Header';
import ReportAuctionModal from '../../../../components/shared/ReportAuctionModal';

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
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>('');
  const [menuVisibleFor, setMenuVisibleFor] = useState<string | null>(null);
  const [countdowns, setCountdowns] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('WholesalerHomeScreen focused - reloading auctions');
      loadData();
    }, [])
  );

  const calculateCountdown = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) {
      return {
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00',
        isEnded: true,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      days: String(days).padStart(2, '0'),
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      isEnded: false,
    };
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns: { [key: string]: any } = {};
      auctions.forEach((auction) => {
        newCountdowns[auction.id] = calculateCountdown(auction.endDate);
      });
      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [auctions]);

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

  const handleReportPress = (auctionId: string) => {
    setSelectedAuctionId(auctionId);
    setReportModalVisible(true);
    setMenuVisibleFor(null);
  };

  const renderAuctionCard = ({ item }: { item: Auction }) => {
    const statusInfo = getStatusInfo(item.status);
    const currentPrice = item.currentPrice || item.startingPrice;

    return (
      <View style={styles.auctionCardWrapper}>
        <TouchableOpacity
          style={styles.auctionCard}
          onPress={() => handleAuctionPress(item.id)}
        >
          {/* Countdown Section - Top */}
          <View style={styles.countdownTopSection}>
            {countdowns[item.id] && !countdowns[item.id].isEnded ? (
              <View style={styles.countdownContainer}>
                <View style={styles.countdownBox}>
                  <Text style={styles.countdownValue}>{countdowns[item.id].days}</Text>
                  <Text style={styles.countdownLabel}>Ngày</Text>
                </View>
                <View style={styles.countdownBox}>
                  <Text style={styles.countdownValue}>{countdowns[item.id].hours}</Text>
                  <Text style={styles.countdownLabel}>Giờ</Text>
                </View>
                <View style={styles.countdownBox}>
                  <Text style={styles.countdownValue}>{countdowns[item.id].minutes}</Text>
                  <Text style={styles.countdownLabel}>Phút</Text>
                </View>
                <View style={styles.countdownBox}>
                  <Text style={styles.countdownValue}>{countdowns[item.id].seconds}</Text>
                  <Text style={styles.countdownLabel}>Giây</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.endedText}>Đã kết thúc</Text>
            )}
          </View>

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
            <TouchableOpacity
              style={styles.menuButtonInline}
              onPress={() => setMenuVisibleFor(menuVisibleFor === item.id ? null : item.id)}
            >
              <MoreVertical size={20} color="#6B7280" />
            </TouchableOpacity>
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

        {/* Dropdown Menu */}
        {menuVisibleFor === item.id && (
          <View style={styles.menuDropdown}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleReportPress(item.id)}
            >
              <Text style={styles.menuItemText}>📢 Báo cáo đấu giá</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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

      {/* Report Modal */}
      <ReportAuctionModal
        visible={reportModalVisible}
        auctionId={selectedAuctionId}
        onClose={() => setReportModalVisible(false)}
      />
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
  auctionCardWrapper: {
    marginBottom: 12,
    position: 'relative',
  },
  auctionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  menuButtonInline: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexShrink: 0,
  },
  menuDropdown: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    zIndex: 20,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 0,
    borderBottomWidth: 0,
    gap: 8,
  },
  sessionCodeContainer: {
    flex: 1,
    minWidth: 0,
  },
  sessionCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  countdownTopSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
    alignItems: 'center',
  },
  countdownContainer: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  countdownBox: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 72,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  countdownValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  countdownLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#F59E0B',
    textAlign: 'center',
  },
  endedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
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