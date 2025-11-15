import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { X, Plus, Trash2 } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '../../../../components/shared/Header';
import {
  getCurrentHarvest,
  createAuctionHarvest,
  calculateTotalQuantity,
  CurrentHarvest,
} from '../../../../services/auctionService';
import { getCropsByFarmId } from '../../../../services/cropService';
import { Crop } from '../../../../services/cropService';
import { getCurrentUser } from '../../../../services/authService';

interface SelectedCropHarvest {
  crop: Crop;
  harvest: CurrentHarvest;
  totalQuantity: number;
}

export default function AddAuctionHarvestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auctionSessionId = params.auctionSessionId as string;

  const [selectedCrops, setSelectedCrops] = useState<SelectedCropHarvest[]>([]);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCrops();
  }, []);

  const loadCrops = async () => {
    try {
      setLoadingCrops(true);
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng');
        return;
      }

      // TODO: Get farmId from user or context
      // For now, we need to get the user's farm
      const allCrops = await getCropsByFarmId('user-farm-id');
      setCrops(allCrops);
    } catch (error) {
      console.error('Error loading crops:', error);
      // Show empty list if error
      setCrops([]);
    } finally {
      setLoadingCrops(false);
    }
  };

  const handleSelectCrop = async (crop: Crop) => {
    try {
      setLoading(true);
      const harvest = await getCurrentHarvest(crop.id);
      const totalQuantity = calculateTotalQuantity(harvest.harvestGradeDetailDTOs || []);

      // Check if crop already selected
      const isAlreadySelected = selectedCrops.some((item) => item.crop.id === crop.id);
      if (isAlreadySelected) {
        Alert.alert('Thông báo', 'Crop này đã được chọn');
        return;
      }

      setSelectedCrops([...selectedCrops, { crop, harvest, totalQuantity }]);
      setShowCropModal(false);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải harvest cho crop này');
      console.error('Error loading harvest:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCrop = (cropId: string) => {
    setSelectedCrops(selectedCrops.filter((item) => item.crop.id !== cropId));
  };

  const getTotalExpectedQuantity = () => {
    return selectedCrops.reduce((total, item) => total + item.totalQuantity, 0);
  };

  const handleCreateAuctionHarvests = async () => {
    if (selectedCrops.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 crop');
      return;
    }

    try {
      setLoading(true);
      const totalQuantity = getTotalExpectedQuantity();

      // Create auction harvest for each selected crop
      for (const selectedItem of selectedCrops) {
        await createAuctionHarvest({
          auctionSessionId,
          harvestId: selectedItem.harvest.id,
        });
      }

      Alert.alert('Thành công', `Phiên đấu giá đã được tạo thành công!\nTổng số lượng: ${totalQuantity} kg`, [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to auction management
            router.push('/farmer/auction-management');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tạo phiên đấu giá. Vui lòng thử lại.');
      console.error('Error creating auction harvests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Chọn Sản Phẩm" />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerInfo}>
          <Text style={styles.subtitle}>
            Bước 2: Chọn sản phẩm (Crop) để liên kết với phiên đấu giá
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Chọn Crop */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelWithButton}>
              <Text style={styles.fieldLabel}>Sản phẩm đã chọn ({selectedCrops.length})</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowCropModal(true)}
              >
                <Plus size={18} color="#fff" />
                <Text style={styles.addButtonText}>Thêm</Text>
              </TouchableOpacity>
            </View>

            {/* Selected crops list */}
            {selectedCrops.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>Chưa chọn sản phẩm nào</Text>
                <Text style={styles.emptyStateSubtext}>
                  Bấm nút "Thêm" để chọn sản phẩm
                </Text>
              </View>
            ) : (
              selectedCrops.map((item, index) => (
                <View key={index} style={styles.selectedCropItem}>
                  <View style={styles.selectedCropInfo}>
                    <Text style={styles.selectedCropName}>
                      {item.crop.custardAppleType}
                    </Text>
                    <Text style={styles.selectedCropQuantity}>
                      Số lượng: {item.totalQuantity} kg
                    </Text>
                    <Text style={styles.selectedCropDate}>
                      Trồng từ:{' '}
                      {new Date(item.crop.startPlantingDate).toLocaleDateString(
                        'vi-VN'
                      )}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveCrop(item.crop.id)}>
                    <Trash2 size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Total Quantity (read-only) */}
          {selectedCrops.length > 0 && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Tổng số lượng</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyText}>
                  {getTotalExpectedQuantity()} kg
                </Text>
              </View>
            </View>
          )}

          {/* Nút tạo đấu giá */}
          <TouchableOpacity
            onPress={handleCreateAuctionHarvests}
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            disabled={loading || selectedCrops.length === 0}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Đang tạo...' : 'Tạo Phiên Đấu Giá'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            📝 <Text style={styles.noteTextBold}>Lưu ý:</Text> Bạn có thể chọn nhiều sản
            phẩm trong một phiên đấu giá. Mỗi sản phẩm sẽ có thông tin harvest riêng.
          </Text>
        </View>
      </ScrollView>

      {/* Crop Selection Modal */}
      <Modal visible={showCropModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Sản Phẩm</Text>
              <TouchableOpacity onPress={() => setShowCropModal(false)}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {loadingCrops ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : (
              <FlatList
                data={crops}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.cropItem}
                    onPress={() => handleSelectCrop(item)}
                    disabled={loading}
                  >
                    <View>
                      <Text style={styles.cropItemName}>
                        {item.custardAppleType}
                      </Text>
                      <Text style={styles.cropItemDate}>
                        Trồng từ:{' '}
                        {new Date(item.startPlantingDate).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
                  </View>
                }
              />
            )}
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
  scrollContainer: {
    flex: 1,
    marginTop: 120,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerInfo: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  labelWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  selectedCropItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCropInfo: {
    flex: 1,
  },
  selectedCropName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  selectedCropQuantity: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  selectedCropDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  readOnlyField: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noteContainer: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
  },
  noteText: {
    color: '#1E40AF',
    fontSize: 14,
    lineHeight: 20,
  },
  noteTextBold: {
    fontWeight: '600',
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
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  cropItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cropItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  cropItemDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
