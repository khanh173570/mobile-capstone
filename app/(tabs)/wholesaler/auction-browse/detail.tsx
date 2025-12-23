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
  Modal,
  Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Package,
  Calendar,
  X,
  Trash2,
  Plus,
  User as UserIcon,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createBuyRequest, SearchResult } from '../../../../services/buyRequestService';
import { getUserProfile, getUserByUsername, User } from '../../../../services/authService';

interface BuyRequestDetail {
  grade: number;
  quantity: number;
  price: number;
  allowedDeviationPercent: number;
  unit: string;
}

export default function AuctionDetailScreen() {
  const params = useLocalSearchParams();
  const harvest = params.harvest ? JSON.parse(params.harvest as string) : null;
  
  // Log to verify harvestGradeDetailDTOs is present
  React.useEffect(() => {
    if (harvest) {
      console.log('Harvest data in detail page:', {
        id: harvest.id,
        cropName: harvest.cropName,
        hasGradeDetails: !!(harvest.harvestGradeDetailDTOs && harvest.harvestGradeDetailDTOs.length > 0),
        gradeDetailsCount: harvest.harvestGradeDetailDTOs?.length || 0,
        gradeDetails: harvest.harvestGradeDetailDTOs,
      });
    }
  }, [harvest]);
  
  const [userId, setUserId] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isBuyingBulk, setIsBuyingBulk] = useState(true);
  const [requiredDate, setRequiredDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expectedPrice, setExpectedPrice] = useState('');
  const [showPriceSuggestions, setShowPriceSuggestions] = useState(false);
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<BuyRequestDetail[]>([]);
  const [currentDetail, setCurrentDetail] = useState<BuyRequestDetail>({
    grade: 1,
    quantity: 0,
    price: 0,
    allowedDeviationPercent: 0,
    unit: 'kg',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [farmerInfo, setFarmerInfo] = useState<User | null>(null);
  const [loadingFarmer, setLoadingFarmer] = useState(false);

  const priceSuggestions = [500000, 1000000, 2000000];

  React.useEffect(() => {
    loadUserProfile();
    if (harvest?.farmerID) {
      loadFarmerInfo();
    }
  }, [harvest?.farmerID]);

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

  const loadFarmerInfo = async () => {
    if (!harvest?.farmerID) return;
    
    try {
      setLoadingFarmer(true);
      const farmer = await getUserByUsername(harvest.farmerID);
      if (farmer) {
        console.log('Farmer info loaded:', {
          firstName: farmer.firstName,
          lastName: farmer.lastName,
          email: farmer.email,
          phoneNumber: farmer.phoneNumber,
          userName: farmer.userName,
        });
        setFarmerInfo(farmer);
      } else {
        console.warn('Farmer info is null or undefined');
      }
    } catch (error) {
      console.error('Error loading farmer info:', error);
    } finally {
      setLoadingFarmer(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!requiredDate.trim()) {
      newErrors.requiredDate = 'Vui lòng chọn ngày cần thiết';
    }
    
    // expectedPrice is auto-filled when adding details, but still validate it exists
    if (!expectedPrice.trim()) {
      newErrors.expectedPrice = 'Vui lòng nhập giá dự kiên';
    } else {
      // Remove dots before parsing
      const numericPrice = expectedPrice.replace(/\./g, '');
      const price = parseFloat(numericPrice);
      if (isNaN(price) || price <= 0) {
        newErrors.expectedPrice = 'Giá phải là số dương';
      }
    }
    
    if (!message.trim()) {
      newErrors.message = 'Vui lòng nhập ghi chú';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split('T')[0];
      setRequiredDate(formatted);
      setErrors({ ...errors, requiredDate: '' });
    }
    
    // Close picker on both iOS and Android
    setShowDatePicker(false);
  };

  const handlePriceSelect = (price: number) => {
    setExpectedPrice(price.toString());
    setShowPriceSuggestions(false);
    setErrors({ ...errors, expectedPrice: '' });
  };

  const handleAddDetail = () => {
    if (currentDetail.quantity <= 0 || currentDetail.price <= 0) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin chi tiết');
      return;
    }

    // Check if max 3 grades reached
    if (details.length >= 3) {
      Alert.alert('Thông báo', 'Tối đa chỉ có thể thêm 3 loại hạng');
      return;
    }

    const newDetails = [...details, currentDetail];
    setDetails(newDetails);

    // Auto-calculate expectedPrice from all details
    const totalPrice = newDetails.reduce((sum, detail) => {
      return sum + detail.quantity * detail.price;
    }, 0);
    setExpectedPrice(totalPrice.toString());

    // Reset current detail to next grade (if available)
    const nextGrade = newDetails.length + 1;
    if (nextGrade <= 3) {
      setCurrentDetail({
        grade: nextGrade,
        quantity: 0,
        price: 0,
        allowedDeviationPercent: 0,
        unit: 'kg',
      });
    }
  };

  const handleRemoveDetail = (index: number) => {
    const newDetails = details.filter((_, i) => i !== index);
    setDetails(newDetails);

    // Recalculate expectedPrice after removing detail
    if (newDetails.length > 0) {
      const totalPrice = newDetails.reduce((sum, detail) => {
        return sum + detail.quantity * detail.price;
      }, 0);
      setExpectedPrice(totalPrice.toString());
    } else {
      // If no details left, reset expectedPrice
      setExpectedPrice('');
    }
  };

  if (!harvest) {
    return (
      <View style={styles.container}>
        <Text>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  const handleCreateRequest = async () => {
    if (!validateForm()) {
      return;
    }

    // isBuyingBulk is always true, no need to validate details

    try {
      setSubmitting(true);

      // Remove dots from expectedPrice before parsing
      const numericPrice = expectedPrice.replace(/\./g, '');
      
      const payload = {
        requiredDate: new Date(requiredDate).toISOString(),
        expectedPrice: parseFloat(numericPrice),
        message,
        status: 'Pending',
        isBuyingBulk,
        wholesalerId: userId,
        harvestId: harvest.id,
        farmerId: harvest.farmerID,
        details: isBuyingBulk ? [] : details,
        harvestGradeDetailDTOs: harvest.harvestGradeDetailDTOs || [],
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
          <View style={styles.formSection}>
            {/* <Text style={styles.formSectionTitle}>Thông tin yêu cầu</Text> */}

            <View style={styles.formField}>
              <View style={styles.labelContainer}>
                <Text style={styles.formLabelText} numberOfLines={1}>
                  1. Ngày cần thiết
                </Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={[styles.dateInput, errors.requiredDate && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={18} color="#6B7280" />
                <Text style={styles.dateInputText}>
                  {requiredDate || 'Chọn ngày cần thiết'}
                </Text>
              </TouchableOpacity>
              {errors.requiredDate && (
                <Text style={styles.errorText}>{errors.requiredDate}</Text>
              )}
            </View>

            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={requiredDate ? new Date(requiredDate) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {showDatePicker && Platform.OS === 'ios' && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.iosDatePickerContainer}>
                  <View style={styles.iosDatePickerWrapper}>
                    <View style={styles.iosDatePickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.iosDatePickerButton}>Huỷ</Text>
                      </TouchableOpacity>
                      <Text style={styles.iosDatePickerTitle}>Chọn ngày</Text>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={[styles.iosDatePickerButton, { color: '#059669' }]}>Xong</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={requiredDate ? new Date(requiredDate) : new Date()}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      textColor="#111827"
                    />
                  </View>
                </View>
              </Modal>
            )}

            <View style={styles.formField}>
              <View style={styles.labelContainer}>
                <Text style={styles.formLabelText} numberOfLines={1}>
                  2. Giá dự kiến (VND)
                </Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={[styles.textInput, errors.expectedPrice && styles.inputError]}
                placeholder="Nhập giá dự kiến yêu cầu"
                value={expectedPrice}
                onChangeText={(text) => {
                  // Remove all non-numeric characters except dots
                  const numericValue = text.replace(/[^\d]/g, '');
                  
                  // Format with dots for thousands separator
                  let formattedValue = '';
                  if (numericValue.length > 0) {
                    // Reverse the string to add dots from right to left
                    const reversed = numericValue.split('').reverse().join('');
                    const chunks: string[] = [];
                    for (let i = 0; i < reversed.length; i += 3) {
                      chunks.push(reversed.slice(i, i + 3));
                    }
                    formattedValue = chunks.join('.').split('').reverse().join('');
                  }
                  
                  setExpectedPrice(formattedValue);
                  setErrors({ ...errors, expectedPrice: '' });
                }}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              {errors.expectedPrice && (
                <Text style={styles.errorText}>{errors.expectedPrice}</Text>
              )}
            </View>

            <View style={styles.formField}>
              <View style={styles.labelContainer}>
                <Text style={styles.formLabelText} numberOfLines={1}>
                  3. Ghi chú cho nông dân
                </Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.messageInput, errors.message && styles.inputError]}
                placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
                value={message}
                onChangeText={(text) => {
                  setMessage(text);
                  setErrors({ ...errors, message: '' });
                }}
                multiline
                numberOfLines={4}
                placeholderTextColor="#9CA3AF"
              />
              {errors.message && (
                <Text style={styles.errorText}>{errors.message}</Text>
              )}
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
            <Text style={styles.labelText}>Sản phẩm:</Text>
            <Text style={styles.value}>{harvest.cropName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Loại:</Text>
            <Text style={styles.value}>{harvest.custardAppleTypeName || 'N/A'}</Text>
          </View>
          {harvest.custardAppleTypeDescription && (
            <View style={styles.infoRow}>
              <Text style={styles.labelText}>Mô tả loại:</Text>
              <Text style={[styles.value, { fontStyle: 'italic', color: '#6B7280' }]}>
                {harvest.custardAppleTypeDescription}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Diện tích:</Text>
            <Text style={styles.value}>{harvest.cropArea ? `${harvest.cropArea} ha` : 'N/A'}</Text>
          </View>
        </View>

        {/* Farmer Information Section */}
        {harvest.farmerID && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Thông tin nông dân</Text>
            {loadingFarmer ? (
              <View style={styles.infoRow}>
                <Text style={styles.value}>Đang tải thông tin...</Text>
              </View>
            ) : farmerInfo ? (
              <>
                <View style={styles.infoRow}>
                  <UserIcon size={16} color="#6B7280" />
                  <Text style={[styles.value, { flex: 1, marginLeft: 8, fontWeight: '600' }]}>
                    {farmerInfo.firstName} {farmerInfo.lastName}
                  </Text>
                </View>
                {farmerInfo.userName && (
                  <View style={styles.infoRow}>
                    <Text style={styles.labelText}>Username:</Text>
                    <Text style={styles.value}>{farmerInfo.userName}</Text>
                  </View>
                )}
                {farmerInfo.address && (
                  <View style={styles.infoRow}>
                    <MapPin size={16} color="#6B7280" />
                    <Text style={[styles.value, { flex: 1, marginLeft: 8 }]}>
                      {farmerInfo.address}
                      {farmerInfo.communes && `, ${farmerInfo.communes}`}
                      {farmerInfo.province && `, ${farmerInfo.province}`}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.infoRow}>
                <Text style={[styles.value, { color: '#9CA3AF' }]}>
                  Không thể tải thông tin nông dân
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Địa chỉ</Text>
          <View style={styles.infoRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={[styles.value, { flex: 1, marginLeft: 8 }]}>
              {harvest.address}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Phường/Xã:</Text>
            <Text style={styles.value}>{harvest.district || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Tỉnh/Thành phố:</Text>
            <Text style={styles.value}>{harvest.province || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin vụ mùa</Text>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Tổng số lượng:</Text>
            <Text style={styles.value}>
              {harvest.totalQuantity} {harvest.unit}
            </Text>
          </View>
          {harvest.startDate && (
            <View style={styles.infoRow}>
              <Text style={styles.labelText}>Ngày bắt đầu:</Text>
              <Text style={styles.value}>
                {new Date(harvest.startDate).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
          {harvest.harvestDate && (
            <View style={styles.infoRow}>
              <Text style={styles.labelText}>Ngày thu hoạch:</Text>
              <Text style={styles.value}>
                {new Date(harvest.harvestDate).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Giá bán:</Text>
            <Text style={[styles.value, { color: '#059669', fontWeight: '700' }]}>
              {harvest.salePrice ? `${harvest.salePrice.toLocaleString('vi-VN')} ₫` : 'Chưa có giá'}
            </Text>
          </View>
          {harvest.note && harvest.note.trim() !== '' && (
            <View style={styles.infoRow}>
              <Text style={styles.labelText}>Ghi chú:</Text>
              <Text style={[styles.value, { flex: 1 }]}>{harvest.note}</Text>
            </View>
          )}
        </View>

        {harvest.harvestGradeDetailDTOs && harvest.harvestGradeDetailDTOs.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Chi tiết loại hàng</Text>
            <View style={styles.gradeContainer}>
              {[...harvest.harvestGradeDetailDTOs]
                .sort((a: any, b: any) => (a.grade || 0) - (b.grade || 0))
                .map((grade: any, index: number) => (
                  <View key={grade.id || index} style={styles.gradeCard}>
                    <Text style={styles.gradeTitle}>Hạng {grade.grade}</Text>
                    <Text style={styles.gradeQuantity}>
                      {grade.quantity} {grade.unit || harvest.unit}
                    </Text>
                  </View>
                ))}
            </View>
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
  labelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    width: 110,
  },
  value: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  gradeContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  gradeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '32%',
    alignItems: 'center',
  },
  gradeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  gradeQuantity: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
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
    flexWrap: 'nowrap',
  },
  formLabelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 4,
  },
  required: {
    color: '#EF4444',
    fontSize: 14,
    flexShrink: 0,
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
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  dateInputText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  suggestionsBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  iosDatePickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  iosDatePickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iosDatePickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  iosDatePickerButton: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  priceDropdownButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceDropdownText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  toggleLabelContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailsSection: {
    backgroundColor: '#FAFBFC',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  detailInputGroup: {
    marginBottom: 16,
    gap: 12,
  },
  detailInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailInput: {
    flex: 1,
  },
  detailTextInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  addDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  addDetailButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  detailsList: {
    gap: 10,
  },
  detailCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailCardContent: {
    flex: 1,
  },
  detailCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  detailCardPrice: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailCardDeviation: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  deleteDetailButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
