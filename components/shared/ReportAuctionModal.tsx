import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { createReport, getReportTypes } from '../../services/reportService';
import { getCurrentUser } from '../../services/authService';
import { ChevronDown, X } from 'lucide-react-native';

interface ReportModalProps {
  visible: boolean;
  auctionId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReportAuctionModal({
  visible,
  auctionId,
  onClose,
  onSuccess,
}: ReportModalProps) {
  const [selectedType, setSelectedType] = useState<string>('Fraud');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const reportTypes = getReportTypes();

  const handleSubmit = async () => {
    if (!note.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung báo cáo');
      return;
    }

    try {
      setLoading(true);
      const user = await getCurrentUser();

      if (!user) {
        Alert.alert('Lỗi', 'Không thể xác định người dùng');
        return;
      }

      await createReport({
        auctionId,
        reporterId: user.id,
        note: note.trim(),
        reportType: selectedType as 'Fraud' | 'FalseInformation' | 'TechnicalIssue' | 'PolicyViolated' | 'Other',
      });

      Alert.alert('Thành công', 'Báo cáo đã được gửi!', [
        {
          text: 'OK',
          onPress: () => {
            setNote('');
            setSelectedType('Fraud');
            onClose();
            onSuccess?.();
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating report:', error);
      Alert.alert('Lỗi', 'Không thể gửi báo cáo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (value: string) => {
    const type = reportTypes.find(t => t.value === value);
    return type?.label || value;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Báo cáo đấu giá</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Report Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Loại báo cáo *</Text>
              <TouchableOpacity
                style={styles.typeButton}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                disabled={loading}
              >
                <Text style={styles.typeButtonText}>{getTypeLabel(selectedType)}</Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>

              {showTypeDropdown && (
                <View style={styles.dropdown}>
                  <FlatList
                    data={reportTypes}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          selectedType === item.value && styles.dropdownItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedType(item.value);
                          setShowTypeDropdown(false);
                        }}
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedType === item.value && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={item => item.value}
                    scrollEnabled={false}
                  />
                </View>
              )}
            </View>

            {/* Note */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nội dung báo cáo *</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Vui lòng mô tả chi tiết vấn đề..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={5}
                value={note}
                onChangeText={setNote}
                editable={!loading}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {note.length} / 500
              </Text>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>ℹ️ Lưu ý</Text>
              <Text style={styles.infoText}>
                Báo cáo của bạn sẽ được gửi đến đội ngũ quản trị viên. Vui lòng cung cấp thông tin chi tiết và chính xác.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, loading && styles.buttonDisabled]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Gửi báo cáo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  typeButton: {
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
  typeButtonText: {
    fontSize: 14,
    color: '#111827',
  },
  dropdown: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemSelected: {
    backgroundColor: '#DCFCE7',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#111827',
  },
  dropdownItemTextSelected: {
    color: '#16A34A',
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
