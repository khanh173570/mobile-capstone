import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createBuyRequest } from '../../services/buyRequestService';
import Header from '../../components/shared/Header';
import { ChevronDown } from 'lucide-react-native';

export default function CreateBuyRequestScreen() {
  const [custardAppleTypes, setCustardAppleTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    productTypeId: '',
    requiredQuantity: '',
    desiredPrice: '',
    requiredDate: new Date(),
    location: '',
    notes: '',
  });

  const [showProductModal, setShowProductModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadCustardAppleTypes();
  }, []);

  const loadCustardAppleTypes = async () => {
    try {
      // Types are hardcoded for now
      setCustardAppleTypes([]);
    } catch (error) {
      console.error('Error loading custard apple types:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách loại sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFormData(prev => ({ ...prev, requiredDate: selectedDate }));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setFormData(prev => ({ ...prev, requiredDate: selectedTime }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề yêu cầu');
      return;
    }
    if (!formData.productTypeId) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại sản phẩm');
      return;
    }
    if (!formData.requiredQuantity.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng cần thiết');
      return;
    }
    if (!formData.desiredPrice.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá mong muốn');
      return;
    }
    if (!formData.location.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập vị trí');
      return;
    }

    try {
      setSubmitting(true);
      Alert.alert('Thông báo', 'Feature chưa được implement đầy đủ');
    } catch (error) {
      console.error('Error creating buy request:', error);
      Alert.alert('Lỗi', 'Không thể tạo yêu cầu mua');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Tạo yêu cầu mua" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Tạo yêu cầu mua" />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Spacer for header */}
        <View style={styles.headerSpacer} />

        {/* Title Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tiêu đề yêu cầu *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tiêu đề yêu cầu"
            placeholderTextColor="#9CA3AF"
            value={formData.title}
            onChangeText={text => setFormData(prev => ({ ...prev, title: text }))}
          />
        </View>

        {/* Product Type Picker */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Loại sản phẩm *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowProductModal(true)}
          >
            <Text style={styles.pickerButtonText}>
              {custardAppleTypes.find(t => t.id === formData.productTypeId)?.name || 'Chọn loại sản phẩm'}
            </Text>
            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>

          {/* Product Type Modal */}
          <Modal
            visible={showProductModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowProductModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chọn loại sản phẩm</Text>
                  <TouchableOpacity onPress={() => setShowProductModal(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={custardAppleTypes}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, productTypeId: item.id }));
                        setShowProductModal(false);
                      }}
                    >
                      <View>
                        <Text style={styles.modalItemName}>{item.name}</Text>
                        <Text style={styles.modalItemDescription} numberOfLines={1}>
                          {item.description}
                        </Text>
                      </View>
                      {formData.productTypeId === item.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  keyExtractor={item => item.id}
                  scrollEnabled
                  nestedScrollEnabled
                />
              </View>
            </View>
          </Modal>
        </View>

        {/* Required Quantity */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Số lượng cần thiết (kg) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số lượng"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.requiredQuantity}
            onChangeText={text => setFormData(prev => ({ ...prev, requiredQuantity: text }))}
          />
        </View>

        {/* Desired Price */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Giá mong muốn (₫) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập giá mong muốn"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.desiredPrice}
            onChangeText={text => setFormData(prev => ({ ...prev, desiredPrice: text }))}
          />
        </View>

        {/* Required Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Ngày cần thiết *</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {formData.requiredDate.toLocaleDateString('vi-VN')}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.timeButtonText}>
                {String(formData.requiredDate.getHours()).padStart(2, '0')}:
                {String(formData.requiredDate.getMinutes()).padStart(2, '0')}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.requiredDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={formData.requiredDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              is24Hour={true}
            />
          )}
        </View>

        {/* Location */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Vị trí *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập vị trí"
            placeholderTextColor="#9CA3AF"
            value={formData.location}
            onChangeText={text => setFormData(prev => ({ ...prev, location: text }))}
          />
        </View>

        {/* Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Ghi chú</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nhập ghi chú thêm"
            placeholderTextColor="#9CA3AF"
            multiline={true}
            numberOfLines={4}
            value={formData.notes}
            onChangeText={text => setFormData(prev => ({ ...prev, notes: text }))}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Tạo yêu cầu mua</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 0,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 32,
  },
  headerSpacer: {
    marginTop: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#111827',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  timeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  timeButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  datePickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  datePickerContent: {
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  modalItemDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  checkmark: {
    fontSize: 18,
    color: '#16A34A',
    fontWeight: 'bold',
  },
  dateInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  dateTimePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    gap: 12,
  },
  pickerSection: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
  },
  dateInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateAdjustButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateAdjustText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  dateDisplayValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    minWidth: 50,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
