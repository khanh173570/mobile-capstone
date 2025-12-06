import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import HarvestCard from '../../../../components/farmer/HarvestCard';
import CreateHarvestModal from '../../../../components/farmer/CreateHarvestModal';
import EditHarvestModal from '../../../../components/farmer/EditHarvestModal';
import { 
  getHarvestsByCropId, 
  createHarvest, 
  updateHarvest,
  deleteHarvest,
  Harvest,
  CreateHarvestData,
  UpdateHarvestData,
} from '../../../../services/harvestService';
import { handleError } from '../../../../utils/errorHandler';

export default function HarvestListPage() {
  const params = useLocalSearchParams();
  const cropId = params.cropId as string;
  const cropName = params.cropName as string;
  const cropPlantingDate = params.cropPlantingDate as string;
  const cropStatus = parseInt(params.cropStatus as string) || 0;

  // Check if harvest list should be in view-only mode
  const isViewOnly = cropStatus === 2;

  console.log('=== HarvestListPage Loaded ===');
  console.log('Params:', params);
  console.log('Crop ID:', cropId);
  console.log('Crop Name:', cropName);
  console.log('Crop Planting Date:', cropPlantingDate);
  console.log('Crop Status:', cropStatus);
  console.log('Is View Only:', isViewOnly);

  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState<Harvest | null>(null);

  useEffect(() => {
    console.log('useEffect triggered, loading harvests...');
    loadHarvests();
  }, [cropId]);

  const loadHarvests = async () => {
    try {
      setLoading(true);
      
      // Guard: check if cropId exists
      if (!cropId) {
        console.error('Crop ID is missing');
        handleError(new Error('Crop ID không được xác định'), 'Lỗi tải dữ liệu');
        return;
      }

      const data = await getHarvestsByCropId(cropId);
      setHarvests(data);
    } catch (error) {
      handleError(error, 'Không thể tải danh sách mùa vụ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHarvests();
  };

  const handleCreateHarvest = async (harvestData: CreateHarvestData) => {
    try {
      await createHarvest(harvestData);
      setShowCreateModal(false);
      loadHarvests();
    } catch (error) {
      handleError(error, 'Không thể tạo mùa vụ');
      throw error;
    }
  };

  const handleEditHarvest = (harvest: Harvest) => {
    // Always allow opening the modal, but it will be in view-only mode if cropStatus is 2
    setSelectedHarvest(harvest);
    setShowEditModal(true);
  };

  const handleUpdateHarvest = async (harvestData: UpdateHarvestData) => {
    if (!selectedHarvest) return;
    
    try {
      await updateHarvest(selectedHarvest.id, harvestData);
      setShowEditModal(false);
      setSelectedHarvest(null);
      loadHarvests();
    } catch (error) {
      handleError(error, 'Không thể cập nhật mùa vụ');
      throw error;
    }
  };

  const handleDeleteHarvest = async (harvestId: string) => {
    try {
      await deleteHarvest(harvestId);
      loadHarvests(); // Reload danh sách sau khi xóa thành công
    } catch (error) {
      handleError(error, 'Không thể xóa mùa vụ');
    }
  };

  const handleViewGrades = (harvest: Harvest) => {
    router.push({
      pathname: '/pages/farmer/harvestGradeDetail' as any,
      params: {
        harvestId: harvest.id,
        harvestName: `Thu hoạch từ ${new Date(harvest.startDate).toLocaleDateString('vi-VN')}`,
      },
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>Chưa có mùa vụ nào</Text>
      <Text style={styles.emptyStateSubtext}>
        Nhấn nút + để tạo mùa vụ đầu tiên
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Danh sách mùa vụ</Text>
          <Text style={styles.headerSubtitle}>{cropName}</Text>
          {isViewOnly && (
            <View style={styles.viewOnlyBadge}>
              <Text style={styles.viewOnlyBadgeText}>Đang có đấu giá - Chỉ xem</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.addButton, isViewOnly && styles.addButtonDisabled]}
          onPress={() => setShowCreateModal(true)}
          disabled={isViewOnly}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Harvest List */}
      <FlatList
        data={harvests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HarvestCard 
            harvest={item}
            onEdit={() => handleEditHarvest(item)}
            onDelete={() => handleDeleteHarvest(item.id)}
            onViewGrades={() => handleViewGrades(item)}
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

      {/* Create Modal */}
      <CreateHarvestModal
        visible={showCreateModal}
        cropId={cropId}
        cropPlantingDate={cropPlantingDate}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateHarvest}
      />

      {/* Edit Modal */}
      <EditHarvestModal
        visible={showEditModal}
        harvest={selectedHarvest}
        isViewOnly={isViewOnly}
        onClose={() => {
          setShowEditModal(false);
          setSelectedHarvest(null);
        }}
        onSubmit={handleUpdateHarvest}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  viewOnlyBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewOnlyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
    marginTop: 20,
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
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
