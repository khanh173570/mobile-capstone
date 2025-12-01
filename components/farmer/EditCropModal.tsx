import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { X, Calendar, ChevronDown, MapPin } from 'lucide-react-native';
import { UpdateCropData, getCustardAppleTypes, CustardAppleType, Crop } from '../../services/cropService';
import { CROP_STATUSES } from '../../utils/cropStatusUtils';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getProvinces, getWardsFromProvince, Province, Ward } from '../../services/addressService';

interface EditCropModalProps {
  visible: boolean;
  crop: Crop | null;
  onClose: () => void;
  onSubmit: (cropData: UpdateCropData) => Promise<void>;
}

export default function EditCropModal({ visible, crop, onClose, onSubmit }: EditCropModalProps) {
  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);
  const [custardAppleTypes, setCustardAppleTypes] = useState<CustardAppleType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  
  // Address selection states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [showWardPicker, setShowWardPicker] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  
  const [formData, setFormData] = useState<UpdateCropData>({
    name: '',
    area: 0,
    custardAppleTypeID: '',
    farmingDuration: 0,
    status: 0, // Default to "Mới trồng"
    startPlantingDate: new Date().toISOString(),
    nearestHarvestDate: undefined, // Changed to undefined
    note: '',
    treeCount: 0,
    address: '',
    district: '',
    province: '',
  });

  // Load custard apple types and provinces when modal opens
  useEffect(() => {
    if (visible) {
      loadCustardAppleTypes();
      loadProvinces();
    }
  }, [visible]);

  // Populate form data when crop changes and modal is visible
  useEffect(() => {
    if (visible && crop) {
      setFormData({
        name: crop.name || '',
        area: crop.area,
        custardAppleTypeID: crop.custardAppleTypeID || '',
        farmingDuration: crop.farmingDuration,
        status: crop.status || 0, // Use crop status or default to 0
        startPlantingDate: crop.startPlantingDate,
        nearestHarvestDate: crop.nearestHarvestDate || undefined, // Handle null value
        note: crop.note || '',
        treeCount: crop.treeCount,
        address: crop.address || '',
        district: crop.district || '',
        province: crop.province || '',
      });
    }
  }, [visible, crop]);

  // Match existing ward after wards are loaded
  useEffect(() => {
    if (visible && crop && wards.length > 0 && !loadingWards && !selectedWard) {
      const matchingWard = wards.find(w => w.full_name === crop.district);
      if (matchingWard) {
        setSelectedWard(matchingWard);
      }
    }
  }, [visible, crop, wards, loadingWards, selectedWard]);

  // Ensure custardAppleTypeID is set after types are loaded (only if not already set)
  useEffect(() => {
    if (visible && crop && custardAppleTypes.length > 0 && !loadingTypes && !formData.custardAppleTypeID) {
      let matchingType = null;
      
      // Try to match by custardAppleTypeID first
      if (crop.custardAppleTypeID) {
        matchingType = custardAppleTypes.find(t => t.id === crop.custardAppleTypeID);
      }
      
      // If no match by ID, try to match by custardAppleType name
      if (!matchingType && crop.custardAppleType) {
        matchingType = custardAppleTypes.find(t => t.name === crop.custardAppleType);
      }
      
      if (matchingType) {
        console.log('Auto-setting type from crop:', matchingType.name);
        setFormData(prev => ({
          ...prev,
          custardAppleTypeID: matchingType.id,
        }));
      }
    }
  }, [visible, crop, custardAppleTypes, loadingTypes, formData.custardAppleTypeID]);

  const loadCustardAppleTypes = async () => {
    setLoadingTypes(true);
    try {
      const types = await getCustardAppleTypes();
      setCustardAppleTypes(types);
    } catch (error) {
      console.error('Error loading custard apple types:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách loại mãng cầu');
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadProvinces = async () => {
    try {
      const provincesData = await getProvinces();
      setProvinces(provincesData);
      
      // Find and set Tây Ninh as default
      const tayNinh = provincesData.find(p => p.full_name.includes('Tây Ninh'));
      if (tayNinh) {
        setSelectedProvince(tayNinh);
        setFormData(prev => ({ ...prev, province: tayNinh.full_name }));
        loadWards(tayNinh.id);
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách tỉnh thành');
    }
  };

  const loadWards = async (provinceId: string) => {
    setLoadingWards(true);
    try {
      const wardsData = await getWardsFromProvince(provinceId);
      setWards(wardsData);
    } catch (error) {
      console.error('Error loading wards:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách xã/phường');
    } finally {
      setLoadingWards(false);
    }
  };

  const calculateFarmingDuration = (startDate: string): number => {
    const start = new Date(startDate);
    const now = new Date();
    const diffYears = now.getFullYear() - start.getFullYear();
    const monthDiff = now.getMonth() - start.getMonth();
    
    // Adjust if haven't reached the anniversary this year
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < start.getDate())) {
      return Math.max(0, diffYears - 1);
    }
    
    return Math.max(0, diffYears);
  };

  const handleSubmit = async () => {
    // Debug form data
    console.log('Form data before validation:', formData);
    
    // Validation - check all required fields
    if (!formData.name || formData.name.trim().length < 6) {
      Alert.alert('Lỗi', 'Tên vườn phải có ít nhất 6 ký tự');
      return;
    }
    if (!formData.custardAppleTypeID) {
      console.log('Validation failed: custardAppleTypeID');
      Alert.alert('Lỗi', 'Vui lòng chọn loại mãng cầu');
      return;
    }
    if (formData.area <= 0) {
      console.log('Validation failed: area');
      Alert.alert('Lỗi', 'Vui lòng nhập diện tích hợp lệ (phải lớn hơn 0)');
      return;
    }
    if (formData.treeCount <= 0) {
      console.log('Validation failed: treeCount');
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng cây (phải lớn hơn 0)');
      return;
    }
    if (!formData.address.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ chi tiết');
      return;
    }
    if (!selectedWard) {
      Alert.alert('Lỗi', 'Vui lòng chọn xã/phường');
      return;
    }
    if (!selectedProvince) {
      Alert.alert('Lỗi', 'Tỉnh/thành phố chưa được chọn');
      return;
    }
    if (!formData.startPlantingDate || formData.startPlantingDate.trim() === '') {
      console.log('Validation failed: startPlantingDate');
      Alert.alert('Lỗi', 'Vui lòng chọn ngày bắt đầu trồng');
      return;
    }
    // Validate harvest date only if it's provided
    if (formData.nearestHarvestDate && formData.nearestHarvestDate.trim() !== '') {
      const harvestDate = new Date(formData.nearestHarvestDate);
      const plantingDate = new Date(formData.startPlantingDate);
      const today = new Date();
      
      // Reset time for accurate date comparison
      today.setHours(0, 0, 0, 0);
      harvestDate.setHours(0, 0, 0, 0);
      plantingDate.setHours(0, 0, 0, 0);
      
      // Check if harvest date is after planting date
      if (harvestDate <= plantingDate) {
        Alert.alert('Lỗi', 'Ngày thu hoạch phải sau ngày bắt đầu trồng');
        return;
      }
      
      // Check if harvest date is before or equal to today
      if (harvestDate > today) {
        Alert.alert('Lỗi', 'Ngày thu hoạch phải là ngày trong quá khứ hoặc hôm nay (đã thu hoạch)');
        return;
      }
    }

    setLoading(true);
    try {
      // Calculate farming duration in years (auto-update based on current date)
      const farmingDuration = calculateFarmingDuration(formData.startPlantingDate);
      
      // Prepare data - convert empty strings to "không có"
      const submitData = {
        ...formData,
        farmingDuration, // Always recalculate
        note: formData.note.trim() || 'không có',
        province: selectedProvince?.full_name || formData.province,
        district: selectedWard?.full_name || formData.district,
      };
      
      await onSubmit(submitData);
    } catch (error) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const isoDate = selectedDate.toISOString();
      setFormData(prev => ({
        ...prev,
        startPlantingDate: isoDate,
      }));
    }
  };

  const handleHarvestDateChange = (event: any, selectedDate?: Date) => {
    setShowHarvestDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        nearestHarvestDate: selectedDate.toISOString(),
      }));
    }
  };

  const formatDateDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (!crop) return null;

  // Check if modal should be in view-only mode
  const isViewOnly = crop.status === 2;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {isViewOnly ? 'Xem chi tiết vườn' : 'Cập nhật vườn'}
          </Text>
          {isViewOnly && (
            <View style={styles.viewOnlyBadge}>
              <Text style={styles.viewOnlyBadgeText}>Đang có đấu giá</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
            disabled={loading}
          >
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Custard Apple Type Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Loại mãng cầu *</Text>
            {loadingTypes ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#22C55E" />
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTypePicker(!showTypePicker)}
                  disabled={loading || isViewOnly}
                >
                  <Text style={styles.pickerButtonText}>
                    {(() => {
                      // First priority: Show selected type from formData
                      if (formData.custardAppleTypeID) {
                        const selectedType = custardAppleTypes.find(t => t.id === formData.custardAppleTypeID);
                        if (selectedType) {
                          return selectedType.name;
                        }
                      }
                      
                      // Second priority: Show crop's existing custardAppleType name
                      if (crop && crop.custardAppleType && !formData.custardAppleTypeID) {
                        return crop.custardAppleType;
                      }
                      
                      // Default: placeholder text
                      return 'Chọn loại mãng cầu';
                    })()}
                  </Text>
                  <ChevronDown size={20} color="#6B7280" />
                </TouchableOpacity>

                {/* Type Picker Dropdown */}
                {showTypePicker && (
                  <View style={styles.pickerDropdown}>
                    <ScrollView style={styles.pickerScrollView} nestedScrollEnabled>
                      {custardAppleTypes.map((type) => (
                        <TouchableOpacity
                          key={type.id}
                          style={[
                            styles.pickerItem,
                            formData.custardAppleTypeID === type.id && styles.pickerItemSelected
                          ]}
                          onPress={() => {
                            console.log('Selected type:', type.name, 'ID:', type.id);
                            setFormData(prev => ({ 
                              ...prev, 
                              custardAppleTypeID: type.id 
                            }));
                            setShowTypePicker(false);
                          }}
                        >
                          <Text style={[
                            styles.pickerItemName,
                            formData.custardAppleTypeID === type.id && styles.pickerItemNameSelected
                          ]}>
                            {type.name}
                          </Text>
                          <Text style={styles.pickerItemDescription}>{type.description}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Crop Status Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Trạng thái vườn *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowStatusPicker(!showStatusPicker)}
              disabled={loading || isViewOnly}
            >
              <View style={{ 
                width: 16, 
                height: 16, 
                borderRadius: 8, 
                backgroundColor: CROP_STATUSES[formData.status || 0].color,
                marginRight: 8
              }} />
              <Text style={styles.pickerButtonText}>
                {CROP_STATUSES[formData.status || 0].name}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>

            {/* Status Picker Dropdown */}
            {showStatusPicker && (
              <View style={styles.pickerDropdown}>
                <ScrollView style={styles.pickerScrollView} nestedScrollEnabled>
                  {CROP_STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status.id}
                      style={[
                        styles.pickerItem,
                        formData.status === status.id && styles.pickerItemSelected
                      ]}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, status: status.id }));
                        setShowStatusPicker(false);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: 6, 
                          backgroundColor: status.color,
                          marginRight: 10
                        }} />
                        <View style={{ flex: 1 }}>
                          <Text style={[
                            styles.pickerItemName,
                            formData.status === status.id && styles.pickerItemNameSelected
                          ]}>
                            {status.name}
                          </Text>
                          <Text style={styles.pickerItemDescription}>{status.description}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Crop Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên vườn *</Text>
            <Text style={styles.inputHint}>(Tối thiểu 6 ký tự)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập tên vườn"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              editable={!loading && !isViewOnly}
              maxLength={50}
            />
          </View>

          {/* Start Planting Date - Read Only */}
          <View style={[styles.inputGroup, styles.readOnlyInputGroup]}>
            <Text style={[styles.inputLabel, styles.readOnlyInputLabel]}>Ngày bắt đầu trồng *</Text>
            <Text style={styles.readOnlyHint}>🔒 Không thể chỉnh sửa khi cập nhật</Text>
            <View style={[styles.dateButton, styles.readOnlyDateButton]}>
              <Calendar size={20} color="#059669" />
              <Text style={[styles.dateButtonText, styles.readOnlyDateButtonText]}>
                {formatDateDisplay(formData.startPlantingDate)}
              </Text>
            </View>
            
            {/* Auto-calculated farming duration display */}
            <View style={styles.autoCalculatedInfo}>
              <Text style={styles.autoCalculatedLabel}>
                Thời gian canh tác (tự động cập nhật): 
                <Text style={styles.autoCalculatedValue}>
                  {' '}{calculateFarmingDuration(formData.startPlantingDate)} năm
                </Text>
              </Text>
            </View>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={new Date(formData.startPlantingDate)}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}

          {/* Nearest Harvest Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày thu hoạch gần nhất *</Text>
            <Text style={styles.inputHint}>(Phải sau ngày trồng và trước hôm nay)</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowHarvestDatePicker(true)}
              disabled={loading || isViewOnly}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={[
                styles.dateButtonText,
                !formData.nearestHarvestDate && { color: '#9CA3AF' }
              ]}>
                {formData.nearestHarvestDate 
                  ? formatDateDisplay(formData.nearestHarvestDate)
                  : 'Chọn ngày thu hoạch'
                }
              </Text>
            </TouchableOpacity>
          </View>

          {showHarvestDatePicker && (
            <DateTimePicker
              value={formData.nearestHarvestDate 
                ? new Date(formData.nearestHarvestDate) 
                : new Date()
              }
              mode="date"
              display="default"
              onChange={handleHarvestDateChange}
              minimumDate={new Date(formData.startPlantingDate)}
              maximumDate={new Date()}
            />
          )}

          {/* Area */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Diện tích (m²) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập diện tích"
              keyboardType="numeric"
              value={formData.area > 0 ? formData.area.toString() : ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, area: parseInt(text) || 0 }))}
              editable={!loading && !isViewOnly}
            />
          </View>

          {/* Tree Count */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số lượng cây *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập số lượng cây"
              keyboardType="numeric"
              value={formData.treeCount > 0 ? formData.treeCount.toString() : ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, treeCount: parseInt(text) || 0 }))}
              editable={!loading && !isViewOnly}
            />
          </View>

          {/* Province - Read only (Tây Ninh) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tỉnh/Thành phố *</Text>
            <View style={styles.readOnlyField}>
              <MapPin size={20} color="#22C55E" />
              <Text style={styles.readOnlyFieldText}>
                {selectedProvince?.full_name || formData.province || 'Đang tải...'}
              </Text>
            </View>
          </View>

          {/* Ward Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Xã/Phường *</Text>
            {loadingWards ? (
              <View style={styles.wardLoadingContainer}>
                <ActivityIndicator size="small" color="#22C55E" />
                <Text style={styles.wardLoadingText}>Đang tải xã/phường...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowWardPicker(!showWardPicker)}
                  disabled={loading || wards.length === 0 || isViewOnly}
                >
                  <Text style={[
                    styles.pickerButtonText,
                    !selectedWard && { color: '#9CA3AF' }
                  ]}>
                    {selectedWard?.full_name || formData.district || 'Chọn xã/phường'}
                  </Text>
                  <ChevronDown size={20} color="#6B7280" />
                </TouchableOpacity>

                {showWardPicker && (
                  <View style={styles.pickerDropdown}>
                    <ScrollView style={styles.pickerScrollView} nestedScrollEnabled>
                      {wards.map((ward) => (
                        <TouchableOpacity
                          key={ward.id}
                          style={[
                            styles.pickerItem,
                            selectedWard?.id === ward.id && styles.pickerItemSelected
                          ]}
                          onPress={() => {
                            setSelectedWard(ward);
                            setFormData(prev => ({ 
                              ...prev, 
                              district: ward.full_name 
                            }));
                            setShowWardPicker(false);
                          }}
                        >
                          <Text style={[
                            styles.pickerItemName,
                            selectedWard?.id === ward.id && styles.pickerItemNameSelected
                          ]}>
                            {ward.full_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Detail Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Địa chỉ chi tiết *</Text>
            <Text style={styles.inputHint}>(Số nhà, tên đường, ấp/khu phố)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ví dụ: 123 Đường Nguyễn Trãi, Ấp 3"
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              editable={!loading && !isViewOnly}
              maxLength={200}
            />
          </View>

          {/* Note */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ghi chú</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Nhập ghi chú về vườn"
              value={formData.note}
              onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading && !isViewOnly}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          {isViewOnly ? (
            <TouchableOpacity
              style={[styles.submitButton, { flex: 1 }]}
              onPress={onClose}
            >
              <Text style={styles.submitButtonText}>Đóng</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Cập nhật</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewOnlyBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  viewOnlyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 13,
    color: '#F59E0B',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  dateButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  dateButtonTextDisabled: {
    color: '#9CA3AF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  pickerDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#fff',
    maxHeight: 250,
    overflow: 'hidden',
    elevation: 5,
    zIndex: 1000,
  },
  pickerScrollView: {
    maxHeight: 250,
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  pickerItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  pickerItemNameSelected: {
    color: '#22C55E',
  },
  pickerItemDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  autoCalculatedInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  autoCalculatedLabel: {
    fontSize: 14,
    color: '#92400E',
  },
  autoCalculatedValue: {
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  // Read-only styles
  readOnlyInputGroup: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    marginBottom: 20,
  },
  readOnlyInputLabel: {
    color: '#059669',
    fontWeight: '700',
  },
  readOnlyHint: {
    fontSize: 13,
    color: '#059669',
    marginBottom: 8,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  readOnlyDateButton: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  readOnlyDateButtonText: {
    color: '#059669',
    fontWeight: '600',
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  readOnlyFieldText: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
  },
  wardLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  wardLoadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
