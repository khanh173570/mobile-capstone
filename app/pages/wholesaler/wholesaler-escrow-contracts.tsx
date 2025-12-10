import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, ArrowLeft } from 'lucide-react-native';
import { EscrowContractCard } from '../../../components/shared/EscrowContractCard';
import { EscrowDetailModal } from '../../../components/shared/EscrowDetailModal';
import { getWholesalerEscrows, EscrowContract } from '../../../services/escrowContractService';
import { getAuctionDetail } from '../../../services/auctionService';

export default function WholesalerEscrowContractsScreen() {
  const router = useRouter();
  const [escrows, setEscrows] = useState<EscrowContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowContract | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchEscrows = async () => {
    setLoading(true);
    try {
      const data = await getWholesalerEscrows();
      
      // Fetch auction details to get sessionCode for each escrow
      const enrichedData = await Promise.all(
        data.map(async (escrow) => {
          try {
            const auctionDetail = await getAuctionDetail(escrow.auctionId);
            return {
              ...escrow,
              sessionCode: auctionDetail?.sessionCode || escrow.auctionId,
            };
          } catch (error) {
            console.error(`Error fetching auction ${escrow.auctionId}:`, error);
            return {
              ...escrow,
              sessionCode: escrow.auctionId,
            };
          }
        })
      );
      
      setEscrows(enrichedData);
    } catch (error) {
      console.error('Error fetching escrows:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách hợp đồng');
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

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FileText size={48} color="#D1D5DB" />
      <Text style={styles.emptyText}>Không có hợp đồng nào</Text>
      <Text style={styles.emptySubText}>Các hợp đồng cọc tiền của bạn sẽ hiển thị ở đây</Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#22C55E" />
      <Text style={styles.loadingText}>Đang tải...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý hợp đồng</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={escrows}
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
        scrollEnabled={escrows.length > 0}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
});
