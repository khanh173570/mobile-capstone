import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, TextInput } from 'react-native';
import { X } from 'lucide-react-native';
import { UpdateHarvestGradeDetailData, updateHarvestGradeDetail, HarvestGradeDetail, GRADE_LABELS } from '../../services/harvestGradeDetailService';

interface EditGradeModalProps {
  visible: boolean;
  grade: HarvestGradeDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditGradeModal({ visible, grade, onClose, onSuccess }: EditGradeModalProps) {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (grade) {
      setQuantity(grade.quantity.toString());
    }
  }, [grade, visible]);

  const resetForm = () => {
    setQuantity('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    if (!quantity || quantity.trim() === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng');
      return false;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Lỗi', 'Số lượng phải là số dương');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !grade) return;

    try {
      setLoading(true);
      const gradeData: UpdateHarvestGradeDetailData = {
        grade: grade.grade,
        quantity: parseFloat(quantity),
        unit: grade.unit,
        harvestID: grade.harvestID,
      };

      await updateHarvestGradeDetail(grade.id, gradeData);
      
      Alert.alert('Thành công', 'Đã cập nhật đánh giá mùa vụ', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            onSuccess();
          },
        },
      ]);
    } catch (error) {
      console.error('Error updating grade:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật đánh giá mùa vụ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!grade) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Cập nhật đánh giá mùa vụ</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Grade Info (Read-only) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Loại quả</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyValue}>{GRADE_LABELS[grade.grade]}</Text>
              </View>
            </View>

            {/* Quantity Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Số lượng (kg) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số lượng"
                placeholderTextColor="#9CA3AF"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Đang cập nhật...' : 'Cập nhật'}
              </Text>
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
    padding: 16,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#EF4444',
  },
  readOnlyField: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyValue: {
    fontSize: 14,
    color: '#111827',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
