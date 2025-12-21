import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { MapPin, DollarSign, Calendar, Package, User, MoreVertical, Bell } from 'lucide-react-native';
import { getAuctionsByStatus, getAuctionStatusInfo } from '../../../../services/auctionService';
import { getCurrentUser } from '../../../../services/authService';
import { getFarmsByUserId } from '../../../../services/farmService';
import { getUnreadNotificationCount, getUserNotifications, UserNotification } from '../../../../services/userNotificationService';
import { NotificationModal } from '../../../../components/shared/NotificationModal';
import { signalRService, NewNotificationEvent } from '../../../../services/signalRService';
import Header from '../../../../components/shared/Header';
import ReportAuctionModal from '../../../../components/shared/ReportAuctionModal';
import FarmerProfileModal from '../../../../components/shared/FarmerProfileModal';
import BuyNowModal from '../../../../components/wholesaler/BuyNowModal';

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
  enableBuyNow?: boolean;
  buyNowPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export default function WholesalerHomeScreen() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>('');
  const [menuVisibleFor, setMenuVisibleFor] = useState<string | null>(null);
  const [countdowns, setCountdowns] = useState<{ [key: string]: any }>({});
  const [farmerProfileModalVisible, setFarmerProfileModalVisible] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('');
  const [farmerFarmImages, setFarmerFarmImages] = useState<{ [farmerId: string]: string }>({});
  const [farmerFarmNames, setFarmerFarmNames] = useState<{ [farmerId: string]: string }>({});
  const [farmerLoadingState, setFarmerLoadingState] = useState<{ [farmerId: string]: boolean }>({});
  const [buyNowModalVisible, setBuyNowModalVisible] = useState(false);
  const [selectedAuctionForBuyNow, setSelectedAuctionForBuyNow] = useState<Auction | null>(null);
  const [realtimePrices, setRealtimePrices] = useState<{ [auctionId: string]: number }>({});

  // Load data on mount and focus - no initial loading spinner
  useEffect(() => {
    const initializeApp = async () => {
      // Initialize SignalR connection
      console.log('🔌 [Wholesaler] Initializing SignalR...');
      try {
        await signalRService.connect();
        console.log('✅ [Wholesaler] SignalR connected');
      } catch (error) {
        console.error('❌ [Wholesaler] SignalR connection failed:', error);
      }
      
      // Setup real-time notification listener
      console.log('📡 [Wholesaler] Setting up notification listener...');
      const unsubscribeNotifications = signalRService.onNewNotification((event: NewNotificationEvent) => {
        console.log('🔔 [SIGNALR LISTENER TRIGGERED] New notification received!');
        console.log('   📩 From SignalR (REAL-TIME):', {
          id: event.id,
          type: event.type,
          title: event.title,
          message: event.message,
          severity: event.severity,
        });
        
        // Convert SignalR event to UserNotification format
        const userNotification: UserNotification = {
          id: event.id,
          userId: event.userId,
          type: event.type,
          severity: event.severity === 'Info' ? 0 : event.severity === 'Warning' ? 1 : 2,
          title: event.title,
          message: event.message,
          isRead: event.isRead,
          readAt: event.readAt || null,
          data: event.data || null,
          relatedEntityId: event.relatedEntityId || null,
          relatedEntityType: event.relatedEntityType || null,
          createdAt: event.createdAt,
          updatedAt: null,
        };
        
        // Add new notification to the list at the top
        setNotifications(prev => [userNotification, ...prev]);
        console.log('📝 [State Update] Notifications list updated');
        console.log('🔄 [Bell Update] Calling loadUnreadNotifications to refresh badge...');
        loadUnreadNotifications();
      });
      console.log('✅ [Wholesaler] Notification listener registered');
      
      loadDataQuietly();
      loadUnreadNotifications();
      
      return unsubscribeNotifications;
    };

    const unsubscribe = initializeApp();
    
    // Auto-refresh every 30 seconds when screen is active
    const autoRefreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing wholesaler home auctions...');
      loadDataQuietly();
    }, 30000);
    
    return () => {
      clearInterval(autoRefreshInterval);
      unsubscribe.then(fn => fn?.());
    };
  }, []);

  // Setup real-time bid update listener (runs once on mount)
  useEffect(() => {
    console.log('🔔 Setting up BidPlaced listener for home page');
    
    const unsubscribeBidPlaced = signalRService.onBidPlaced((event: any) => {
      console.log('💰 BidPlaced event received in home page:', event.auctionId, 'new price:', event.newPrice);
      // Update realtime price for this auction
      setRealtimePrices(prev => ({
        ...prev,
        [event.auctionId]: event.newPrice
      }));
    });
    
    // Cleanup on unmount
    return () => {
      console.log('🔔 Cleaning up BidPlaced listener from home page');
      unsubscribeBidPlaced();
    };
  }, []); // Empty dependency array - only run once on mount

  // Preload farmer images when auctions change
  useEffect(() => {
    if (auctions.length > 0) {
      const uniqueFarmerIds = [...new Set(auctions.map(a => a.farmerId))];
      
      uniqueFarmerIds.forEach((farmerId) => {
        if (!farmerFarmImages.hasOwnProperty(farmerId) && !farmerLoadingState[farmerId]) {
          loadFarmerFarmImage(farmerId);
        }
      });
    }
  }, [auctions]);

  // Join auction groups for realtime updates
  useEffect(() => {
    if (auctions.length > 0) {
      auctions.forEach((auction) => {
        signalRService.joinAuctionGroup(auction.id).catch((error) => {
          console.error('Failed to join auction group:', auction.id, error);
        });
      });
    }
  }, [auctions]);

  useFocusEffect(
    React.useCallback(() => {
      console.log('WholesalerHomeScreen focused - reloading auctions');
      loadDataQuietly();
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
    // Calculate initial countdowns immediately when auctions load
    if (auctions.length > 0) {
      const initialCountdowns: { [key: string]: any } = {};
      auctions.forEach((auction) => {
        initialCountdowns[auction.id] = calculateCountdown(auction.endDate);
      });
      setCountdowns(initialCountdowns);
    }

    // Then update every second
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

      // Load auctions (increased pageSize to 100 to ensure we get all auctions)
      const auctionData = await getAuctionsByStatus('OnGoing', 1, 100);
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

  // Load data without showing loading spinner (for initial load and focus refresh)
  const loadDataQuietly = async () => {
    try {
      // Load current user
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }

      // Load auctions (increased pageSize to 100 to ensure we get all auctions)
      const auctionData = await getAuctionsByStatus('OnGoing', 1, 100);
      if (auctionData.isSuccess && auctionData.data.items) {
        // Calculate countdowns immediately before setting auctions
        const initialCountdowns: { [key: string]: any } = {};
        auctionData.data.items.forEach((auction: Auction) => {
          initialCountdowns[auction.id] = calculateCountdown(auction.endDate);
        });
        setCountdowns(initialCountdowns);
        
        // Then set auctions
        setAuctions(auctionData.data.items);
      }
    } catch (error) {
      console.error('Error loading data quietly:', error);
      // Don't show alert on quiet load
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const auctionData = await getAuctionsByStatus('OnGoing', 1, 100);
      if (auctionData.isSuccess && auctionData.data.items) {
        setAuctions(auctionData.data.items);
      }
      await loadUnreadNotifications();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      console.log('📞 [API Call] Fetching unread notification count from API...');
      const count = await getUnreadNotificationCount();
      console.log('✅ [API Response] Got count:', count);
      console.log('🔔 [Bell Badge] Setting unreadCount state to:', count);
      setUnreadCount(count);
      console.log('✨ [UI Update] Bell icon should update now');
    } catch (error) {
      console.error('❌ [API Error] Error loading unread count:', error);
    }
  };

  const formatCurrency = useCallback((price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getStatusInfo = useCallback((status: string) => {
    return getAuctionStatusInfo(status);
  }, []);

  const handleAuctionPress = useCallback((auctionId: string) => {
    router.push({
      pathname: '/(tabs)/wholesaler/home/auction-detail',
      params: { auctionId },
    } as any);
  }, [router]);

  const handleReportPress = useCallback((auctionId: string) => {
    setSelectedAuctionId(auctionId);
    setReportModalVisible(true);
    setMenuVisibleFor(null);
  }, []);

  const loadFarmerFarmImage = async (farmerId: string) => {
    // Don't call if invalid farmerId
    if (!farmerId || farmerId.trim() === '') {
      return;
    }

    // Don't call if already have image or already loading
    if (farmerFarmImages[farmerId] || farmerLoadingState[farmerId]) {
      return;
    }

    // Mark as loading to prevent multiple calls
    setFarmerLoadingState((prev) => ({
      ...prev,
      [farmerId]: true,
    }));

    try {
      const farms = await getFarmsByUserId(farmerId);
      
      if (farms.length > 0 && farms[0].farmImage) {
        setFarmerFarmImages((prev) => ({
          ...prev,
          [farmerId]: farms[0].farmImage,
        }));
        setFarmerFarmNames((prev) => ({
          ...prev,
          [farmerId]: farms[0].name || '',
        }));
      } else {
        // Mark as loaded even if no image found to prevent retrying
        setFarmerFarmImages((prev) => ({
          ...prev,
          [farmerId]: '', // Empty string indicates "no image found"
        }));
        setFarmerFarmNames((prev) => ({
          ...prev,
          [farmerId]: '',
        }));
      }
    } catch (error) {
      // Mark as loaded to prevent infinite retries
      setFarmerFarmImages((prev) => ({
        ...prev,
        [farmerId]: '',
      }));
    } finally {
      setFarmerLoadingState((prev) => ({
        ...prev,
        [farmerId]: false,
      }));
    }
  };

  const handleFarmerImagePress = useCallback((farmerId: string) => {
    setSelectedFarmerId(farmerId);
    setFarmerProfileModalVisible(true);
  }, []);

  // Memoized render function to prevent unnecessary re-renders
  const renderAuctionCard = useCallback(({ item }: { item: Auction }) => {
    const statusInfo = getStatusInfo(item.status);
    // Use realtime price if available, otherwise use item price
    const currentPrice = realtimePrices[item.id] ?? (item.currentPrice || item.startingPrice);
    const farmerImage = farmerFarmImages[item.farmerId];
    const farmName = farmerFarmNames[item.farmerId];

    return (
      <View style={styles.auctionCardWrapper}>
        <TouchableOpacity
          style={styles.auctionCard}
          onPress={() => handleAuctionPress(item.id)}
        >
          {/* Header: Avatar | Session Code | Status | Menu */}
          <View style={styles.cardHeader}>
            {/* Farmer Avatar + Farm Name */}
            {farmerImage && farmerImage !== '' && (
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  style={styles.farmerAvatarContainer}
                  onPress={() => handleFarmerImagePress(item.farmerId)}
                >
                  <Image
                    source={{ uri: farmerImage }}
                    style={styles.farmerAvatar}
                  />
                </TouchableOpacity>
                {farmName && farmName !== '' && (
                  <Text style={styles.farmNameText}>{farmName}</Text>
                )}
              </View>
            )}
            
            <View style={styles.middleSection}>
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
            <TouchableOpacity
              style={styles.menuButtonInline}
              onPress={() => setMenuVisibleFor(menuVisibleFor === item.id ? null : item.id)}
            >
              <MoreVertical size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Countdown Section - Moved Below */}
          <View style={styles.countdownSection}>
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

          <View style={styles.cardContent}>
            {/* Price & Quantity Row */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.infoBox, { flex: 1, marginRight: 8 }]}>
                <View style={styles.infoBoxHeader}>
                  {/* <DollarSign size={16} color="#16A34A" /> */}
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
                  {/* <Package size={16} color="#F59E0B" /> */}
                  <Text style={styles.infoBoxLabel}>Sản lượng dự kiến</Text>
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
  }, [farmerFarmImages, farmerFarmNames, countdowns, handleAuctionPress, handleFarmerImagePress, formatCurrency, formatDate, menuVisibleFor, handleReportPress, getStatusInfo]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Đang tải đấu giá...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        userName={user ? `${user.firstName} ${user.lastName}` : 'Người dùng'}
        onNotificationPress={() => setShowNotificationModal(true)}
        unreadNotificationCount={unreadCount}
      />
      
      <View style={styles.content}>

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
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            updateCellsBatchingPeriod={50}
            initialNumToRender={3}
            scrollEventThrottle={16}
            extraData={realtimePrices}
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

      {/* Farmer Profile Modal */}
      <FarmerProfileModal
        visible={farmerProfileModalVisible}
        farmerId={selectedFarmerId}
        onClose={() => setFarmerProfileModalVisible(false)}
      />

      {/* Buy Now Modal */}
      {selectedAuctionForBuyNow && (
        <BuyNowModal
          visible={buyNowModalVisible}
          auction={selectedAuctionForBuyNow}
          onClose={() => {
            setBuyNowModalVisible(false);
            setSelectedAuctionForBuyNow(null);
          }}
          onSuccess={() => {
            setBuyNowModalVisible(false);
            setSelectedAuctionForBuyNow(null);
            loadDataQuietly();
          }}
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => {
          setShowNotificationModal(false);
          loadUnreadNotifications();
        }}
        role="wholesaler"
        onRefresh={loadUnreadNotifications}
        notifications={notifications}
        onNotificationsChange={setNotifications}
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  auctionCardWrapper: {
    marginBottom: 12,
    position: 'relative',
  },
  auctionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    marginBottom: 10,
    paddingBottom: 0,
    borderBottomWidth: 0,
    gap: 6,
  },
  middleSection: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionCodeContainer: {
    marginBottom: 4,
  },
  sessionCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
    textAlign: 'center',
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
  farmNameText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
    textAlign: 'center',
    maxWidth: 60,
  },
  countdownSection: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
    alignItems: 'center',
  },
  countdownContainer: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  countdownBox: {
    backgroundColor: '#1F2937',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 60,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  countdownValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  countdownLabel: {
    fontSize: 8,
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
    marginBottom: 8,
    gap: 6,
  },
  avatarSection: {
    alignItems: 'center',
    marginRight: 10,
    minWidth: 60,
  },
  farmerAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
   
    overflow: 'hidden',
    marginBottom: 4,
  },
  farmerAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
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
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dateDivider: {
    height: 1,
    backgroundColor: '#DBEAFE',
    marginVertical: 8,
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
    paddingTop: 0,
    marginTop: 0,
  },
  viewDetailButton: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewDetailButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buyNowButton: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  buyNowButtonText: {
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