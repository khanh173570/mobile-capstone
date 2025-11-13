import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { Calendar, DollarSign, ChevronDown, X, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../../../../components/shared/Header';
import { 
  createAuctionSession,
  createAuctionHarvest,
  getCurrentHarvest,
  calculateTotalQuantity,
  CreateAuctionData,
  CurrentHarvest,
} from '../../../../services/auctionService';
import { getCropsByFarmId } from '../../../../services/cropService';
import { Crop } from '../../../../services/cropService';
import { getCurrentUser, getCurrentFarm } from '../../../../services/authService';

interface SelectedCropHarvest {
  crop: Crop;
  harvest: CurrentHarvest;
  totalQuantity: number;
}

export default function CreateAuctionScreen() {
  const router = useRouter();
  const [auctionData, setAuctionData] = useState({
    publishDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startingPrice: '',
    minBidIncrement: '',
    note: '',
  });

  const [selectedCrops, setSelectedCrops] = useState<SelectedCropHarvest[]>([]);
  const [enableBuyNow, setEnableBuyNow] = useState(false);
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [enableAntiSniping, setEnableAntiSniping] = useState(false);
  const [antiSnipingSeconds, setAntiSnipingSeconds] = useState('120');
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Date picker states
  const [showPublishDatePicker, setShowPublishDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showExpectedHarvestPicker, setShowExpectedHarvestPicker] = useState(false);

  // Crop selection modal states
  const [showCropModal, setShowCropModal] = useState(false);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [farmId, setFarmId] = useState('');

  useEffect(() => {
    loadFarmAndCrops();
  }, []);

  const loadFarmAndCrops = async () => {
    try {
      const farm = await getCurrentFarm();
      if (!farm) {
        Alert.alert('Lỗi', 'Không thể lấy thông tin trang trại');
        return;
      }
      setFarmId(farm.id);
    } catch (error) {
      console.error('Error loading farm:', error);
      Alert.alert('Lỗi', 'Lỗi khi tải thông tin trang trại');
    }
  };

  const loadCrops = async () => {
    try {
      setLoadingCrops(true);
      if (!farmId) {
        Alert.alert('Lỗi', 'Chưa lấy được thông tin trang trại');
        return;
      }
      const allCrops = await getCropsByFarmId(farmId);
      setCrops(allCrops);
    } catch (error) {
      console.error('Error loading crops:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách sản phẩm');
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

  const validateForm = (): boolean => {
    if (selectedCrops.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 crop');
      return false;
    }

    if (!auctionData.endDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày kết thúc');
      return false;
    }

    if (!auctionData.startingPrice || parseFloat(auctionData.startingPrice) <= 1000) {
      Alert.alert('Lỗi', 'Giá khởi điểm phải lớn hơn 1000');
      return false;
    }

    if (!auctionData.minBidIncrement || parseFloat(auctionData.minBidIncrement) <= 1000) {
      Alert.alert('Lỗi', 'Mức tăng giá tối thiểu phải lớn hơn 1000');
      return false;
    }

    if (enableBuyNow && (!buyNowPrice || parseFloat(buyNowPrice) <= parseFloat(auctionData.startingPrice))) {
      Alert.alert('Lỗi', 'Giá mua ngay phải lớn hơn giá khởi điểm');
      return false;
    }

    if (!expectedHarvestDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày thu hoạch dự kiến');
      return false;
    }

    // Check expectedHarvestDate is at least 10 days after endDate
    const endDate = new Date(auctionData.endDate);
    const expectedDate = new Date(expectedHarvestDate);
    const diffDays = (expectedDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 10) {
      Alert.alert('Lỗi', 'Ngày thu hoạch dự kiến phải sau ngày kết thúc ít nhất 10 ngày');
      return false;
    }

    return true;
  };

  // Handle End Date Change
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setAuctionData({ ...auctionData, endDate: dateString });
    }
  };

  // Handle Expected Harvest Date Change
  const handleExpectedHarvestDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowExpectedHarvestPicker(false);
    }
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setExpectedHarvestDate(dateString);
    }
  };

  // Handle Publish Date Change
  const handlePublishDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPublishDatePicker(false);
    } 
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setAuctionData({ ...auctionData, publishDate: dateString });
    }
  };

  const handleCreateAuctionInfo = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Get current user to get farmerId
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng');
        return;
      }

      // Create auction session
      const auctionSessionData: CreateAuctionData = {
        publishDate: new Date(auctionData.publishDate).toISOString(),
        endDate: new Date(auctionData.endDate).toISOString(),
        farmerId: user.id,
        startingPrice: parseFloat(auctionData.startingPrice),
        minBidIncrement: parseFloat(auctionData.minBidIncrement),
        enableBuyNow,
        buyNowPrice: enableBuyNow ? parseFloat(buyNowPrice) : null,
        enableAntiSniping,
        antiSnipingExtensionSeconds: enableAntiSniping ? parseInt(antiSnipingSeconds) : null,
        enableReserveProxy: true,
        note: auctionData.note,
        expectedHarvestDate: new Date(expectedHarvestDate).toISOString(),
        expectedTotalQuantity: getTotalExpectedQuantity(), // Calculate from selected crops
      };

      const auctionSession = await createAuctionSession(auctionSessionData);

      // Create auction harvest for each selected crop
      for (const selectedItem of selectedCrops) {
        await createAuctionHarvest({
          auctionSessionId: auctionSession.id,
          harvestId: selectedItem.harvest.id,
        });
      }

      Alert.alert('Thành công', `Phiên đấu giá đã được tạo!\nTổng số lượng: ${getTotalExpectedQuantity()} kg`, [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setAuctionData({
              publishDate: new Date().toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0],
              startingPrice: '',
              minBidIncrement: '',
              note: '',
            });
            setSelectedCrops([]);
            setEnableBuyNow(false);
            setBuyNowPrice('');
            setEnableAntiSniping(false);
            setAntiSnipingSeconds('120');
            setExpectedHarvestDate('');
            // Navigate to auction management
            router.push('/farmer/auction-management');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tạo phiên đấu giá. Vui lòng thử lại.');
      console.error('Error creating auction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Tạo Phiên Đấu Giá" />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerInfo}>
          <Text style={styles.subtitle}>
            Nhập thông tin phiên đấu giá và chọn sản phẩm
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Chọn Crop */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelWithButton}>
              <Text style={styles.fieldLabel}>Chọn sản phẩm (Crop) *</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  loadCrops();
                  setShowCropModal(true);
                }}
              >
                <Plus size={18} color="#fff" />
                <Text style={styles.addButtonText}>Thêm</Text>
              </TouchableOpacity>
            </View>

            {selectedCrops.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>Chưa chọn sản phẩm nào</Text>
              </View>
            ) : (
              selectedCrops.map((item, index) => (
                <View key={index} style={styles.selectedCropItem}>
                  <View style={styles.selectedCropInfo}>
                    <Text style={styles.selectedCropName}>{item.crop.custardAppleType}</Text>
                    <Text style={styles.selectedCropQuantity}>
                      Số lượng: {item.totalQuantity} kg
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveCrop(item.crop.id)}>
                    <X size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {selectedCrops.length > 0 && (
              <View style={styles.totalQuantityContainer}>
                <Text style={styles.totalQuantityLabel}>Tổng số lượng dự kiến:</Text>
                <Text style={styles.totalQuantityValue}>{getTotalExpectedQuantity()} kg</Text>
              </View>
            )}
          </View>
          {/* Publish Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Ngày công bố *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPublishDatePicker(true)}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {auctionData.publishDate || 'Chọn ngày công bố'}
              </Text>
            </TouchableOpacity>
            {showPublishDatePicker && (
              <DateTimePicker
                value={auctionData.publishDate ? new Date(auctionData.publishDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handlePublishDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* End Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Ngày kết thúc *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {auctionData.endDate || 'Chọn ngày kết thúc'}
              </Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={auctionData.endDate ? new Date(auctionData.endDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Starting Price */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Giá khởi điểm ({'{>'}1000) *</Text>
            <View style={styles.priceInputContainer}>
              <DollarSign size={20} color="#6B7280" style={styles.priceIcon} />
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                value={auctionData.startingPrice}
                onChangeText={(text) =>
                  setAuctionData({ ...auctionData, startingPrice: text })
                }
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Min Bid Increment */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Mức tăng ({'{>'}1000) *</Text>
            <View style={styles.priceInputContainer}>
              <DollarSign size={20} color="#6B7280" style={styles.priceIcon} />
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                value={auctionData.minBidIncrement}
                onChangeText={(text) =>
                  setAuctionData({ ...auctionData, minBidIncrement: text })
                }
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Enable Buy Now */}
          <View style={styles.toggleContainer}>
            <View>
              <Text style={styles.fieldLabel}>Cho phép mua ngay</Text>
              <Text style={styles.toggleDescription}>Khách hàng có thể mua sản phẩm ngay</Text>
            </View>
            <Switch
              value={enableBuyNow}
              onValueChange={setEnableBuyNow}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={enableBuyNow ? '#22C55E' : '#fff'}
            />
          </View>

          {/* Buy Now Price (conditional) */}
          {enableBuyNow && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Giá mua ngay *</Text>
              <View style={styles.priceInputContainer}>
                <DollarSign size={20} color="#6B7280" style={styles.priceIcon} />
                <TextInput
                  style={styles.priceInput}
                  placeholder="0"
                  value={buyNowPrice}
                  onChangeText={setBuyNowPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Enable Anti Sniping */}
          <View style={styles.toggleContainer}>
            <View>
              <Text style={styles.fieldLabel}>Bảo vệ chống sniping</Text>
              <Text style={styles.toggleDescription}>Tự động gia hạn khi có bid cuối cùng</Text>
            </View>
            <Switch
              value={enableAntiSniping}
              onValueChange={setEnableAntiSniping}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={enableAntiSniping ? '#22C55E' : '#fff'}
            />
          </View>

          {/* Anti Sniping Extension Seconds (conditional) */}
          {enableAntiSniping && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Thời gian gia hạn (giây) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="120"
                value={antiSnipingSeconds}
                onChangeText={setAntiSnipingSeconds}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Expected Harvest Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Ngày thu hoạch dự kiến (+10 ngày) *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowExpectedHarvestPicker(true)}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {expectedHarvestDate || 'Chọn ngày thu hoạch dự kiến'}
              </Text>
            </TouchableOpacity>
            {showExpectedHarvestPicker && (
              <DateTimePicker
                value={expectedHarvestDate ? new Date(expectedHarvestDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleExpectedHarvestDateChange}
                minimumDate={auctionData.endDate ? new Date(new Date(auctionData.endDate).getTime() + 10 * 24 * 60 * 60 * 1000) : new Date()}
              />
            )}
          </View>

          {/* Note */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Ghi chú</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Ghi chú thêm về phiên đấu giá..."
              value={auctionData.note}
              onChangeText={(text) =>
                setAuctionData({ ...auctionData, note: text })
              }
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Nút tạo thông tin đấu giá */}
          <TouchableOpacity
            onPress={handleCreateAuctionInfo}
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
            📝 <Text style={styles.noteTextBold}>Lưu ý:</Text> Chọn ít nhất 1 sản phẩm để tạo phiên đấu giá. 
            Tổng số lượng sẽ được tính tự động từ harvest grade details.
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
                      <Text style={styles.cropItemName}>{item.custardAppleType}</Text>
                      <Text style={styles.cropItemDate}>
                        Trồng từ: {new Date(item.startPlantingDate).toLocaleDateString('vi-VN')}
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
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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
    marginBottom: 8,
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
  totalQuantityContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalQuantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  totalQuantityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 96,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  priceIcon: {
    marginLeft: 12,
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  toggleContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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