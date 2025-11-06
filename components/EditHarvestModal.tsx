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
import { UpdateHarvestData, Harvest } from '../services/harvestService';
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
        harvestDate: harvest.harvestDate || new Date().toISOString(),
        startDate: harvest.startDate,
        totalQuantity: harvest.totalQuantity,
        unit: harvest.unit,
        note: harvest.note || '',
        salePrice: harvest.salePrice,
      });
    }
  }, [visible, harvest]);

  const handleSubmit = async () => {
    // Validation
    if (formData.totalQuantity < 0) {
      Alert.alert('Lỗi', 'Sản lượng không thể âm');
      return;
    }
    if (formData.salePrice < 0) {
      Alert.alert('Lỗi', 'Giá bán không thể âm');
      return;
    }

    // Validate harvest date must be after start date
    const startDate = new Date(formData.startDate);
    const harvestDate = new Date(formData.harvestDate);
    
    if (harvestDate < startDate) {
      Alert.alert('Lỗi', 'Ngày thu hoạch phải sau ngày bắt đầu mùa vụ');
      return;
    }

    setLoading(true);
    try {
      // Prepare data - convert empty strings to "Không có"
      const submitData = {
        ...formData,
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
          {/* Start Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày bắt đầu mùa vụ *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
              disabled={loading}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {formatDateDisplay(formData.startDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={new Date(formData.startDate)}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}

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
              <TextInput
                style={[styles.textInput, styles.unitInput]}
                placeholder="Đơn vị"
                value={formData.unit}
                onChangeText={(text) => setFormData(prev => ({ ...prev, unit: text }))}
                editable={!loading}
              />
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
