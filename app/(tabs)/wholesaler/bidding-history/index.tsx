import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Filter, Award, TrendingUp } from 'lucide-react-native';
import WholesalerAuctionCard from '../../../../components/wholesaler/WholesalerAuctionCard';
import { getWholesalerAuctions, WholesalerAuction } from '../../../../services/wholesalerAuctionService';
import { handleError } from '../../../../utils/errorHandler';
import { getUserProfile } from '../../../../services/authService';

export default function BiddingHistoryScreen() {
  const [auctions, setAuctions] = useState<WholesalerAuction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<WholesalerAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [userId, setUserId] = useState<string>('');

  const filters = [
    { id: 'all', label: 'Tất cả', icon: TrendingUp },
    { id: 'won', label: 'Đã thắng', icon: Award },
    { id: 'active', label: 'Đang diễn ra', icon: Filter },
    { id: 'completed', label: 'Hoàn thành', icon: Filter },
    { id: 'no-winner', label: 'Không thắng', icon: Filter },
  ];

  useEffect(() => {
    loadUserProfile();
    loadAuctions();
  }, []);

  useEffect(() => {
    filterAuctions();
  }, [selectedFilter, auctions, userId]);

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

  const filterAuctions = () => {
    let filtered = [...auctions];

    switch (selectedFilter) {
      case 'won':
        filtered = filtered.filter(a => a.winnerId === userId && a.status === 'Completed');
        break;
      case 'active':
        filtered = filtered.filter(a => a.status === 'Active');
        break;
      case 'completed':
        filtered = filtered.filter(a => a.status === 'Completed');
        break;
      case 'no-winner':
        filtered = filtered.filter(a => a.status === 'NoWinner');
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
    // Navigate to auction detail
    router.push({
      pathname: '/pages/wholesaler/auction-detail' as any,
      params: {
        auctionId: auction.id,
      },
    });
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử đấu thầu</Text>
        <Text style={styles.headerSubtitle}>
          {filteredAuctions.length} phiên đấu giá
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderFilterButton(item)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {/* Auctions List */}
      <FlatList
        data={filteredAuctions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WholesalerAuctionCard
            auction={item}
            onPress={() => handleAuctionPress(item)}
            isWinner={item.winnerId === userId && item.status === 'Completed'}
          />
        )}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  filtersSection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
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