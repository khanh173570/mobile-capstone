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
import { CreateHarvestData } from '../../services/harvestService';
import { checkCropHasActiveAuction } from '../../services/auctionService';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CreateHarvestModalProps {
  visible: boolean;
  cropId: string;
  cropPlantingDate?: string; // Ngày trồng của crop để validation
  onClose: () => void;
  onSubmit: (harvestData: CreateHarvestData) => Promise<void>;
}

export default function CreateHarvestModal({ visible, cropId, cropPlantingDate, onClose, onSubmit }: CreateHarvestModalProps) {
  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [checkingAuction, setCheckingAuction] = useState(false);
  const [hasActiveAuction, setHasActiveAuction] = useState(false);
  
  const [formData, setFormData] = useState<CreateHarvestData>({
    startDate: new Date().toISOString(),
    note: '',
    cropID: cropId,
  });

  // Check for active auctions when modal opens
  useEffect(() => {
    if (visible && cropId) {
      checkActiveAuction();
    }
  }, [visible, cropId]);

  const checkActiveAuction = async () => {
    setCheckingAuction(true);
    try {
      const hasActive = await checkCropHasActiveAuction(cropId);
      setHasActiveAuction(hasActive);
      
      if (hasActive) {
        Alert.alert(
          'Không thể tạo mùa vụ mới',
          'Cây trồng này đang có đấu giá đang diễn ra (Pending/Approved/OnGoing). Vui lòng chờ đến khi đấu giá kết thúc.',
          [
            {
              text: 'Đóng',
              onPress: onClose,
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking active auction:', error);
      setHasActiveAuction(false);
    } finally {
      setCheckingAuction(false);
    }
  };

  const handleSubmit = async () => {
    // Double check for active auction before submitting
    if (hasActiveAuction) {
      Alert.alert(
        'Không thể tạo mùa vụ mới',
        'Cây trồng này đang có đấu giá đang diễn ra. Vui lòng chờ đến khi đấu giá kết thúc.'
      );
      return;
    }

    console.log('=== CreateHarvest Submit ===');
    console.log('FormData:', formData);
    console.log('CropPlantingDate:', cropPlantingDate);
    
    // Validation - check all required fields
    if (!formData.startDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày bắt đầu mùa vụ');
      return;
    }

    const startDate = new Date(formData.startDate);
    const today = new Date();
    
    // Reset time for accurate date comparison
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    // Check if harvest start date is not in the future
    if (startDate > today) {
      Alert.alert('Lỗi', 'Ngày bắt đầu mùa vụ không được chọn ngày tương lai');
      return;
    }

    // Check if harvest start date is after crop planting date (only if cropPlantingDate is provided and valid)
    if (cropPlantingDate && cropPlantingDate.trim() !== '') {
      try {
        const plantingDate = new Date(cropPlantingDate);
        
        // Check if plantingDate is valid
        if (!isNaN(plantingDate.getTime())) {
          plantingDate.setHours(0, 0, 0, 0);
          
          if (startDate <= plantingDate) {
            Alert.alert('Lỗi', 'Ngày bắt đầu mùa vụ phải sau ngày trồng cây');
            return;
          }
        }
      } catch (error) {
        console.log('Invalid cropPlantingDate:', cropPlantingDate);
        // Continue without planting date validation if date is invalid
      }
    }

    setLoading(true);
    try {
      // Prepare data - convert empty strings to "Không có"
      const submitData = {
        ...formData,
        note: formData.note.trim() || 'Không có',
        cropID: cropId,
      };
      
      console.log('Submitting harvest data:', submitData);
      await onSubmit(submitData);
      
      // Reset form
      setFormData({
        startDate: new Date().toISOString(),
        note: '',
        cropID: cropId,
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
      setFormData(prev => ({
        ...prev,
        startDate: selectedDate.toISOString(),
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
          <Text style={styles.modalTitle}>Tạo mùa vụ mới</Text>
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
            <Text style={styles.inputHint}>
              {cropPlantingDate && cropPlantingDate.trim() !== '' 
                ? (() => {
                    try {
                      const plantingDate = new Date(cropPlantingDate);
                      return !isNaN(plantingDate.getTime()) 
                        ? `(Phải sau ngày trồng ${formatDateDisplay(cropPlantingDate)} và không quá hôm nay)`
                        : '(Không được chọn ngày tương lai)';
                    } catch {
                      return '(Không được chọn ngày tương lai)';
                    }
                  })()
                : '(Không được chọn ngày tương lai)'}
            </Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
              disabled={loading || hasActiveAuction}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {formatDateDisplay(formData.startDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {showStartDatePicker && !hasActiveAuction && (
            <DateTimePicker
              value={new Date(formData.startDate)}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
              minimumDate={
                cropPlantingDate && cropPlantingDate.trim() !== '' 
                  ? (() => {
                      try {
                        const plantingDate = new Date(cropPlantingDate);
                        return !isNaN(plantingDate.getTime()) ? plantingDate : undefined;
                      } catch {
                        return undefined;
                      }
                    })()
                  : undefined
              }
              maximumDate={new Date()} // Today or earlier
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
              editable={!loading && !hasActiveAuction}
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Sau khi tạo mùa vụ, bạn có thể cập nhật thông tin chi tiết như ngày thu hoạch, sản lượng và giá bán.
            </Text>
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
            style={[styles.submitButton, (loading || hasActiveAuction) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || hasActiveAuction}
          >
            {loading || checkingAuction ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Tạo mùa vụ</Text>
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
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
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
