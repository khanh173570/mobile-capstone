import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FileText, Filter } from 'lucide-react-native';
import { EscrowContractCard } from '../../../../components/shared/EscrowContractCard';
import { EscrowDetailModal } from '../../../../components/shared/EscrowDetailModal';
import { getWholesalerEscrows, EscrowContract } from '../../../../services/escrowContractService';
import { getAuctionDetail } from '../../../../services/auctionService';
import { getEscrowStatusName, EscrowStatus } from '../../../../services/escrowService';

export default function WholesalerTransactionsScreen() {
  const [escrows, setEscrows] = useState<EscrowContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowContract | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<number | null>(null);

  const fetchEscrows = async () => {
    setLoading(true);
    try {
      const data = await getWholesalerEscrows();
      
      // Fetch auction/buyRequest details to get sessionCode for each escrow
      const enrichedData = await Promise.all(
        data.map(async (escrow) => {
          try {
            // Check if it's auction or buy request
            if (escrow.auctionId) {
              const auctionDetail = await getAuctionDetail(escrow.auctionId);
              return {
                ...escrow,
                sessionCode: auctionDetail?.sessionCode || escrow.auctionId,
              };
            } else if (escrow.buyRequestId) {
              // For buy requests, use buyRequestId as display
              return {
                ...escrow,
                sessionCode: `BUY-${escrow.buyRequestId.slice(0, 8)}`,
              };
            } else {
              return {
                ...escrow,
                sessionCode: escrow.id.slice(0, 8),
              };
            }
          } catch (error) {
            console.error(`Error fetching details for escrow ${escrow.id}:`, error);
            return {
              ...escrow,
              sessionCode: escrow.id.slice(0, 8),
            };
          }
        })
      );
      
      setEscrows(enrichedData);
    } catch (error) {
      console.error('Error fetching escrows:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách giao dịch ký quỹ');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEscrows();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchEscrows();
  }, []);

  const handleContractPress = (contract: EscrowContract) => {
    setSelectedEscrow(contract);
    setModalVisible(true);
  };

  // Filter escrows by status
  const filteredEscrows = useMemo(() => {
    if (selectedFilter === null) {
      return escrows;
    }
    return escrows.filter(escrow => escrow.escrowStatus === selectedFilter);
  }, [escrows, selectedFilter]);

  // Filter options
  const filterOptions = [
    { value: null, label: 'Tất cả' },
    { value: EscrowStatus.PendingPayment, label: 'Chờ thanh toán' },
    { value: EscrowStatus.PartiallyFunded, label: 'Đã cọc một phần' },
    { value: EscrowStatus.ReadyToHarvest, label: 'Sẵn sàng thu hoạch' },
    { value: EscrowStatus.FullyFunded, label: 'Đã thanh toán đủ' },
    { value: EscrowStatus.Completed, label: 'Hoàn thành' },
    { value: EscrowStatus.Disputed, label: 'Đang tranh chấp' },
    { value: EscrowStatus.Refunded, label: 'Đã hoàn toàn bộ' },
    { value: EscrowStatus.PartialRefund, label: 'Hoàn tiền một phần' },
    { value: EscrowStatus.Canceled, label: 'Đã hủy' },
  ];

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FileText size={48} color="#D1D5DB" />
      <Text style={styles.emptyText}>Không có giao dịch ký quỹ nào</Text>
      <Text style={styles.emptySubText}>Các giao dịch ký quỹ cọc tiền của bạn sẽ hiển thị ở đây</Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Đang tải...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <Filter size={18} color="#6B7280" style={styles.filterIcon} />
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
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

      <FlatList
        data={filteredEscrows}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <EscrowContractCard
              contract={item}
              role="wholesaler"
              onPress={() => handleContractPress(item)}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={loading ? renderLoading : renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        scrollEnabled={filteredEscrows.length > 0}
      />

      <EscrowDetailModal
        visible={modalVisible}
        contract={selectedEscrow}
        role="wholesaler"
        onClose={() => {
          setModalVisible(false);
          setSelectedEscrow(null);
        }}
        onStatusUpdated={() => {
          fetchEscrows();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  cardContainer: {
    marginBottom: 12,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
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
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
});
