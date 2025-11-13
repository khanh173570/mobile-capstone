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
import { X, Calendar } from 'lucide-react-native';
import { UpdateHarvestData, Harvest } from '../../services/harvestService';
import DateTimePicker from '@react-native-community/datetimepicker';

interface EditHarvestModalProps {
  visible: boolean;
  harvest: Harvest | null;
  onClose: () => void;
  onSubmit: (harvestData: UpdateHarvestData) => Promise<void>;
}

export default function EditHarvestModal({ visible, harvest, onClose, onSubmit }: EditHarvestModalProps) {
  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);
  
  const [formData, setFormData] = useState<UpdateHarvestData>({
    harvestDate: new Date().toISOString(),
    startDate: new Date().toISOString(),
    totalQuantity: 0,
    unit: 'kg',
    note: '',
    salePrice: 0,
  });

  // Populate form when harvest changes
  useEffect(() => {
    if (visible && harvest) {
      setFormData({
        harvestDate: new Date().toISOString(), // Always default to current date
        startDate: harvest.startDate, // Keep original start date (not editable)
        totalQuantity: harvest.totalQuantity,
        unit: 'kg', // Fixed to kg
        note: harvest.note || '',
        salePrice: harvest.salePrice,
      });
    }
  }, [visible, harvest]);

  const handleSubmit = async () => {
    // Validation - check required fields
    if (formData.totalQuantity <= 0) {
      Alert.alert('Lỗi thông số ( sản lượng > 0 )', 'Vui lòng nhập sản lượng thu hoạch hợp lệ');
      return;
    }
    if (formData.salePrice <= 1000) {
     Alert.alert('Lỗi ( Giá trị > 1000 VND )', 'Vui lòng nhập giá sản phẩm hợp lệ');
      return;
    }

    // Validate harvest date must be in the past
    const harvestDate = new Date(formData.harvestDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    
    if (harvestDate > today) {
      Alert.alert('Lỗi', 'Ngày thu hoạch phải là ngày trong quá khứ (đã thu hoạch)');
      return;
    }

    // Validate harvest date must be after start date
    const startDate = new Date(formData.startDate);
    harvestDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    if (harvestDate < startDate) {
      Alert.alert('Lỗi', 'Ngày thu hoạch phải sau ngày bắt đầu mùa vụ');
      return;
    }

    setLoading(true);
    try {
      // Prepare data - convert empty strings to "Không có"
      const submitData = {
        ...formData,
        unit: 'kg', // Force unit to kg
        note: formData.note.trim() || 'Không có',
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
      setFormData(prev => ({
        ...prev,
        startDate: selectedDate.toISOString(),
      }));
    }
  };

  const handleHarvestDateChange = (event: any, selectedDate?: Date) => {
    setShowHarvestDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        harvestDate: selectedDate.toISOString(),
      }));
    }
  };

  const formatDateDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (!harvest) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Cập nhật mùa vụ</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
            disabled={loading}
          >
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Start Date - Read Only */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày bắt đầu mùa vụ *</Text>
            <Text style={styles.inputHint}>(Không thể thay đổi)</Text>
            <View style={[styles.dateButton, styles.dateButtonDisabled]}>
              <Calendar size={20} color="#9CA3AF" />
              <Text style={[styles.dateButtonText, styles.dateButtonTextDisabled]}>
                {formatDateDisplay(formData.startDate)}
              </Text>
            </View>
          </View>

          {/* Harvest Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày thu hoạch *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowHarvestDatePicker(true)}
              disabled={loading}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {formatDateDisplay(formData.harvestDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {showHarvestDatePicker && (
            <DateTimePicker
              value={new Date(formData.harvestDate)}
              mode="date"
              display="default"
              onChange={handleHarvestDateChange}
              minimumDate={new Date(formData.startDate)}
              maximumDate={new Date()}
            />
          )}

          {/* Total Quantity */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sản lượng thu hoạch *</Text>
            <View style={styles.quantityRow}>
              <TextInput
                style={[styles.textInput, styles.quantityInput]}
                placeholder="Nhập sản lượng"
                keyboardType="numeric"
                value={formData.totalQuantity > 0 ? formData.totalQuantity.toString() : ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, totalQuantity: parseFloat(text) || 0 }))}
                editable={!loading}
              />
              <View style={[styles.textInput, styles.unitInput, styles.unitInputDisabled]}>
                <Text style={styles.unitText}>kg</Text>
              </View>
            </View>
          </View>

          {/* Sale Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Giá bán (VNĐ) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập giá bán"
              keyboardType="numeric"
              value={formData.salePrice > 0 ? formData.salePrice.toString() : ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, salePrice: parseFloat(text) || 0 }))}
              editable={!loading}
            />
          </View>

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
              <Text style={styles.submitButtonText}>Cập nhật</Text>
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
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  dateButtonTextDisabled: {
    color: '#9CA3AF',
  },
  inputHint: {
    fontSize: 13,
    color: '#F59E0B',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityInput: {
    flex: 2,
  },
  unitInput: {
    flex: 1,
  },
  unitInputDisabled: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
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
});
