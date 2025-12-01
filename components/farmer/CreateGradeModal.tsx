import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, TextInput } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { CreateHarvestGradeDetailData, GRADE_LABELS, createHarvestGradeDetail } from '../../services/harvestGradeDetailService';

interface CreateGradeModalProps {
  visible: boolean;
  harvestId: string;
  existingGrades?: number[]; // Array of existing grade types (1, 2, 3)
  onClose: () => void;
  onSuccess: () => void;
}

type GradeType = 1 | 2 | 3;

export default function CreateGradeModal({ visible, harvestId, existingGrades = [], onClose, onSuccess }: CreateGradeModalProps) {
  const [selectedGrade, setSelectedGrade] = useState<GradeType | null>(null);
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setSelectedGrade(null);
    setQuantity('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    if (!selectedGrade) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại quả');
      return false;
    }

    // Check if grade already exists
    if (existingGrades.includes(selectedGrade)) {
      Alert.alert(
        'Đã tồn tại',
        `Loại "${GRADE_LABELS[selectedGrade]}" đã được tạo rồi.\n\nMỗi loại quả chỉ được tạo 1 lần duy nhất.`,
        [{ text: 'Đóng' }]
      );
      return false;
    }

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
    if (!validateForm()) return;

    try {
      setLoading(true);
      const gradeData: CreateHarvestGradeDetailData = {
        grade: selectedGrade!,
        quantity: parseFloat(quantity),
        unit: 'kg',
        harvestID: harvestId,
      };

      await createHarvestGradeDetail(gradeData);
      
      Alert.alert('Thành công', 'Đã tạo mới đánh giá mùa vụ', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            onSuccess();
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating grade:', error);
      Alert.alert('Lỗi', 'Không thể tạo đánh giá mùa vụ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const GRADE_COLORS: Record<GradeType, { bg: string; border: string; text: string }> = {
    1: { bg: '#FEF3C7', border: '#FBBF24', text: '#D97706' },
    2: { bg: '#E0E7FF', border: '#C7D2FE', text: '#4F46E5' },
    3: { bg: '#F3E8FF', border: '#E9D5FF', text: '#A855F7' },
  };

  const grades: GradeType[] = [1, 2, 3];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Tạo mới đánh giá mùa vụ</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Grade Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Loại quả <Text style={styles.required}>*</Text></Text>
              <View style={styles.gradeGrid}>
                {grades.map((grade) => {
                  const colors = GRADE_COLORS[grade];
                  const isSelected = selectedGrade === grade;
                  const isExisting = existingGrades.includes(grade);
                  
                  return (
                    <TouchableOpacity
                      key={grade}
                      style={[
                        styles.gradeButton,
                        { 
                          backgroundColor: isExisting ? '#F3F4F6' : colors.bg,
                          borderColor: isSelected ? colors.text : (isExisting ? '#D1D5DB' : colors.border),
                          borderWidth: isSelected ? 2 : 1,
                          opacity: isExisting ? 0.5 : 1,
                        },
                      ]}
                      onPress={() => !isExisting && setSelectedGrade(grade)}
                      disabled={isExisting}
                    >
                      <View style={styles.gradeButtonContent}>
                        <Text style={[styles.gradeButtonText, { color: isExisting ? '#9CA3AF' : colors.text }]}>
                          {GRADE_LABELS[grade]}
                        </Text>
                        {isExisting && (
                          <Text style={styles.existingBadge}>Đã tạo</Text>
                        )}
                      </View>
                      {isSelected && !isExisting && (
                        <View style={[styles.checkmark, { backgroundColor: colors.text }]}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Quantity Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Số lượng (kg) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số lượng (phải > 0)"
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
              <Plus size={18} color="#fff" />
              <Text style={styles.submitButtonText}>
                {loading ? 'Đang tạo...' : 'Tạo mới'}
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
  gradeGrid: {
    gap: 8,
  },
  gradeButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  existingBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
    flexDirection: 'row',
    gap: 6,
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
