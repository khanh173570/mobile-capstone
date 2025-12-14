import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
  Image,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Search,
  MapPin,
  Package,
  DollarSign,
  X,
  ChevronDown,
  Filter,
} from 'lucide-react-native';
import {
  searchHarvests,
  getHarvestsByCrop,
  createBuyRequest,
  SearchResult,
  Harvest,
  BuyRequestDetail,
  CreateBuyRequestPayload,
} from '../../../../services/buyRequestService';
import { getBuyRequestHistory, BuyRequest } from '../../../../services/buyRequestHistoryService';
import { getUserProfile } from '../../../../services/authService';
import { getProvinces, getWardsFromProvince, Province, Ward } from '../../../../services/addressService';
import { getCustardAppleTypes, CustardAppleType } from '../../../../services/cropService';

interface SearchFilters {
  district: string;
  cropType: string;
  minQuantity: string;
  maxQuantity: string;
}

type StatusFilter = 'All' | 'Pending' | 'Accepted' | 'Rejected' | 'Completed' | 'Canceled';

export default function AuctionBrowseScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [cropTypes, setCropTypes] = useState<CustardAppleType[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [showWardDropdown, setShowWardDropdown] = useState(false);
  const [showCropTypeDropdown, setShowCropTypeDropdown] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    district: '',
    cropType: '',
    minQuantity: '',
    maxQuantity: '',
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchForm, setShowSearchForm] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState<SearchResult | null>(null);
  const [harvestDetails, setHarvestDetails] = useState<Harvest | null>(null);
  const [isBuyingBulk, setIsBuyingBulk] = useState(true);
  const [requiredDate, setRequiredDate] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<BuyRequestDetail[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  // History tab state
  const [buyRequestHistory, setBuyRequestHistory] = useState<BuyRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<StatusFilter>('All');
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadBuyRequestHistory();
    }
  }, [activeTab]);

  const loadBuyRequestHistory = async (status?: string) => {
    try {
      setHistoryLoading(true);
      const requests = await getBuyRequestHistory(status);
      setBuyRequestHistory(requests);
    } catch (error) {
      console.error('Error loading buy request history:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử yêu cầu');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStatusFilterChange = (status: StatusFilter) => {
    setSelectedStatusFilter(status);
    setShowStatusFilter(false);
    
    if (status === 'All') {
      loadBuyRequestHistory();
    } else {
      loadBuyRequestHistory(status);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Pending':
        return '#F59E0B';
      case 'Accepted':
        return '#10B981';
      case 'Rejected':
        return '#EF4444';
      case 'Completed':
        return '#3B82F6';
      case 'Canceled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'Pending':
        return 'Chờ xử lý';
      case 'Accepted':
        return 'Đã chấp nhận';
      case 'Rejected':
        return 'Bị từ chối';
      case 'Completed':
        return 'Hoàn thành';
      case 'Canceled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();
      if (profile && profile.data) {
        setUserId(profile.data.id);
      }
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lazy load crop types when dropdown is opened
  const loadCropTypes = async () => {
    if (cropTypes.length > 0) return; // Already loaded
    
    try {
      const types = await getCustardAppleTypes();
      console.log('🌾 Crop types loaded:', types.length);
      setCropTypes(types);
    } catch (error) {
      console.error('❌ Error loading crop types:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách loại cây trồng');
    }
  };

  // Lazy load wards when dropdown is opened
  const loadWardsForDropdown = async () => {
    if (!selectedProvince) {
      // Load provinces first if not loaded
      if (provinces.length === 0) {
        try {
          const provinceList = await getProvinces();
          console.log('📍 Provinces loaded:', provinceList.length);
          setProvinces(provinceList);
          
          // Set default province: Tây Ninh
          const tayNinhProvince = provinceList.find((p) => p.name.includes('Tây Ninh'));
          if (tayNinhProvince) {
            setSelectedProvince(tayNinhProvince.id);
          }
        } catch (error) {
          console.error('❌ Error loading provinces:', error);
          Alert.alert('Lỗi', 'Không thể tải danh sách tỉnh thành');
          return;
        }
      }
    }
    
    // Load wards for selected province
    if (selectedProvince && wards.length === 0) {
      try {
        const wardList = await getWardsFromProvince(selectedProvince);
        console.log('📍 Wards loaded:', wardList.length);
        setWards(wardList);
      } catch (error) {
        console.error('❌ Error loading wards:', error);
        Alert.alert('Lỗi', 'Không thể tải danh sách phường/xã');
      }
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Auto-search when wards are loaded and district is selected
    if (wards.length > 0 && searchFilters.district) {
      console.log('🔍 Auto-searching with district:', searchFilters.district);
      handleSearch();
    }
  }, [wards, searchFilters.district]);

  useEffect(() => {
    // Load wards when province changes
    const loadWards = async () => {
      if (selectedProvince) {
        try {
          const wardList = await getWardsFromProvince(selectedProvince);
          setWards(wardList);
          setSearchFilters((prev) => ({ ...prev, district: '' }));
        } catch (error) {
          console.error('Error loading wards:', error);
        }
      }
    };
    loadWards();
  }, [selectedProvince]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (searchFilters.district) {
        // Get the ward name from the ward ID
        const ward = wards.find(w => w.id === searchFilters.district);
        if (ward) {
          filters.District = ward.name; // Send ward name, not ID
        }
      }
      if (searchFilters.cropType) {
        // Get the crop type name from the ID
        const cropType = cropTypes.find(c => c.id === searchFilters.cropType);
        if (cropType) {
          filters.TypeName = cropType.name; // Send crop type name
        }
      }
      if (searchFilters.minQuantity) filters.MinTotalQuantity = parseInt(searchFilters.minQuantity);
      if (searchFilters.maxQuantity) filters.MaxTotalQuantity = parseInt(searchFilters.maxQuantity);

      // Add timeout to prevent infinite loading
      const searchPromise = searchHarvests(Object.keys(filters).length > 0 ? filters : undefined);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout - API not responding')), 10000)
      );
      
      const results = await Promise.race([searchPromise, timeoutPromise]) as any;
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching harvests:', error);
      Alert.alert('Lỗi', 'Không thể tìm kiếm hàng - ' + (error instanceof Error ? error.message : 'Vui lòng thử lại'));
      setSearchResults([]); // Clear results on error
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await handleSearch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectHarvest = async (harvest: SearchResult) => {
    try {
      // Get full harvest details
      const harvests = await getHarvestsByCrop(harvest.cropID);
      const harvestDetail = harvests.find((h) => h.id === harvest.id);
      
      // Merge details with search result
      const fullHarvest = {
        ...harvest,
        ...harvestDetail,
      };
      
      // Navigate to detail page
      router.push({
        pathname: '/(tabs)/wholesaler/auction-browse/detail',
        params: {
          harvest: JSON.stringify(fullHarvest),
        },
      });
    } catch (error) {
      console.error('Error selecting harvest:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết sản phẩm');
    }
  };

  const handleSubmitBuyRequest = async () => {
    if (!selectedHarvest || !userId) {
      Alert.alert('Lỗi', 'Dữ liệu không đầy đủ');
      return;
    }

    if (!requiredDate || !expectedPrice || !message) {
      Alert.alert('Lỗi', 'Vui lòng điền tất cả các trường bắt buộc');
      return;
    }

    const price = parseFloat(expectedPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Lỗi', 'Giá dự kiến không hợp lệ');
      return;
    }

    if (!isBuyingBulk && details.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng thêm chi tiết loại hàng');
      return;
    }

    try {
      setSubmitting(true);
      
      const payload: CreateBuyRequestPayload = {
        requiredDate: new Date(requiredDate).toISOString(),
        expectedPrice: price,
        message,
        status: 'Pending',
        isBuyingBulk,
        wholesalerId: userId,
        harvestId: selectedHarvest.id,
        farmerId: selectedHarvest.farmerID,
        details: isBuyingBulk ? [] : details,
      };

      await createBuyRequest(payload);
      
      Alert.alert('Thành công', 'Yêu cầu mua đã được tạo', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            handleSearch();
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating buy request:', error);
      Alert.alert('Lỗi', 'Không thể tạo yêu cầu mua');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedHarvest(null);
    setHarvestDetails(null);
    setIsBuyingBulk(true);
    setRequiredDate('');
    setExpectedPrice('');
    setMessage('');
    setDetails([]);
    setShowCreateForm(false);
    setShowSearchForm(true);
  };

  const handleCancelCreate = () => {
    resetForm();
  };

  // Removed full-screen loading - now shows inline loading indicator

  return (
    <View style={styles.container}>
      {activeTab === 'search' && (
        <>
          {showSearchForm && (
            <ScrollView
              style={styles.content}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
              {/* Search Form */}
              <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>Tìm kiếm hàng</Text>
            
            {/* Province Dropdown - Fixed to Tây Ninh */}
            <TouchableOpacity
              style={[styles.dropdown, { opacity: 0.6 }]}
              disabled={true}
            >
              <Text style={styles.dropdownText}>
                {selectedProvince && provinces.length > 0
                  ? provinces.find(p => p.id === selectedProvince)?.name || 'Tây Ninh'
                  : 'Tây Ninh'}
              </Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* District Dropdown or TextInput Fallback */}
            {wards.length > 0 ? (
              <>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowWardDropdown(!showWardDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {searchFilters.district
                      ? wards.find(w => w.id === searchFilters.district)?.name
                      : 'Chọn phường/xã'}
                  </Text>
                  <ChevronDown size={20} color="#6B7280" />
                </TouchableOpacity>

                {showWardDropdown && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                      {wards.map((ward) => (
                        <TouchableOpacity
                          key={ward.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSearchFilters((prev) => ({
                              ...prev,
                              district: ward.id,
                            }));
                            setShowWardDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              searchFilters.district === ward.id && styles.dropdownItemSelected,
                            ]}
                          >
                            {ward.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            ) : (
              // Fallback: TextInput khi không load được danh sách phường/xã
              <TextInput
                style={styles.textInput}
                placeholder="Nhập phường/xã"
                placeholderTextColor="#9CA3AF"
                value={searchFilters.district}
                onChangeText={(text) => setSearchFilters((prev) => ({
                  ...prev,
                  district: text,
                }))}
              />
            )}

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowCropTypeDropdown(!showCropTypeDropdown)}
            >
              <Text style={styles.dropdownText}>
                {searchFilters.cropType
                  ? cropTypes.find(c => c.id === searchFilters.cropType)?.name || 'Chọn loại cây trồng'
                  : 'Chọn loại loại'}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>

            {showCropTypeDropdown && (
              <View style={styles.dropdownMenu}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                  {cropTypes.map((cropType) => (
                    <TouchableOpacity
                      key={cropType.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSearchFilters((prev) => ({
                          ...prev,
                          cropType: cropType.id,
                        }));
                        setShowCropTypeDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          searchFilters.cropType === cropType.id && styles.dropdownItemSelected,
                        ]}
                      >
                        {cropType.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.quantityRow}>
              <TextInput
                style={[styles.input, styles.quantityInput]}
                placeholder="Tối thiểu (kg)"
                value={searchFilters.minQuantity}
                onChangeText={(text) =>
                  setSearchFilters((prev) => ({ ...prev, minQuantity: text }))
                }
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={[styles.input, styles.quantityInput]}
                placeholder="Tối đa (kg)"
                value={searchFilters.maxQuantity}
                onChangeText={(text) =>
                  setSearchFilters((prev) => ({ ...prev, maxQuantity: text }))
                }
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.searchButton, { flex: 1 }]}
                onPress={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Search size={18} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Tìm kiếm</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.resetButton]}
                onPress={() => {
                  setSearchFilters({
                    district: '',
                    cropType: '',
                    minQuantity: '',
                    maxQuantity: '',
                  });
                }}
              >
                <X size={18} color="#111827" />
                <Text style={[styles.buttonText, { color: '#111827' }]}>Đặt lại</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Results */}
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>
              Kết quả ({searchResults.length})
            </Text>

            {searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Search size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Không tìm thấy hàng nào</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.resultGrid}
                scrollEnabled={false}
                renderItem={({ item: result }) => (
                  <TouchableOpacity
                    style={styles.resultCardGrid}
                    onPress={() => handleSelectHarvest(result)}
                  >
                    {/* Image */}
                    {result.imageUrls && result.imageUrls.length > 0 ? (
                      <Image
                        source={{ uri: result.imageUrls[0] }}
                        style={styles.resultImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.resultImage, styles.emptyImage]}>
                        <Package size={40} color="#D1D5DB" />
                      </View>
                    )}

                    {/* Content */}
                    <View style={styles.resultCardContent}>
                      <Text style={styles.resultCardCropName} numberOfLines={2}>
                        {result.cropName}
                      </Text>
                      <Text style={styles.resultCardAddress} numberOfLines={1}>
                        {result.address}
                      </Text>

                      <View style={styles.resultCardDetails}>
                        <Text style={styles.resultCardLabel}>
                          {result.totalQuantity} {result.unit}
                        </Text>
                        <Text style={styles.resultCardPrice}>
                          {(result.salePrice || 0).toLocaleString('vi-VN')} ₫
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </ScrollView>
      )}
        </>
      )}

      {activeTab === 'history' && (
        <View style={styles.historyContainer}>
          {/* History Title */}
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Lịch sử yêu cầu mua</Text>
          </View>

          {/* History List */}
          {historyLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
            </View>
          ) : buyRequestHistory.length === 0 ? (
            <View style={styles.emptyHistoryContainer}>
              <Package size={48} color="#D1D5DB" />
              <Text style={styles.emptyHistoryText}>Chưa có yêu cầu mua nào</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.historyList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {buyRequestHistory.map((request) => (
                <TouchableOpacity
                  key={request.id}
                  style={styles.historyCard}
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/wholesaler/auction-browse/history-detail',
                      params: {
                        buyRequest: JSON.stringify(request),
                      },
                    });
                  }}
                >
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyCardTitleContainer}>
                      {/* <Text style={styles.historyCardTitle}>
                        ID: {request.id.substring(0, 8)}...
                      </Text> */}
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(request.status) },
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {getStatusLabel(request.status)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.historyCardDate}>
                      {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>

                  <View style={styles.historyCardContent}>
                    <View style={styles.historyCardRow}>
                      <Text style={styles.historyCardLabel}>Ngày cần thiết:</Text>
                      <Text style={styles.historyCardValue}>
                        {new Date(request.requiredDate).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                    <View style={styles.historyCardRow}>
                      <Text style={styles.historyCardLabel}>Giá dự kiến:</Text>
                      <Text style={styles.historyCardValuePrice}>
                        {request.expectedPrice.toLocaleString('vi-VN')} ₫
                      </Text>
                    </View>
                    <View style={styles.historyCardRow}>
                      <Text style={styles.historyCardLabel}>Loại mua:</Text>
                      <Text style={styles.historyCardValue}>
                        {request.isBuyingBulk ? 'Mua toàn bộ' : 'Mua theo loại'}
                      </Text>
                    </View>
                    {request.details && request.details.length > 0 && (
                      <View style={styles.historyCardRow}>
                        <Text style={styles.historyCardLabel}>Chi tiết:</Text>
                        <Text style={styles.historyCardValue}>
                          {request.details.length} loại hàng
                        </Text>
                      </View>
                    )}
                    <Text style={styles.historyCardMessage} numberOfLines={2}>
                      {request.message}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Footer Navigation */}
      <View style={styles.footerWrapper}>
        {/* Filter Bar for History Tab */}
        {activeTab === 'history' && (
          <View style={styles.filterBarGrid}>
            <TouchableOpacity
              style={[
                styles.filterGridButton,
                selectedStatusFilter === 'All' && styles.filterGridButtonActive,
              ]}
              onPress={() => handleStatusFilterChange('All')}
            >
              <Text
                style={[
                  styles.filterGridButtonText,
                  selectedStatusFilter === 'All' && styles.filterGridButtonTextActive,
                ]}
              >
                Tất cả
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterGridButton,
                selectedStatusFilter === 'Pending' && styles.filterGridButtonActive,
              ]}
              onPress={() => handleStatusFilterChange('Pending')}
            >
              <Text
                style={[
                  styles.filterGridButtonText,
                  selectedStatusFilter === 'Pending' && styles.filterGridButtonTextActive,
                ]}
              >
                Chờ xử lý
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterGridButton,
                selectedStatusFilter === 'Completed' && styles.filterGridButtonActive,
              ]}
              onPress={() => handleStatusFilterChange('Completed')}
            >
              <Text
                style={[
                  styles.filterGridButtonText,
                  selectedStatusFilter === 'Completed' && styles.filterGridButtonTextActive,
                ]}
              >
                Hoàn thành
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.footerTabs}>
          <TouchableOpacity
            style={[
              styles.footerTab,
              activeTab === 'search' && styles.footerTabActive,
            ]}
            onPress={() => setActiveTab('search')}
          >
            <Text
              style={[
                styles.footerTabText,
                activeTab === 'search' && styles.footerTabTextActive,
              ]}
            >
              Tìm hàng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.footerTab,
              activeTab === 'history' && styles.footerTabActive,
            ]}
            onPress={() => setActiveTab('history')}
          >
            <Text
              style={[
                styles.footerTabText,
                activeTab === 'history' && styles.footerTabTextActive,
              ]}
            >
              Lịch sử yêu cầu
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',                                                                                             
  },
  createSection: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityInput: {
    flex: 1,
  },
  messageInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  searchButton: {
    backgroundColor: '#3B82F6',
  },
  resetButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    flex: 1,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  resultsSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  resultHeader: {
    marginBottom: 12,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  farmerName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  resultDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  resultNote: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    marginTop: 4,
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  detailsSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  gradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gradeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dropdownItemSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  resultGrid: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    gap: 12,
  },
  resultCardGrid: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  resultImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3F4F6',
  },
  emptyImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCardContent: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  resultCardCropName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  resultCardAddress: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
  },
  resultCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  resultCardLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  resultCardPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 30,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F3F4F6',
  },
  modalSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 10,
  },
  createButton: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  footerTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    height: 56,
  },
  footerTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  footerTabActive: {
    borderBottomColor: '#059669',
  },
  footerTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  footerTabTextActive: {
    color: '#059669',
  },
  footerWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  filterBarGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  filterGridButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterGridButtonActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  filterGridButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterGridButtonTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  statusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    justifyContent: 'center',
  },
  statusFilterButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusFilterDropdownFooter: {
    position: 'absolute',
    bottom: 56,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  filterOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterOptionSelected: {
    backgroundColor: '#F0FDF4',
  },
  filterOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterOptionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: '#059669',
    fontWeight: '700',
  },
  filterCheckmark: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#059669',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 28,
  },
  historyHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 0,
  },
  historyList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  historyCardTitle: {
    fontSize: 13,
    fontWeight: '700',
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
  historyCardDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  historyCardContent: {
    gap: 8,
  },
  historyCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  historyCardValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  historyCardValuePrice: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  historyCardMessage: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyHistoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 12,
  },
});
