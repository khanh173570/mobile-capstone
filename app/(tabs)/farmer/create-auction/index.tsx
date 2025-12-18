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
import { Calendar, DollarSign, ChevronDown, X, Plus, Clock, Filter, Package, Check } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../../../../components/shared/Header';
import { 
  createAuctionSession,
  createAuctionHarvest,
  getCurrentHarvest,
  calculateTotalQuantity,
  CreateAuctionData,
  CurrentHarvest,
  getFarmerAuctions,
  FarmerAuction,
  filterAuctionsByStatus,
  translateErrorMessage,
} from '../../../../services/auctionService';
import { getCropsByFarmId } from '../../../../services/cropService';
import { Crop } from '../../../../services/cropService';
import { getCurrentUser, getCurrentFarm } from '../../../../services/authService';
import { getFarmerBuyRequests, BuyRequest } from '../../../../services/farmerBuyRequestService';
import AuctionCard from '../../../../components/farmer/AuctionCard';

interface SelectedCropHarvest {
  crop: Crop;
  harvest: CurrentHarvest;
  totalQuantity: number;
}

export default function CreateAuctionScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'review'>('create');
  const [showStatusFilterModal, setShowStatusFilterModal] = useState(false);
  const [showAllStatusesModal, setShowAllStatusesModal] = useState(false);
  
  const [auctionData, setAuctionData] = useState({
    publishDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    startingPrice: '',
    minBidIncrement: '',
    note: '',
  });

  const [selectedCrops, setSelectedCrops] = useState<SelectedCropHarvest[]>([]);
  const [enableBuyNow, setEnableBuyNow] = useState(false);
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [enableAntiSniping, setEnableAntiSniping] = useState(false);
  const [antiSnipingMinutes, setAntiSnipingMinutes] = useState('2'); // UI displays minutes, send as seconds
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Date picker states
  const [showPublishDatePicker, setShowPublishDatePicker] = useState(false);
  const [showPublishTimePicker, setShowPublishTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showExpectedHarvestPicker, setShowExpectedHarvestPicker] = useState(false);

  // Crop selection modal states
  const [showCropModal, setShowCropModal] = useState(false);

  // Price suggestion states
  const [showStartingPriceSuggestions, setShowStartingPriceSuggestions] = useState(false);
  const [showMinBidSuggestions, setShowMinBidSuggestions] = useState(false);
  const [showAntiSnipingSuggestions, setShowAntiSnipingSuggestions] = useState(false);
  const [showBuyNowPriceSuggestions, setShowBuyNowPriceSuggestions] = useState(false);
  
  // Error states for real-time validation
  const [startingPriceError, setStartingPriceError] = useState('');
  const [minBidIncrementError, setMinBidIncrementError] = useState('');
  const [buyNowPriceError, setBuyNowPriceError] = useState('');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [farmId, setFarmId] = useState('');

  // Review tab states
  const [userId, setUserId] = useState('');
  const [auctions, setAuctions] = useState<FarmerAuction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<FarmerAuction[]>([]);
  const [auctionLoading, setAuctionLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
  const [buyRequestsLoading, setBuyRequestsLoading] = useState(false);

  useEffect(() => {
    loadFarmAndCrops();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (activeTab === 'review') {
        loadReviewData();
      }
    }, [activeTab])
  );

  const loadReviewData = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);
        // Load auctions
        setAuctionLoading(true);
        try {
          const farmerAuctions = await getFarmerAuctions();
          setAuctions(farmerAuctions);
          setFilteredAuctions(farmerAuctions);
        } catch (auctionError) {
          console.error('Error loading auctions:', auctionError);
          // Gracefully set empty array if auction loading fails
          setAuctions([]);
          setFilteredAuctions([]);
        } finally {
          setAuctionLoading(false);
        }

        // Load buy requests
        setBuyRequestsLoading(true);
        try {
          const requests = await getFarmerBuyRequests(user.id);
          setBuyRequests(requests);
        } catch (requestError) {
          console.error('Error loading buy requests:', requestError);
          // Gracefully set empty array if buy request loading fails
          setBuyRequests([]);
        } finally {
          setBuyRequestsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error loading review data:', error);
      setAuctionLoading(false);
      setBuyRequestsLoading(false);
    }
  };

  const handleStatusFilterChange = (status: string) => {
    setSelectedStatus(status);
    if (status === 'All') {
      setFilteredAuctions(auctions);
    } else {
      setFilteredAuctions(filterAuctionsByStatus(auctions, status));
    }
    setShowStatusFilter(false);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Draft':
        return '#9CA3AF';
      case 'Pending':
        return '#F59E0B';
      case 'Rejected':
        return '#EF4444';
      case 'Approved':
        return '#10B981';
      case 'OnGoing':
        return '#22C55E';
      case 'Completed':
        return '#3B82F6';
      case 'NoWinner':
        return '#A16207';
      case 'Cancelled':
        return '#6B7280';
      case 'Pause':
        return '#DC2626';
      case 'All':
        return '#6B7280';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'Pending':
        return 'Chờ xử lý';
      case 'Accepted':
        return 'Chấp nhận';
      case 'Rejected':
        return 'Từ chối';
      case 'Completed':
        return 'Hoàn thành';
      case 'Canceled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

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
      // Filter out crops with OpenForBidding status (2)
      // Only show crops that can create auction
      const eligibleCrops = allCrops.filter(crop => crop.status !== 2);
      setCrops(eligibleCrops);
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

      // Check if crop status is OpenForBidding (2)
      if (crop.status === 2) {
        Alert.alert(
          'Không thể tạo đấu giá',
          `Vườn "${crop.name}" đang ở trạng thái "Đang trên sàn đấu giá".\n\nMỗi vườn chỉ được tạo 1 đấu giá. Vườn này đã có đấu giá rồi.`,
          [{ text: 'Đóng' }]
        );
        return;
      }

      let harvest;
      try {
        harvest = await getCurrentHarvest(crop.id);
      } catch (error) {
        // No current harvest exists (expected error)
        // Don't log this as it's a normal validation flow
        Alert.alert(
          'Yêu cầu tạo vụ thu hoạch',
          `Vườn "${crop.name}" chưa có vụ thu hoạch.\n\nVui lòng tạo vụ thu hoạch (harvest) trước khi tạo đấu giá.`,
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
      
      // Check if harvest exists and has grade details
      if (!harvest || !harvest.harvestGradeDetailDTOs || harvest.harvestGradeDetailDTOs.length === 0) {
        Alert.alert(
          'Yêu cầu hoàn thiện phân loại',
          `Vườn "${crop.name}" đã có vụ thu hoạch nhưng chưa có chi tiết phân loại đánh giá (harvest grade details).\n\nVui lòng tạo chi tiết phân loại trước khi tạo đấu giá.`,
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      const totalQuantity = calculateTotalQuantity(harvest.harvestGradeDetailDTOs || []);

      // Check if crop already selected
      const isAlreadySelected = selectedCrops.some((item) => item.crop.id === crop.id);
      if (isAlreadySelected) {
        Alert.alert('Thông báo', 'Vườn này đã được chọn');
        setLoading(false);
        return;
      }

      setSelectedCrops([...selectedCrops, { crop, harvest, totalQuantity }]);
      Alert.alert('Thành công', `Đã thêm vườn "${crop.name}" vào danh sách`);
      setLoading(false);
    } catch (error) {
      // Only log unexpected errors
      console.error('Unexpected error in handleSelectCrop:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const handleRemoveCrop = (cropId: string) => {
    setSelectedCrops(selectedCrops.filter((item) => item.crop.id !== cropId));
  };

  const getTotalExpectedQuantity = () => {
    return selectedCrops.reduce((total, item) => total + item.totalQuantity, 0);
  };

  // Real-time validation for starting price
  const validateStartingPrice = (value: string) => {
    const price = parseFloat(value);
    if (isNaN(price) || price < 1000000) {
      setStartingPriceError('Giá khởi điểm phải từ 1.000.000 VND trở lên');
    } else {
      setStartingPriceError('');
    }
  };

  // Real-time validation for min bid increment
  const validateMinBidIncrement = (value: string) => {
    const increment = parseFloat(value);
    if (isNaN(increment) || increment < 1000) {
      setMinBidIncrementError('Mức tăng phải từ 1.000 VND trở lên');
    } else {
      setMinBidIncrementError('');
    }
  };

  // Real-time validation for buy now price
  const validateBuyNowPrice = (value: string) => {
    const buyNow = parseFloat(value);
    const starting = parseFloat(auctionData.startingPrice);
    if (isNaN(buyNow)) {
      setBuyNowPriceError('Vui lòng nhập giá mua ngay hợp lệ');
    } else if (buyNow <= starting) {
      setBuyNowPriceError('Giá mua ngay phải lớn hơn giá khởi điểm');
    } else {
      setBuyNowPriceError('');
    }
  };

  const validateForm = (): boolean => {
    if (selectedCrops.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 vườn');
      return false;
    }

    // Validate all selected crops have grade details
    const cropsWithoutGradeDetails = selectedCrops.filter(
      item => !item.harvest.harvestGradeDetailDTOs || item.harvest.harvestGradeDetailDTOs.length === 0
    );

    if (cropsWithoutGradeDetails.length > 0) {
      const cropNames = cropsWithoutGradeDetails.map(item => `"${item.crop.name}"`).join(', ');
      Alert.alert(
        'Lỗi',
        `Các vườn sau chưa có chi tiết phân loại đánh giá: ${cropNames}\n\nVui lòng hoàn thiện chi tiết phân loại trước khi tạo đấu giá.`
      );
      return false;
    }

    // Validate publish date is at least 5 minutes from now
    const now = new Date();
    const publishDate = new Date(auctionData.publishDate);
    const diffMinutesFromNow = (publishDate.getTime() - now.getTime()) / (1000 * 60);
    if (diffMinutesFromNow < 5) {
      Alert.alert('Lỗi', 'Ngày công bố phải sau thời điểm hiện tại ít nhất 5 phút');
      return false;
    }

    if (!auctionData.endDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày và giờ kết thúc');
      return false;
    }

    // Validate endDate is at least 5 minutes after publishDate
    const endDate = new Date(auctionData.endDate);
    const diffMinutes = (endDate.getTime() - publishDate.getTime()) / (1000 * 60);
    if (diffMinutes < 5) {
      Alert.alert('Lỗi', 'Ngày kết thúc phải sau ngày công bố ít nhất 5 phút');
      return false;
    }

    if (!auctionData.startingPrice || parseFloat(auctionData.startingPrice) < 1000000) {
      Alert.alert('Lỗi', 'Giá khởi điểm phải từ 1.000.000 VND trở lên');
      return false;
    }

    if (!auctionData.minBidIncrement || parseFloat(auctionData.minBidIncrement) < 1000) {
      Alert.alert('Lỗi', 'Mức tăng giá tối thiểu phải từ 1.000 VND trở lên');
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

    // Check expectedHarvestDate is at least 3 days after endDate
    const expectedDate = new Date(expectedHarvestDate);
    const diffDays = (expectedDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 3) {
      Alert.alert('Lỗi', 'Ngày thu hoạch dự kiến phải sau ngày kết thúc ít nhất 3 ngày');
      return false;
    }

    return true;
  };

  // Handle Publish Date Change
  const handlePublishDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPublishDatePicker(false);
    } 
    if (selectedDate) {
      const currentDateTime = new Date(auctionData.publishDate);
      selectedDate.setHours(currentDateTime.getHours());
      selectedDate.setMinutes(currentDateTime.getMinutes());
      setAuctionData({ ...auctionData, publishDate: selectedDate.toISOString() });
    }
  };

  // Handle Publish Time Change
  const handlePublishTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowPublishTimePicker(false);
    }
    if (selectedTime) {
      const currentDateTime = new Date(auctionData.publishDate);
      currentDateTime.setHours(selectedTime.getHours());
      currentDateTime.setMinutes(selectedTime.getMinutes());
      setAuctionData({ ...auctionData, publishDate: currentDateTime.toISOString() });
    }
  };

  // Handle End Date Change
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      const currentDateTime = new Date(auctionData.endDate);
      selectedDate.setHours(currentDateTime.getHours());
      selectedDate.setMinutes(currentDateTime.getMinutes());
      setAuctionData({ ...auctionData, endDate: selectedDate.toISOString() });
    }
  };

  // Handle End Time Change
  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (selectedTime) {
      const currentDateTime = new Date(auctionData.endDate);
      currentDateTime.setHours(selectedTime.getHours());
      currentDateTime.setMinutes(selectedTime.getMinutes());
      setAuctionData({ ...auctionData, endDate: currentDateTime.toISOString() });
    }
  };

  // Handle Expected Harvest Date Change (only date, no time)
  const handleExpectedHarvestDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowExpectedHarvestPicker(false);
    }
    if (selectedDate) {
      // Set time to start of day (00:00:00)
      selectedDate.setHours(0, 0, 0, 0);
      setExpectedHarvestDate(selectedDate.toISOString());
    }
  };

  const createAuctionWithStatus = async (status: 'Draft' | 'Pending') => {
    if (!validateForm()) return;

    try {
      setShowLoadingModal(true);
      setLoadingMessage(status === 'Draft' ? 'Đang lưu bản nháp...' : 'Đang tạo đấu giá...');

      // Get current user to get farmerId
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng');
        setShowLoadingModal(false);
        return;
      }

      // Create auction session
      const auctionSessionData: CreateAuctionData = {
        publishDate: auctionData.publishDate,
        endDate: auctionData.endDate,
        farmerId: user.id,
        startingPrice: parseFloat(auctionData.startingPrice),
        minBidIncrement: parseFloat(auctionData.minBidIncrement),
        enableBuyNow,
        buyNowPrice: enableBuyNow ? parseFloat(buyNowPrice) : null,
        enableAntiSniping,
        antiSnipingExtensionSeconds: enableAntiSniping ? parseInt(antiSnipingMinutes) * 60 : null, // Convert minutes to seconds
        enableReserveProxy: true,
        status: status === 'Draft' ? 0 : 1, // 0 = Draft, 1 = Pending
        note: auctionData.note,
        expectedHarvestDate: new Date(expectedHarvestDate).toISOString(),
        expectedTotalQuantity: getTotalExpectedQuantity(),
      };

      console.log('Creating auction with data:', JSON.stringify(auctionSessionData, null, 2));

      const auctionSession = await createAuctionSession(auctionSessionData);

      // Create auction harvest for each selected crop
      for (const selectedItem of selectedCrops) {
        await createAuctionHarvest({
          auctionSessionId: auctionSession.id,
          harvestId: selectedItem.harvest.id,
        });
      }

      const successMessage = status === 'Draft'
        ? `Bản nháp đấu giá đã được lưu thành công!\nTổng số lượng: ${getTotalExpectedQuantity()} kg`
        : `Phiên đấu giá đã được tạo thành công!\nTổng số lượng: ${getTotalExpectedQuantity()} kg`;

      Alert.alert('Thành công', successMessage, [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setAuctionData({
              publishDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              startingPrice: '',
              minBidIncrement: '',
              note: '',
            });
            setSelectedCrops([]);
            setEnableBuyNow(false);
            setBuyNowPrice('');
            setEnableAntiSniping(false);
            setAntiSnipingMinutes('2');
            setExpectedHarvestDate('');
            // Navigate to auction management
            // @ts-ignore
            router.push('/farmer/buy-request-management');
          },
        },
      ]);
    } catch (error: any) {
      setShowLoadingModal(false);
      
      const errorMessage = status === 'Draft'
        ? 'Không thể lưu bản nháp. Vui lòng thử lại.'
        : 'Không thể tạo phiên đấu giá. Vui lòng thử lại.';
      
      let displayMessage = errorMessage;
      
      console.log('Full error:', error);
      console.log('Error.response:', error?.response);
      console.log('Error.response.data:', error?.response?.data);
      
      // Check if error has response data (from auctionService)
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorText = error.response.data.errors[0];
        if (errorText && typeof errorText === 'string') {
          const translatedError = translateErrorMessage(errorText);
          if (translatedError.toLowerCase().includes('ví không đủ tiền')) {
            displayMessage = `❌ Ví không đủ tiền!\n\n${translatedError}\n\nVui lòng nạp tiền vào ví để tạo đấu giá.`;
          } else {
            displayMessage = translatedError;
          }
        }
      } 
      // Check if it's a plain error message
      else if (error?.message && typeof error.message === 'string') {
        displayMessage = translateErrorMessage(error.message);
      }
      
      console.log('Final display message:', displayMessage);
      
      Alert.alert('Lỗi', displayMessage);
      // console.error('Error creating auction:', error);
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handleCreateDraft = () => createAuctionWithStatus('Draft');
  const handleCreatePending = () => {
    Alert.alert(
      'Xác nhận tạo đấu giá',
      `Bạn chắc chắn muốn tạo phiên đấu giá với:\n• Số vườn: ${selectedCrops.length}\n• Tổng số lượng: ${getTotalExpectedQuantity()} kg\n\n⚠️ Phí tạo đấu giá: 1.000.000 VND\n\nHành động này không thể hoàn tác?`,
      [
        {
          text: 'Hủy',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Tạo đấu giá',
          onPress: () => createAuctionWithStatus('Pending'),
          style: 'default',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* <Header title="Tạo Đấu Giá" /> */}
      
      {activeTab === 'create' && (
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.headerInfo}>
          <Text style={styles.subtitle}>
        Vui lòng nhập thông tin phiên đấu giá 
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Chọn Crop */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelWithButton}>
              <Text style={styles.fieldLabel}>1. Vui lòng chọn vườn *</Text>
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
                <Text style={styles.emptyStateText}>Chưa chọn mảnh vườn</Text>
              </View>
            ) : (
              selectedCrops.map((item, index) => (
                <View key={index} style={styles.selectedCropItem}>
                  <View style={styles.selectedCropInfo}>
                    <Text style={styles.selectedCropName}>{item.crop.name}</Text>
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
          {/* Publish Date & Time */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>2. Ngày công bố *</Text>
            <Text style={styles.fieldNote}>(Phải sau thời điểm hiện tại ít nhất 5 phút)</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[styles.dateButton, { flex: 1 }]}
                onPress={() => setShowPublishDatePicker(true)}
              >
                <Calendar size={20} color="#6B7280" />
                <Text style={styles.dateButtonText}>
                  {auctionData.publishDate ? new Date(auctionData.publishDate).toLocaleDateString('vi-VN') : 'Chọn ngày'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateButton, { flex: 0.8, marginLeft: 8 }]}
                onPress={() => setShowPublishTimePicker(true)}
              >
                <Clock size={20} color="#6B7280" />
                <Text style={styles.dateButtonText}>
                  {auctionData.publishDate ? new Date(auctionData.publishDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Giờ'}
                </Text>
              </TouchableOpacity>
            </View>
            {showPublishDatePicker && (
              <DateTimePicker
                value={auctionData.publishDate ? new Date(auctionData.publishDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handlePublishDateChange}
                minimumDate={new Date()}
              />
            )}
            {showPublishTimePicker && (
              <DateTimePicker
                value={auctionData.publishDate ? new Date(auctionData.publishDate) : new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handlePublishTimeChange}
              />
            )}
          </View>

          {/* End Date & Time */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>3. Ngày kết thúc *</Text>
            <Text style={styles.fieldNote}>(Phải sau ngày công bố ít nhất 5 phút)</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[styles.dateButton, { flex: 1 }]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Calendar size={20} color="#6B7280" />
                <Text style={styles.dateButtonText}>
                  {auctionData.endDate ? new Date(auctionData.endDate).toLocaleDateString('vi-VN') : 'Chọn ngày'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateButton, { flex: 0.8, marginLeft: 8 }]}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Clock size={20} color="#6B7280" />
                <Text style={styles.dateButtonText}>
                  {auctionData.endDate ? new Date(auctionData.endDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Giờ'}
                </Text>
              </TouchableOpacity>
            </View>
            {showEndDatePicker && (
              <DateTimePicker
                value={auctionData.endDate ? new Date(auctionData.endDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndDateChange}
                minimumDate={auctionData.publishDate ? new Date(auctionData.publishDate) : new Date()}
              />
            )}
            {showEndTimePicker && (
              <DateTimePicker
                value={auctionData.endDate ? new Date(auctionData.endDate) : new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndTimeChange}
              />
            )}
          </View>

          {/* Starting Price */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>4. Giá khởi điểm (≥ 1.000.000) *</Text>
            <View style={[styles.priceInputContainer, startingPriceError && { borderColor: '#EF4444', borderWidth: 1 }]}>
              <Text style={styles.priceLabel}>VND</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                value={auctionData.startingPrice}
                onChangeText={(text) => {
                  setAuctionData({ ...auctionData, startingPrice: text });
                  validateStartingPrice(text);
                }}
                onFocus={() => setShowStartingPriceSuggestions(true)}
                keyboardType="numeric"
              />
            </View>
            {startingPriceError && <Text style={styles.errorText}>{startingPriceError}</Text>}
            {showStartingPriceSuggestions && (
              <View style={styles.suggestionsContainer}>
                <View style={styles.suggestionsRow}>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => {
                      setAuctionData({ ...auctionData, startingPrice: '1000000' });
                      setStartingPriceError('');
                      setShowStartingPriceSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionButtonText}>1.000.000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => {
                      setAuctionData({ ...auctionData, startingPrice: '1500000' });
                      setStartingPriceError('');
                      setShowStartingPriceSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionButtonText}>1.500.000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => {
                      setAuctionData({ ...auctionData, startingPrice: '2000000' });
                      setStartingPriceError('');
                      setShowStartingPriceSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionButtonText}>2.000.000</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.suggestionsRow}>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => {
                      setAuctionData({ ...auctionData, startingPrice: '3000000' });
                      setStartingPriceError('');
                      setShowStartingPriceSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionButtonText}>3.000.000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => {
                      setAuctionData({ ...auctionData, startingPrice: '5000000' });
                      setStartingPriceError('');
                      setShowStartingPriceSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionButtonText}>5.000.000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => {
                      setAuctionData({ ...auctionData, startingPrice: '9000000' });
                      setStartingPriceError('');
                      setShowStartingPriceSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionButtonText}>9.000.000</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Min Bid Increment */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>5. Mức tăng (≥ 1.000) *</Text>
            <View style={[styles.priceInputContainer, minBidIncrementError && { borderColor: '#EF4444', borderWidth: 1 }]}>
              <Text style={styles.priceLabel}>VND</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                value={auctionData.minBidIncrement}
                onChangeText={(text) => {
                  setAuctionData({ ...auctionData, minBidIncrement: text });
                  validateMinBidIncrement(text);
                }}
                onFocus={() => setShowMinBidSuggestions(true)}
                keyboardType="numeric"
              />
            </View>
            {minBidIncrementError && <Text style={styles.errorText}>{minBidIncrementError}</Text>}
            {showMinBidSuggestions && (
              <View style={styles.suggestionsContainer}>
                <View style={styles.suggestionsRow}>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => {
                      setAuctionData({ ...auctionData, minBidIncrement: '10000' });
                      setMinBidIncrementError('');
                      setShowMinBidSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionButtonText}>10.000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => {
                      setAuctionData({ ...auctionData, minBidIncrement: '50000' });
                      setMinBidIncrementError('');
                      setShowMinBidSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionButtonText}>50.000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => {
                      setAuctionData({ ...auctionData, minBidIncrement: '100000' });
                      setMinBidIncrementError('');
                      setShowMinBidSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionButtonText}>100.000</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.suggestionsRow}>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => {
                      setAuctionData({ ...auctionData, minBidIncrement: '150000' });
                      setMinBidIncrementError('');
                      setShowMinBidSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionButtonText}>150.000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => {
                      setAuctionData({ ...auctionData, minBidIncrement: '200000' });
                      setMinBidIncrementError('');
                      setShowMinBidSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionButtonText}>200.000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => {
                      setAuctionData({ ...auctionData, minBidIncrement: '250000' });
                      setMinBidIncrementError('');
                      setShowMinBidSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionButtonText}>250.000</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
              <View style={[styles.priceInputContainer, buyNowPriceError && { borderColor: '#EF4444', borderWidth: 1 }]}>
                <Text style={styles.priceLabel}>VND</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0"
                  value={buyNowPrice}
                  onChangeText={(text) => {
                    setBuyNowPrice(text);
                    validateBuyNowPrice(text);
                  }}
                  onFocus={() => setShowBuyNowPriceSuggestions(true)}
                  keyboardType="numeric"
                />
              </View>
              {buyNowPriceError && <Text style={styles.errorText}>{buyNowPriceError}</Text>}
              {showBuyNowPriceSuggestions && auctionData.startingPrice && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Gợi ý giá mua ngay</Text>
                  <View style={styles.suggestionsRow}>
                    <TouchableOpacity
                      style={styles.suggestionButton}
                      onPress={() => {
                        const suggested = '3000000';
                        setBuyNowPrice(suggested);
                        validateBuyNowPrice(suggested);
                        setShowBuyNowPriceSuggestions(false);
                      }}
                    >
                      <Text style={styles.suggestionButtonText}>3.000.000</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.suggestionButton}
                      onPress={() => {
                        const suggested = '5000000';
                        setBuyNowPrice(suggested);
                        validateBuyNowPrice(suggested);
                        setShowBuyNowPriceSuggestions(false);
                      }}
                    >
                      <Text style={styles.suggestionButtonText}>5.000.000</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.suggestionButton}
                      onPress={() => {
                        const suggested = '7000000';
                        setBuyNowPrice(suggested);
                        validateBuyNowPrice(suggested);
                        setShowBuyNowPriceSuggestions(false);
                      }}
                    >
                      <Text style={styles.suggestionButtonText}>7.000.000</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.suggestionsRow}>
                    <TouchableOpacity
                      style={styles.suggestionButton}
                      onPress={() => {
                        const suggested = '9000000';
                        setBuyNowPrice(suggested);
                        validateBuyNowPrice(suggested);
                        setShowBuyNowPriceSuggestions(false);
                      }}
                    >
                      <Text style={styles.suggestionButtonText}>9.000.000</Text>
                    </TouchableOpacity>

                  </View>
                </View>
              )}
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

          {/* Anti Sniping Extension Minutes (conditional) */}
          {enableAntiSniping && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Thời gian gia hạn (phút) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2"
                value={antiSnipingMinutes}
                onChangeText={setAntiSnipingMinutes}
                onFocus={() => setShowAntiSnipingSuggestions(true)}
                keyboardType="numeric"
              />
              {showAntiSnipingSuggestions && (
                <View style={styles.suggestionsContainer}>
                  <View style={styles.suggestionsRow}>
                    <TouchableOpacity
                      style={styles.suggestionButton}
                      onPress={() => {
                        setAntiSnipingMinutes('1');
                        setShowAntiSnipingSuggestions(false);
                      }}
                    >
                      <Text style={styles.suggestionButtonText}>1 phút</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.suggestionButton}
                      onPress={() => {
                        setAntiSnipingMinutes('2');
                        setShowAntiSnipingSuggestions(false);
                      }}
                    >
                      <Text style={styles.suggestionButtonText}>2 phút</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.suggestionButton}
                      onPress={() => {
                        setAntiSnipingMinutes('3');
                        setShowAntiSnipingSuggestions(false);
                      }}
                    >
                      <Text style={styles.suggestionButtonText}>3 phút</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.suggestionsRow}>
                    <TouchableOpacity
                      style={styles.suggestionButton}
                      onPress={() => {
                        setAntiSnipingMinutes('5');
                        setShowAntiSnipingSuggestions(false);
                      }}
                    >
                      <Text style={styles.suggestionButtonText}>5 phút</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Expected Harvest Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>6. Ngày thu hoạch dự kiến *</Text>
            <Text style={styles.fieldNote}>( Sau 3 ngày kể từ ngày kết thúc đấu giá )</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowExpectedHarvestPicker(true)}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {expectedHarvestDate ? new Date(expectedHarvestDate).toLocaleDateString('vi-VN') : 'Chọn ngày'}
              </Text>
            </TouchableOpacity>
            {showExpectedHarvestPicker && (
              <DateTimePicker
                value={expectedHarvestDate ? new Date(expectedHarvestDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleExpectedHarvestDateChange}
                minimumDate={auctionData.endDate ? new Date(new Date(auctionData.endDate).getTime() + 3 * 24 * 60 * 60 * 1000) : new Date()}
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
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleCreateDraft}
              style={[styles.draftButton, selectedCrops.length === 0 && styles.buttonDisabled]}
              disabled={selectedCrops.length === 0}
            >
              <Text style={styles.draftButtonText}>
                Lưu Bản Nháp
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleCreatePending}
              style={[styles.createButton, selectedCrops.length === 0 && styles.buttonDisabled]}
              disabled={selectedCrops.length === 0}
            >
              <Text style={styles.createButtonText}>
                Tạo Đấu Giá
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Note */}
        {/* <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            📝 <Text style={styles.noteTextBold}>Lưu ý:</Text> 
            {'\n'}• Vườn phải có vụ thu hoạch (harvest) trước khi tạo đấu giá
            {'\n'}• Vụ thu hoạch phải có chi tiết phân loại đánh giá (grade details)
            {'\n'}• Ngày công bố phải sau thời điểm hiện tại ít nhất 5 phút
            {'\n'}• Ngày kết thúc phải sau ngày công bố ít nhất 5 phút
            {'\n'}• Ngày thu hoạch dự kiến phải sau ngày kết thúc ít nhất 3 ngày
            {'\n'}• Mỗi vườn chỉ được tạo 1 đấu giá duy nhất
            {'\n'}• Vườn đang ở trạng thái "Đang trên sàn đấu giá" không thể tạo đấu giá mới
          </Text>
        </View> */}
      </ScrollView>
      )}

      {activeTab === 'review' && (
        <View style={styles.reviewContainer}>
          {/* Scrollable content */}
          <ScrollView style={styles.reviewContent} showsVerticalScrollIndicator={false}>
            {/* Quản lý Đấu Giá Section */}
            <View style={[styles.reviewSection, { marginTop: 30, marginBottom: 80 }]}>
              <Text style={styles.reviewSectionTitle}>Quản lý Đấu Giá ({filteredAuctions.length})</Text>
              {auctionLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#10B981" />
                  <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
              ) : filteredAuctions.length === 0 ? (
                <View style={styles.emptyHistoryContainer}>
                  <Package size={48} color="#D1D5DB" />
                  <Text style={styles.emptyHistoryText}>Chưa có đấu giá nào</Text>
                </View>
              ) : (
                filteredAuctions.map((auction) => (
                  <AuctionCard 
                    key={auction.id} 
                    auction={auction}
                    onPress={() => {
                      console.log('Clicking auction:', auction.id);
                      console.log('Full auction data:', JSON.stringify(auction));
                      console.log('Navigating to: /pages/farmer/auction-detail');
                      router.push({
                        pathname: '/pages/farmer/auction-detail',
                        params: { auctionData: JSON.stringify(auction) },
                      });
                    }}
                  />
                ))
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Quick Status Filters - appears above footer tabs */}
      {activeTab === 'review' && (
        <View style={styles.quickFiltersBarContainer}>
          {[
            { status: 'Draft', label: 'Nháp', color: '#9CA3AF' },
            { status: 'OnGoing', label: 'Đang diễn ra', color: '#22C55E' },
            { status: 'Completed', label: 'Hoàn thành', color: '#3B82F6' },
          ].map((item) => {
            const count = auctions.filter(a => a.status === item.status).length;
            return (
              <TouchableOpacity
                key={item.status}
                style={[
                  styles.quickFilterBarButton,
                  selectedStatus === item.status && styles.quickFilterBarButtonSelected,
                ]}
                onPress={() => handleStatusFilterChange(item.status)}
              >
                <View style={styles.quickFilterBarContent}>
                  <Text style={[styles.quickFilterBarLabel, { color: item.color }]}>{item.label}</Text>
                  <Text style={styles.quickFilterBarCount}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          
          {/* More Button */}
          <TouchableOpacity
            style={styles.moreFilterButton}
            onPress={() => setShowAllStatusesModal(true)}
          >
            <Text style={styles.moreFilterButtonText}>⋯</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer Navigation */}
      <View style={styles.footerTabs}>
        <TouchableOpacity
          style={[
            styles.footerTab,
            activeTab === 'create' && styles.footerTabActive,
          ]}
          onPress={() => setActiveTab('create')}
        >
          <Text
            style={[
              styles.footerTabText,
              activeTab === 'create' && styles.footerTabTextActive,
            ]}
          >
            Tạo đấu giá
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.footerTab,
            activeTab === 'review' && styles.footerTabActive,
          ]}
          onPress={() => setActiveTab('review')}
        >
          <Text
            style={[
              styles.footerTabText,
              activeTab === 'review' && styles.footerTabTextActive,
            ]}
          >
            Xem đấu giá
          </Text>
        </TouchableOpacity>
      </View>

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
                      <Text style={styles.cropItemName}>{item.name}</Text>
                      <Text style={styles.cropItemDate}>
                        Loại: {item.custardAppleType} • Trồng từ: {new Date(item.startPlantingDate).toLocaleDateString('vi-VN')}
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

      {/* All Statuses Modal with 4-Column Grid */}
      <Modal visible={showAllStatusesModal} transparent animationType="fade">
        <View style={styles.statusGridModalOverlay}>
          <View style={styles.statusGridModalContent}>
            <View style={styles.statusGridHeader}>
              <Text style={styles.statusGridTitle}>Tất cả trạng thái</Text>
              <TouchableOpacity onPress={() => setShowAllStatusesModal(false)}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.statusGrid}>
              {(['All', 'Draft', 'Pending', 'Rejected', 'Approved', 'OnGoing', 'Completed', 'NoWinner', 'Cancelled', 'Pause'] as const).map((status) => {
                const statusLabel = status === 'All' ? 'Tất cả' : status === 'Draft' ? 'Nháp' : status === 'Pending' ? 'Chờ duyệt' : status === 'Rejected' ? 'Bị từ chối' : status === 'Approved' ? 'Đã duyệt' : status === 'OnGoing' ? 'Đang diễn ra' : status === 'Completed' ? 'Hoàn thành' : status === 'NoWinner' ? 'Không có người thắng' : status === 'Cancelled' ? 'Đã hủy' : status === 'Pause' ? 'Tạm dừng' : status;
                const statusColor = getStatusColor(status);
                const auctionCount = status === 'All' ? auctions.length : auctions.filter(a => a.status === status).length;

                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusGridItem,
                      selectedStatus === status && styles.statusGridItemSelected,
                    ]}
                    onPress={() => {
                      handleStatusFilterChange(status);
                      setShowAllStatusesModal(false);
                      setShowStatusFilterModal(false);
                    }}
                  >
                    <View style={[styles.statusGridColor, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusGridLabel, { color: statusColor }]}>{statusLabel}</Text>
                    <Text style={styles.statusGridCount}>{auctionCount}</Text>
                    {selectedStatus === status && (
                      <Check size={16} color="#3B82F6" style={styles.statusGridCheck} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Modal */}
      <Modal visible={showLoadingModal} transparent animationType="fade">
        <View style={styles.loadingModalOverlay}>
          <View style={styles.loadingModalContent}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingModalText}>{loadingMessage}</Text>
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
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 50,
  },
  headerInfo: {
    marginHorizontal: 20,
    marginTop: 20,
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
  fieldNote: {
    fontSize: 12,
    color: '#F97316',
    marginBottom: 8,
    fontStyle: 'italic',
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
  priceLabel: {
    paddingLeft: 12,
    paddingRight: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
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
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 8,
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
    flex: 1,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  draftButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  draftButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingModalText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
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
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  suggestionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  suggestionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  // Review tab styles
  reviewContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
   
  },
  statusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusFilterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusFilterDropdownFooter: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 20,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterOptionTextSelected: {
    fontWeight: '600',
    color: '#3B82F6',
  },
  filterCheckmark: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  reviewContent: {
    flex: 1,
    paddingBottom: 100,
  },
  reviewSection: {
    marginVertical: 16,
    marginHorizontal: 16,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyHistoryContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  buyRequestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buyRequestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  buyRequestCardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buyRequestCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buyRequestCardDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  buyRequestCardContent: {
    gap: 8,
  },
  buyRequestCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyRequestCardLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  buyRequestCardValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  buyRequestCardValuePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22C55E',
  },
  buyRequestCardMessage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  footerTabs: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 44,
  },
  footerTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  footerTabActive: {
    borderBottomColor: '#3B82F6',
  },
  footerTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  footerTabTextActive: {
    color: '#3B82F6',
  },
  filterStatusButton: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterStatusButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Quick Filters Bar Styles (shown above footer tabs)
  quickFiltersBarContainer: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 40,
  },
  quickFilterBarButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickFilterBarButtonSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  quickFilterBarColor: {
    display: 'none',
  },
  quickFilterBarContent: {
    flex: 1,
  },
  quickFilterBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
  },
  quickFilterBarCount: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 0,
  },
  moreFilterButton: {
    width: 36,
    height: 36,
    backgroundColor: 'transparent',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreFilterButtonText: {
    fontSize: 20,
    fontWeight: '300',
    color: '#6B7280',
    lineHeight: 20,
  },
  // Status Grid Modal Styles
  statusGridModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  statusGridModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '60%',
    paddingHorizontal: 8,
    paddingTop: 18,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  statusGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 0,
  },
  statusGridTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  // Quick Filters Styles
  quickFiltersContainer: {
    gap: 12,
    marginBottom: 12,
  },
  quickFilterButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  quickFilterButtonSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  quickFilterColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  quickFilterContent: {
    flex: 1,
  },
  quickFilterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  quickFilterCount: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  moreButton: {
    justifyContent: 'center',
  },
  moreButtonText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#6B7280',
    lineHeight: 32,
  },
  // Status Grid Styles
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    justifyContent: 'space-around',
  },
  statusGridItem: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginVertical: 6,
    marginHorizontal: '1%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusGridItemSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  statusGridColor: {
    display: 'none',
  },
  statusGridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  statusGridCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    textAlign: 'center',
  },
  statusGridCheck: {
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
});