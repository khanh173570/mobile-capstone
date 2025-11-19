import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Filter } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import Header from '../../../../components/shared/Header';
import AuctionCard from '../../../../components/farmer/AuctionCard';
import { 
  getFarmerAuctions, 
  FarmerAuction, 
  filterAuctionsByStatus 
} from '../../../../services/auctionService';

export default function AuctionManagementScreen() {
  const [auctions, setAuctions] = useState<FarmerAuction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<FarmerAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showAllStatusModal, setShowAllStatusModal] = useState(false);

  const statusOptions = [
    { value: 'All', label: 'Tất cả' },
    { value: 'Draft', label: 'Nháp' },
    { value: 'Pending', label: 'Chờ duyệt' },
    { value: 'Rejected', label: 'Bị từ chối' },
    { value: 'Approved', label: 'Đã duyệt' },
    { value: 'OnGoing', label: 'Đang diễn ra' },
    { value: 'Completed', label: 'Hoàn thành' },
    { value: 'NoWinner', label: 'Không có người thắng' },
    { value: 'Cancelled', label: 'Đã hủy' },
  ];

  useEffect(() => {
    loadAuctions();
  }, []);

  // Auto refresh when screen comes to focus
  useFocusEffect(
    React.useCallback(() => {
      loadAuctions();
    }, [])
  );

  useEffect(() => {
    // Filter auctions when status changes
    const filtered = filterAuctionsByStatus(auctions, selectedStatus);
    setFilteredAuctions(filtered);
  }, [auctions, selectedStatus]);

  const loadAuctions = async () => {
    try {
      setLoading(true);
      const auctionData = await getFarmerAuctions();
      setAuctions(auctionData);
    } catch (error) {
      console.error('Error loading auctions:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đấu giá');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAuctions();
    setRefreshing(false);
  };

  const handleAuctionPress = (auction: FarmerAuction) => {
    try {
      router.push({
        pathname: '/pages/farmer/auction-detail',
        params: {
          auctionData: JSON.stringify(auction)
        }
      });
    } catch (error) {
      console.error('Error navigating to auction detail:', error);
      Alert.alert('Lỗi', 'Không thể mở chi tiết đấu giá');
    }
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setShowStatusFilter(false);
  };



  const renderAuction = ({ item, index = 0 }: { item: FarmerAuction; index?: number }) => (
    <AuctionCard 
      auction={item} 
      onPress={() => handleAuctionPress(item)}
      isFirst={index === 0}
      isLast={index === filteredAuctions.length - 1}
    />
  );


  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Quản lý Đấu giá" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Quản lý Đấu giá" />

      {/* Status Filter for Auctions */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowStatusFilter(!showStatusFilter)}
        >
          <View><Filter size={16} color="#6B7280" /></View>
          <Text style={styles.filterButtonText}>
            {statusOptions.find(option => option.value === selectedStatus)?.label}
          </Text>
        </TouchableOpacity>
        
        {showStatusFilter && (
          <View style={styles.filterDropdown}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  selectedStatus === option.value && styles.selectedFilterOption
                ]}
                onPress={() => handleStatusFilter(option.value)}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedStatus === option.value && styles.selectedFilterOptionText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#22C55E']}
          />
        }
      >
        {filteredAuctions.length > 0 ? (
          <FlatList
            data={filteredAuctions}
            renderItem={renderAuction}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {auctions.length === 0 
                ? 'Chưa có đấu giá nào' 
                : `Không có đấu giá nào với trạng thái "${statusOptions.find(option => option.value === selectedStatus)?.label}"`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Summary Stats */}
      {auctions.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRowHeader}>
            <TouchableOpacity 
              style={styles.showAllButton}
              onPress={() => setShowAllStatusModal(true)}
            >
              <Text style={styles.showAllButtonText}>⋯</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={[styles.statItem, selectedStatus === 'Draft' && styles.activeStatItem]}
              onPress={() => handleStatusFilter('Draft')}
            >
              <Text style={[styles.statValue, selectedStatus === 'Draft' ? { color: '#3B82F6' } : { color: '#1F2937' }]}>
                {auctions.filter(a => a.status === 'Draft').length}
              </Text>
              <Text style={styles.statLabel}>Nháp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.statItem, selectedStatus === 'Pending' && styles.activeStatItem]}
              onPress={() => handleStatusFilter('Pending')}
            >
              <Text style={[styles.statValue, selectedStatus === 'Pending' ? { color: '#3B82F6' } : { color: '#F59E0B' }]}>
                {auctions.filter(a => a.status === 'Pending').length}
              </Text>
              <Text style={styles.statLabel}>Chờ duyệt</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.statItem, selectedStatus === 'Completed' && styles.activeStatItem]}
              onPress={() => handleStatusFilter('Completed')}
            >
              <Text style={[styles.statValue, selectedStatus === 'Completed' ? { color: '#3B82F6' } : { color: '#22C55E' }]}>
                {auctions.filter(a => a.status === 'Completed').length}
              </Text>
              <Text style={styles.statLabel}>Hoàn thành</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* All Status Modal */}
      <Modal
        visible={showAllStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAllStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tất cả trạng thái</Text>
              <TouchableOpacity onPress={() => setShowAllStatusModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.statusGrid}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.modalStatItem, selectedStatus === option.value && styles.activeModalStatItem]}
                    onPress={() => {
                      handleStatusFilter(option.value);
                      setShowAllStatusModal(false);
                    }}
                  >
                    <Text style={[
                      styles.modalStatValue,
                      selectedStatus === option.value ? { color: '#3B82F6' } :
                      option.value === 'Draft' ? { color: '#1F2937' } :
                      option.value === 'Pending' ? { color: '#F59E0B' } :
                      option.value === 'Completed' ? { color: '#22C55E' } :
                      option.value === 'OnGoing' ? { color: '#22C55E' } :
                      option.value === 'Approved' ? { color: '#10B981' } :
                      option.value === 'Rejected' ? { color: '#EF4444' } :
                      option.value === 'NoWinner' ? { color: '#8B5CF6' } :
                      option.value === 'Cancelled' ? { color: '#94A3B8' } :
                      { color: '#22C55E' }
                    ]}>
                      {option.value === 'All' ? auctions.length : auctions.filter(a => a.status === option.value).length}
                    </Text>
                    <Text style={styles.modalStatLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'column',
  },
  statsRowHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  showAllButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showAllButtonText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  activeStatItem: {
    backgroundColor: '#EDF2F7',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  activeStatValue: {
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  modalScroll: {
    paddingVertical: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  modalStatItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
  },
  activeModalStatItem: {
    backgroundColor: '#EDF2F7',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 4,
  },
  activeModalStatValue: {
    color: '#3B82F6',
  },
  modalStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    position: 'relative',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filterDropdown: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedFilterOption: {
    backgroundColor: '#EDF2F7',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedFilterOptionText: {
    color: '#22C55E',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});