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
import { X, Calendar, ChevronDown } from 'lucide-react-native';
import { CreateCropData, getCustardAppleTypes, CustardAppleType } from '../../services/cropService';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CreateCropModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (cropData: CreateCropData) => Promise<void>;
}

export default function CreateCropModal({ visible, onClose, onSubmit }: CreateCropModalProps) {
  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);
  const [custardAppleTypes, setCustardAppleTypes] = useState<CustardAppleType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [showTypePicker, setShowTypePicker] = useState(false);
  
  const [formData, setFormData] = useState<CreateCropData>({
    area: 0,
    custardAppleTypeID: '',
    farmingDuration: 0,
    startPlantingDate: new Date().toISOString(),
    nearestHarvestDate: undefined, // Changed to undefined
    note: '',
    treeCount: 0,
  });

  // Load custard apple types when modal opens
  useEffect(() => {
    if (visible) {
      loadCustardAppleTypes();
    }
  }, [visible]);

  const loadCustardAppleTypes = async () => {
    setLoadingTypes(true);
    try {
      const types = await getCustardAppleTypes();
      setCustardAppleTypes(types);
      // Always set default selection to first item when loading types
      if (types.length > 0) {
        setFormData(prev => ({ ...prev, custardAppleTypeID: types[0].id }));
      }
    } catch (error) {
      console.error('Error loading custard apple types:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách loại mãng cầu');
    } finally {
      setLoadingTypes(false);
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
    // Validation
    if (!formData.custardAppleTypeID) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại mãng cầu');
      return;
    }
    if (formData.area <= 0) {
     Alert.alert('Lỗi thông số (Diện tích > 0)', 'Vui lòng nhập diện tích hợp lệ ');
      return;
    }
    if (formData.treeCount <= 0) {
      Alert.alert('Lỗi thông số (Số lượng > 0)', 'Vui lòng nhập số lượng cây hợp lệ');
      return;
    }

    // Validate dates
    const plantingDate = new Date(formData.startPlantingDate);
    const today = new Date();
    
    // Reset time for accurate date comparison
    today.setHours(0, 0, 0, 0);
    plantingDate.setHours(0, 0, 0, 0);
    
    // Check if planting date is not in the future
    if (plantingDate > today) {
      Alert.alert('Lỗi', 'Ngày bắt đầu trồng không được là ngày trong tương lai');
      return;
    }
    
    // Validate harvest date only if it's provided
    if (formData.nearestHarvestDate && formData.nearestHarvestDate.trim() !== '') {
      const harvestDate = new Date(formData.nearestHarvestDate);
      harvestDate.setHours(0, 0, 0, 0);
      
      // Check if harvest date is after planting date
      if (harvestDate <= plantingDate) {
        Alert.alert('Lỗi', 'Ngày thu hoạch phải sau ngày bắt đầu trồng');
        return;
      }
      
      // Check if harvest date is before today
      if (harvestDate >= today) {
        Alert.alert('Lỗi', 'Ngày thu hoạch phải là ngày trong quá khứ (đã thu hoạch)');
        return;
      }
    }

    setLoading(true);
    try {
      // Calculate farming duration in years
      const farmingDuration = calculateFarmingDuration(formData.startPlantingDate);
      
      // Prepare data - convert empty strings to "không có"
      const submitData = {
        ...formData,
        farmingDuration,
        note: formData.note.trim() || 'không có',
      };
      
      await onSubmit(submitData);
      // Reset form
      setFormData({
        area: 0,
        custardAppleTypeID: custardAppleTypes.length > 0 ? custardAppleTypes[0].id : '',
        farmingDuration: 0,
        startPlantingDate: new Date().toISOString(),
        nearestHarvestDate: undefined, // Changed to undefined
        note: '',
        treeCount: 0,
      });
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Tạo vườn mới</Text>
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
                  disabled={loading}
                >
                  <Text style={styles.pickerButtonText}>
                    {formData.custardAppleTypeID 
                      ? custardAppleTypes.find(t => t.id === formData.custardAppleTypeID)?.name || 'Chọn loại mãng cầu'
                      : 'Chọn loại mãng cầu'
                    }
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
                            setFormData(prev => ({ ...prev, custardAppleTypeID: type.id }));
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

          {/* Area */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Diện tích (m²) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập diện tích"
              keyboardType="numeric"
              value={formData.area > 0 ? formData.area.toString() : ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, area: parseInt(text) || 0 }))}
              editable={!loading}
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
              editable={!loading}
            />
          </View>

          {/* Start Planting Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày bắt đầu trồng *</Text>
            <Text style={styles.inputHint}>(Có thể chọn từ quá khứ đến hôm nay)</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
              disabled={loading}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {formatDateDisplay(formData.startPlantingDate)}
              </Text>
            </TouchableOpacity>
            
            {/* Auto-calculated farming duration display */}
            <View style={styles.autoCalculatedInfo}>
              <Text style={styles.autoCalculatedLabel}>
                Thời gian canh tác (tự động tính): 
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
              maximumDate={new Date()} // Today or earlier
            />
          )}

          {/* Nearest Harvest Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày thu hoạch gần nhất</Text>
            <Text style={styles.inputHint}>(Tùy chọn - có thể để trống nếu chưa thu hoạch)</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowHarvestDatePicker(true)}
              disabled={loading}
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
              minimumDate={new Date(formData.startPlantingDate)} // Must be after planting date
              maximumDate={new Date(Date.now() - 24 * 60 * 60 * 1000)} // Yesterday or earlier
            />
          )}

          {/* Note */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ghi chú</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Nhập ghi chú về mùa vụ"
              value={formData.note}
              onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
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
              <Text style={styles.submitButtonText}>Tạo vườn</Text>
            )}
          </TouchableOpacity>
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
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  autoCalculatedLabel: {
    fontSize: 14,
    color: '#15803D',
  },
  autoCalculatedValue: {
    fontWeight: 'bold',
    color: '#22C55E',
  },
});
