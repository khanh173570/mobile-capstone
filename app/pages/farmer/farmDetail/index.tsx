import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCurrentFarm } from '../../../../services/authService';
import type { Farm } from '../../../../services/farmService';
import { getCropsByFarmId, createCrop, updateCrop, deleteCrop, Crop, CreateCropData, UpdateCropData } from '../../../../services/cropService';
import { 
  ArrowLeft,
  Plus,
  Sprout,
  Calendar,
  MapPin,
  TrendingUp,
  X,
  Activity,
} from 'lucide-react-native';
import CropCard from '../../../../components/farmer/CropCard';
import CreateCropModal from '../../../../components/farmer/CreateCropModal';
import EditCropModal from '../../../../components/farmer/EditCropModal';
import { handleError } from '../../../../utils/errorHandler';

export default function FarmDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmData, setFarmData] = useState<Farm | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);

  const loadData = async () => {
    try {
      const farm = await getCurrentFarm();
      if (farm) {
        setFarmData(farm);
        // Load crops for this farm
        try {
          console.log('Loading crops for farm:', farm.id);
          const cropsData = await getCropsByFarmId(farm.id);
          console.log('Raw crops data:', cropsData);
          // Sort crops by ID to maintain consistent order 
          const sortedCrops = (cropsData || []).sort((a, b) => a.id.localeCompare(b.id));
          console.log('Sorted crops:', sortedCrops);
          setCrops(sortedCrops);
        } catch (cropError) {
          console.error('Error loading crops:', cropError);
          setCrops([]); // Set empty array on error
        }
      }
    } catch (error) {
      console.error('Error loading farm detail:', error);
      const errorMessage = handleError(error, 'Load Farm Detail');
      Alert.alert('Lỗi', errorMessage);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    const loadFarmData = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };

    loadFarmData();
  }, []);

  const handleCreateCrop = async (cropData: CreateCropData) => {
    if (!farmData) return;

    try {
      const newCrop = await createCrop({ ...cropData, farmID: farmData.id });
      Alert.alert('Thành công', 'Tạo vườn mới thành công!');
      setShowCreateModal(false);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error creating crop:', error);
      const errorMessage = handleError(error, 'Create Crop');
      Alert.alert('Lỗi', errorMessage);
    }
  };

  const handleEditCrop = (crop: Crop) => {
    setSelectedCrop(crop);
    setShowEditModal(true);
  };

  const handleUpdateCrop = async (cropData: UpdateCropData) => {
    if (!selectedCrop) return;

    try {
      await updateCrop(selectedCrop.id, cropData);
      Alert.alert('Thành công', 'Cập nhật vườn thành công!');
      setShowEditModal(false);
      setSelectedCrop(null);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error updating crop:', error);
      const errorMessage = handleError(error, 'Update Crop');
      Alert.alert('Lỗi', errorMessage);
    }
  };

  const handleDeleteCrop = (crop: Crop) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa vườn "${crop.custardAppleType || 'mãng cầu'}" không? Hành động này không thể hoàn tác.`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCrop(crop.id);
              Alert.alert('Thành công', 'Đã xóa vườn thành công!');
              await loadData(); // Reload data
            } catch (error) {
              console.error('Error deleting crop:', error);
              const errorMessage = handleError(error, 'Delete Crop');
              Alert.alert('Lỗi', errorMessage);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (!farmData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Không tìm thấy thông tin nông trại</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIconButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết nông trại</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Farm Info Card */}
        <View style={styles.farmCard}>
          <View style={styles.farmHeader}>
            <View style={styles.farmImageContainer}>
              {farmData.farmImage && farmData.farmImage !== 'string' && farmData.farmImage.startsWith('http') ? (
                <Image 
                  source={{ uri: farmData.farmImage }} 
                  style={styles.farmImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.farmImagePlaceholder}>
                  <Sprout size={40} color="#22C55E" />
                </View>
              )}
            </View>
            <View style={styles.farmInfo}>
              <Text style={styles.farmName}>{farmData.name}</Text>
              <View style={styles.farmStatus}>
                <View 
                  style={[
                    styles.statusDot, 
                    { backgroundColor: farmData.isActive ? '#22C55E' : '#F59E0B' }
                  ]} 
                />
                <Text style={styles.statusText}>
                  {farmData.isActive ? 'Đang hoạt động' : 'Chưa kích hoạt'}
                </Text>
              </View>
              <View style={styles.farmDateRow}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.farmDate}>
                  {new Date(farmData.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Crops Section */}
        <View style={styles.cropsSection}>
          <View style={styles.cropsSectionHeader}>
            <Text style={styles.sectionTitle}>Danh sách vườn</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.createButtonText}>Tạo vườn</Text>
            </TouchableOpacity>
          </View>

          {crops.length === 0 ? (
            <View style={styles.emptyState}>
              <Sprout size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>Chưa có vườn nào</Text>
              <Text style={styles.emptyStateSubtext}>
                Nhấn vào nút "Tạo vườn" bên trên để bắt đầu quản lý vườn mãng cầu của bạn
              </Text>
            </View>
          ) : (
            <View style={styles.cropsList}>
              {crops.map((crop, index) => (
                <CropCard 
                  key={crop.id} 
                  crop={crop}
                  cropIndex={index}
                  onEdit={() => handleEditCrop(crop)}
                  onDelete={() => handleDeleteCrop(crop)}
                  onCreateHarvest={() => {
                    console.log('=== Navigate to Harvest List ===');
                    console.log('Crop ID:', crop.id);
                    console.log('Crop custardAppleType:', crop.custardAppleType);
                    
                    try {
                      // Using relative path with query params
                      const path = `/pages/farmer/harvestList?cropId=${crop.id}&cropName=${encodeURIComponent(crop.custardAppleType || 'Vườn mãng cầu')}&cropPlantingDate=${encodeURIComponent(crop.startPlantingDate)}`;
                      console.log('Navigation path:', path);
                      router.push(path as any);
                      console.log('Navigation called successfully');
                    } catch (error) {
                      console.error('Navigation error:', error);
                    }
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Crop Modal */}
      <CreateCropModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCrop}
      />

      {/* Edit Crop Modal */}
      <EditCropModal
        visible={showEditModal}
        crop={selectedCrop}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCrop(null);
        }}
        onSubmit={handleUpdateCrop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#22C55E',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#22C55E',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  farmCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  farmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmImageContainer: {
    marginRight: 16,
  },
  farmImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  farmImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  farmStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
  },
  farmDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  farmDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  cropsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cropsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  cropsList: {
    gap: 12,
  },
});
