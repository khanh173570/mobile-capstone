import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  AppState,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Filter, Award, TrendingUp } from 'lucide-react-native';
import WholesalerAuctionCard from '../../../../components/wholesaler/WholesalerAuctionCard';
import { getWholesalerAuctions, WholesalerAuction } from '../../../../services/wholesalerAuctionService';
import { handleError } from '../../../../utils/errorHandler';
import { getUserProfile } from '../../../../services/authService';
import { registerNotificationListener, unregisterNotificationListener } from '../../../../services/notificationService';
import { signalRService } from '../../../../services/signalRService';

export default function BiddingHistoryScreen() {
  const [auctions, setAuctions] = useState<WholesalerAuction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<WholesalerAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [userId, setUserId] = useState<string>('');
  const [realtimePrices, setRealtimePrices] = useState<{ [auctionId: string]: number }>({});

  const filters = [
    { id: 'all', label: 'Tất cả', icon: TrendingUp },
    { id: 'ongoing', label: 'Đang diễn ra', icon: Filter },
    { id: 'completed', label: 'Hoàn thành', icon: Award },
  ];

  useEffect(() => {
    loadUserProfile();
    loadAuctions(); // Initial load with spinner
    
    // Auto-refresh every 30 seconds when screen is active (quiet mode)
    const autoRefreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing bidding history...');
      loadAuctionsQuietly(); // Use quiet mode for auto-refresh
    }, 30000); // 30 seconds

    // Listen for bid creation notifications
    const notificationListener = registerNotificationListener((notification) => {
      console.log('📬 Bidding history received notification:', notification);
      if (notification.data?.action === 'refresh_bids') {
        console.log('🔄 Refreshing bidding history due to new bid...');
        loadAuctionsQuietly();
      }
    });
    
    return () => {
      clearInterval(autoRefreshInterval);
      if (notificationListener) {
        unregisterNotificationListener(notificationListener);
      }
    };
  }, []);

  useEffect(() => {
    filterAuctions();
  }, [selectedFilter, auctions, userId, realtimePrices]);

  // Setup real-time bid update listener (runs once on mount)
  useEffect(() => {
    console.log('🔔 Setting up BidPlaced listener for bidding history page');
    
    const unsubscribeBidPlaced = signalRService.onBidPlaced((event: any) => {
      console.log('💰 BidPlaced event received in bidding history:', event.auctionId, 'new price:', event.newPrice);
      // Update realtime price for this auction
      setRealtimePrices(prev => ({
        ...prev,
        [event.auctionId]: event.newPrice
      }));
    });
    
    // Cleanup on unmount
    return () => {
      console.log('🔔 Cleaning up BidPlaced listener from bidding history page');
      unsubscribeBidPlaced();
    };
  }, []); // Empty dependency array - only run once on mount

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

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      if (profile && profile.data) {
        setUserId(profile.data.id);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadAuctions = async () => {
    try {
      setLoading(true);
      const data = await getWholesalerAuctions();
      // Sort by created date (newest first)
      const sortedData = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAuctions(sortedData);
    } catch (error) {
      handleError(error, 'Không thể tải lịch sử đấu thầu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load auctions without showing loading spinner (for auto-refresh)
  const loadAuctionsQuietly = async () => {
    try {
      const data = await getWholesalerAuctions();
      // Sort by created date (newest first)
      const sortedData = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAuctions(sortedData);
    } catch (error) {
      console.error('Error loading auctions quietly:', error);
      // Don't show error alert for quiet refresh
    }
  };

  const filterAuctions = () => {
    let filtered = [...auctions];

    switch (selectedFilter) {
      case 'ongoing':
        filtered = filtered.filter(a => a.status === 'Active');
        break;
      case 'completed':
        filtered = filtered.filter(a => a.status === 'Completed');
        break;
      case 'all':
      default:
        // Show all
        break;
    }

    setFilteredAuctions(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAuctions();
  };

  const handleAuctionPress = (auction: WholesalerAuction) => {
    // Navigate to auction detail in bidding-history tab
    router.push({
      pathname: '/(tabs)/wholesaler/bidding-history/auction-detail',
      params: {
        auctionId: auction.id,
      },
    } as any);
  };

  const renderFilterButton = (filter: typeof filters[0]) => {
    const Icon = filter.icon;
    const isSelected = selectedFilter === filter.id;

    return (
      <TouchableOpacity
        key={filter.id}
        style={[styles.filterButton, isSelected && styles.filterButtonActive]}
        onPress={() => setSelectedFilter(filter.id)}
      >
        <Icon size={16} color={isSelected ? '#fff' : '#6B7280'} />
        <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
          {filter.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <TrendingUp size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateText}>Chưa có lịch sử đấu thầu</Text>
      <Text style={styles.emptyStateSubtext}>
        Tham gia đấu giá để xem lịch sử tại đây
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersSection}>
        <View style={styles.filtersContent}>
          {filters.map((filter) => renderFilterButton(filter))}
        </View>
      </View>

      {/* Auctions List */}
      <FlatList
        data={filteredAuctions}
        keyExtractor={(item) => item.id}
        extraData={realtimePrices}
        renderItem={({ item }) => {
          const isWinner = item.winnerId === userId && item.status === 'Completed';
          return (
            <WholesalerAuctionCard
              auction={item}
              onPress={() => handleAuctionPress(item)}
              isWinner={isWinner}
              showPaymentButton={true}
              realtimePrice={realtimePrices[item.id]}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#22C55E']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filtersSection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: 20,
  },
  filtersContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#22C55E',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});