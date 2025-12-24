import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, AlertCircle } from 'lucide-react-native';
import { rescheduleHarvestDate } from '../../services/auctionService';

interface RescheduleHarvestDateModalProps {
  visible: boolean;
  auctionId: string;
  currentExpectedHarvestDate: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleHarvestDateModal: React.FC<RescheduleHarvestDateModalProps> = ({
  visible,
  auctionId,
  currentExpectedHarvestDate,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(currentExpectedHarvestDate)
  );
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const currentDate = new Date(currentExpectedHarvestDate);
  const maxDate = new Date(currentDate);
  maxDate.setDate(maxDate.getDate() + 3); // Max 3 days extension

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
      setError(''); // Clear error when user changes date
      
      // Validate on change
      if (date <= currentDate) {
        setError('Ngày mới phải sau ngày dự kiến hiện tại');
      } else if (date > maxDate) {
        setError('Chỉ có thể gia hạn tối đa 3 ngày');
      }
    }
    
    if (event.type === 'set') {
      setShowDatePicker(false);
    }
  };

  const validateForm = (): boolean => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do gia hạn');
      return false;
    }

    if (reason.trim().length < 5) {
      setError('Lý do phải có ít nhất 5 ký tự');
      return false;
    }

    if (selectedDate <= currentDate) {
      setError('Ngày mới phải sau ngày dự kiến hiện tại');
      return false;
    }

    if (selectedDate > maxDate) {
      setError('Chỉ có thể gia hạn tối đa 3 ngày');
      return false;
    }

    return true;
  };

  const handleReschedule = async () => {
    if (!validateForm()) {
      return;
    }

    Alert.alert(
      'Xác nhận gia hạn ngày',
      `Bạn có chắc muốn gia hạn đến ${selectedDate.toLocaleDateString('vi-VN')}?\n\nLý do: ${reason}`,
      [
        {
          text: 'Hủy',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Gia hạn',
          onPress: async () => {
            try {
              setLoading(true);
              setError('');
              
              const isoDate = selectedDate.toISOString();
              const success = await rescheduleHarvestDate(
                auctionId,
                isoDate,
                reason.trim()
              );

              if (success) {
                Alert.alert(
                  'Thành công',
                  `Đã gia hạn ngày thu hoạch đến ${selectedDate.toLocaleDateString('vi-VN')}`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        setReason('');
                        setSelectedDate(new Date(currentExpectedHarvestDate));
                        onClose();
                        onSuccess();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Lỗi', 'Không thể gia hạn ngày. Vui lòng thử lại.');
                onClose();
              }
            } catch (err: any) {
              console.error('Error rescheduling harvest date:', err);
              // Show error but close modal to prevent crash
              Alert.alert(
                'Lỗi',
                err.message || 'Không thể gia hạn ngày. Vui lòng thử lại.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onClose();
                    },
                  },
                ]
              );
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const daysExtending = Math.ceil(
    (selectedDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Gia hạn ngày thu hoạch</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <MaterialIcons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {/* Current Date Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ngày hiện tại</Text>
              <View style={styles.dateBox}>
                <Calendar size={20} color="#6B7280" />
                <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
              </View>
            </View>

            {/* Max Extension Info */}
            <View style={styles.infoBox}>
              <AlertCircle size={18} color="#EA580C" />
              <Text style={styles.infoText}>
                Chỉ có thể gia hạn tối đa 3 ngày từ ngày dự kiến hiện tại
              </Text>
            </View>

            {/* New Date Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chọn ngày mới</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color="#059669" />
                <View style={styles.datePickerContent}>
                  <Text style={styles.datePickerLabel}>Ngày gia hạn</Text>
                  <Text style={styles.datePickerValue}>
                    {formatDate(selectedDate)}
                  </Text>
                </View>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)}
                  maximumDate={maxDate}
                />
              )}

              {/* Days Extension Display */}
              {daysExtending > 0 && (
                <View style={styles.extensionBox}>
                  <Text style={styles.extensionLabel}>Gia hạn:</Text>
                  <Text style={styles.extensionValue}>
                    +{daysExtending} {daysExtending === 1 ? 'ngày' : 'ngày'}
                  </Text>
                </View>
              )}
            </View>

            {/* Reason Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lý do gia hạn</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Nhập lý do gia hạn (tối thiểu 5 ký tự)..."
                placeholderTextColor="#9CA3AF"
                value={reason}
                onChangeText={(text) => {
                  setReason(text);
                  setError('');
                }}
                editable={!loading}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {reason.length} / 200 ký tự
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorBox}>
                <MaterialIcons name="error" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleReschedule}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Gia hạn</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    height: '80%',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 14,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 14,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE047',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 14,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
    lineHeight: 20,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#22C55E',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 12,
    gap: 14,
    marginBottom: 18,
  },
  datePickerContent: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  datePickerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  extensionBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
  },
  extensionLabel: {
    fontSize: 15,
    color: '#1E40AF',
    fontWeight: '600',
  },
  extensionValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E40AF',
  },
  reasonInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    marginBottom: 10,
  },
  charCount: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  errorBox: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 14,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  submitButton: {
    backgroundColor: '#059669',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
