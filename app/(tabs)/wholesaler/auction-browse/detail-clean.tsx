import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Package,
  DollarSign,
  Calendar,
} from 'lucide-react-native';
import { createBuyRequest, SearchResult } from '../../../../services/buyRequestService';
import { getUserProfile } from '../../../../services/authService';

export default function AuctionDetailScreen() {
  const params = useLocalSearchParams();
  const harvest = params.harvest ? JSON.parse(params.harvest as string) : null;
  
  const [userId, setUserId] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [requiredDate, setRequiredDate] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPriceSuggestions, setShowPriceSuggestions] = useState(false);

  React.useEffect(() => {
    loadUserProfile();
  }, []);

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

  // Generate 6 price suggestions based on current price
  const getPriceSuggestions = (): number[] => {
    const basePrice = harvest.salePrice || 0;
    if (basePrice === 0) return [100000, 200000, 300000, 400000, 500000, 600000];

    const suggestions = [
      Math.round(basePrice * 0.8),     // 80% of current
      Math.round(basePrice * 0.9),     // 90% of current
      basePrice,                        // Same as current
      Math.round(basePrice * 1.1),     // 110% of current
      Math.round(basePrice * 1.2),     // 120% of current
      Math.round(basePrice * 1.3),     // 130% of current
    ];
    
    return suggestions;
  };

  if (!harvest) {
    return (
      <View style={styles.container}>
        <Text>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  const handleCreateRequest = async () => {
    // Validate required date is in the future
    if (!requiredDate) {
      Alert.alert('Lỗi', 'Vui lòng nhập ngày cần thiết');
      return;
    }

    const requiredDateTime = new Date(requiredDate).getTime();
    const nowTime = new Date().getTime();

    if (requiredDateTime <= nowTime) {
      Alert.alert('Lỗi', 'Ngày cần thiết phải là ngày tương lai');
      return;
    }

    if (!expectedPrice) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá dự kiến');
      return;
    }

    const price = parseFloat(expectedPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Lỗi', 'Giá dự kiến phải là số lớn hơn 0');
      return;
    }

    if (!message) {
      Alert.alert('Lỗi', 'Vui lòng nhập ghi chú / yêu cầu đặc biệt');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        requiredDate: new Date(requiredDate).toISOString(),
        expectedPrice: price,
        message,
        status: 'Pending',
        isBuyingBulk: false,
        wholesalerId: userId,
        harvestId: harvest.id,
        farmerId: harvest.farmerID,
        details: [],
      };

      await createBuyRequest(payload);

      Alert.alert('Thành công', 'Yêu cầu mua đã được tạo', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error creating request:', error);
      const errorMessage = error?.message || error?.toString() || 'Không thể tạo yêu cầu mua';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (showCreateForm) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowCreateForm(false)} style={styles.backButton}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo yêu cầu mua</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView style={styles.formContent}>
          <View style={styles.productCard}>
            <Text style={styles.productCardTitle}>{harvest.cropName}</Text>
            <View style={styles.productCardDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Số lượng sẵn</Text>
                <Text style={styles.detailValue}>
                  {harvest.totalQuantity} {harvest.unit}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Giá hiện tại</Text>
                <Text style={styles.detailValue}>
                  {(harvest.salePrice || 0).toLocaleString('vi-VN')} ₫
                </Text>
              </View>
            </View>
            <View style={styles.addressHighlight}>
              <MapPin size={16} color="#3B82F6" />
              <Text style={styles.addressText}>{harvest.address}</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Thông tin yêu cầuu</Text>

            <View style={styles.formField}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Ngày cần thiết</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Calendar size={18} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  value={requiredDate}
                  onChangeText={setRequiredDate}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.formField}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Giá dự kiến</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <DollarSign size={18} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập giá (₫)"
                  value={expectedPrice}
                  onChangeText={setExpectedPrice}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Price Suggestions */}
              <TouchableOpacity
                style={styles.suggestionsToggle}
                onPress={() => setShowPriceSuggestions(!showPriceSuggestions)}
              >
                <Text style={styles.suggestionsToggleText}>
                  {showPriceSuggestions ? '✓ Ẩn gợi ý giá' : '💡 Gợi ý giá'}
                </Text>
              </TouchableOpacity>

              {showPriceSuggestions && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsLabel}>Giá được gợi ý:</Text>
                  <View style={styles.suggestionsGrid}>
                    {getPriceSuggestions().map((price, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setExpectedPrice(price.toString());
                          setShowPriceSuggestions(false);
                        }}
                      >
                        <Text style={styles.suggestionPrice}>
                          {price.toLocaleString('vi-VN')}
                        </Text>
                        <Text style={styles.suggestionLabel}>
                          {index === 0 ? '-20%' : index === 1 ? '-10%' : index === 2 ? 'Hiện' : index === 3 ? '+10%' : index === 4 ? '+20%' : '+30%'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View style={styles.formField}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Ghi chú / Yêu cầu đặc biệt</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.messageInput]}
                placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submitting && { opacity: 0.6 }]}
              onPress={handleCreateRequest}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Đang tạo yêu cầu...' : 'Tạo yêu cầu mua'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreateForm(false)}
            >
              <Text style={styles.cancelButtonText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content}>
        {harvest.imageUrls && harvest.imageUrls.length > 0 ? (
          <View style={styles.gallerySection}>
            <Image
              source={{ uri: harvest.imageUrls[activeImageIndex] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
            {harvest.imageUrls.length > 1 && (
              <View style={styles.thumbnailContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {harvest.imageUrls.map((url: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setActiveImageIndex(index)}
                      style={[
                        styles.thumbnail,
                        activeImageIndex === index && styles.thumbnailActive,
                      ]}
                    >
                      <Image
                        source={{ uri: url }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.mainImage, styles.emptyImage]}>
            <Package size={50} color="#D1D5DB" />
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin chung</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sản phẩm:</Text>
            <Text style={styles.value}>{harvest.cropName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Loại:</Text>
            <Text style={styles.value}>{harvest.custardAppleTypeName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Diện tích:</Text>
            <Text style={styles.value}>{harvest.cropArea || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Địa chỉ</Text>
          <View style={styles.infoRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={[styles.value, { flex: 1, marginLeft: 8 }]}>
              {harvest.address}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phường/Xã:</Text>
            <Text style={styles.value}>{harvest.district || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tỉnh/Thành phố:</Text>
            <Text style={styles.value}>{harvest.province || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin vụ mùa</Text>
          <View style={styles.infoRow}>
            <Package size={16} color="#6B7280" />
            <Text style={[styles.value, { flex: 1, marginLeft: 8 }]}>
              {harvest.totalQuantity} {harvest.unit}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <DollarSign size={16} color="#6B7280" />
            <Text style={[styles.value, { flex: 1, marginLeft: 8, color: '#059669', fontWeight: '700' }]}>
              {(harvest.salePrice || 0).toLocaleString('vi-VN')} ₫
            </Text>
          </View>
          {harvest.startDate && (
            <View style={styles.infoRow}>
              <Calendar size={16} color="#6B7280" />
              <Text style={[styles.value, { flex: 1, marginLeft: 8 }]}>
                {new Date(harvest.startDate).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Ghi chú:</Text>
            <Text style={styles.value}>{harvest.note || 'N/A'}</Text>
          </View>
        </View>

        {harvest.harvestGradeDetailDTOs && harvest.harvestGradeDetailDTOs.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Chi tiết loại hàng</Text>
            {harvest.harvestGradeDetailDTOs.map((grade: any, index: number) => (
              <View key={index} style={styles.gradeCard}>
                <Text style={styles.gradeTitle}>Loại {index + 1}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Hạng:</Text>
                  <Text style={styles.value}>{grade.grade}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Số lượng:</Text>
                  <Text style={styles.value}>
                    {grade.quantity} {harvest.unit}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateForm(true)}
        >
          <Text style={styles.createButtonText}>Tạo yêu cầu mua</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 150 : 110,
  },
  formContent: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 150 : 110,
  },
  gallerySection: {
    backgroundColor: '#F3F4F6',
  },
  mainImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F3F4F6',
  },
  emptyImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#3B82F6',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    width: 100,
  },
  value: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  gradeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gradeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  createButton: {
    backgroundColor: '#10B981',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  productCardDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  addressHighlight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  addressText: {
    fontSize: 13,
    color: '#1E40AF',
    flex: 1,
  },
  formSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  formField: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  messageInput: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 110,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsToggle: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    alignItems: 'center',
  },
  suggestionsToggleText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 10,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionItem: {
    width: '32%',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  suggestionLabel: {
    fontSize: 11,
    color: '#6B7280',
  },});