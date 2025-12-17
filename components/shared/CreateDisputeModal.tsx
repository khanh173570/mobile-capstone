import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { X, Upload, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { createDispute, CreateDisputeRequest } from '../../services/disputeService';

interface CreateDisputeModalProps {
  visible: boolean;
  escrowId: string;
  totalAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDisputeModal: React.FC<CreateDisputeModalProps> = ({
  visible,
  escrowId,
  totalAmount,
  onClose,
  onSuccess,
}) => {
  const [message, setMessage] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [actualGrade1, setActualGrade1] = useState('');
  const [actualGrade2, setActualGrade2] = useState('');
  const [actualGrade3, setActualGrade3] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri);
      setAttachments([...attachments, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!message.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do tranh chấp');
      return;
    }

    if (!actualAmount || isNaN(parseFloat(actualAmount))) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng thực tế hợp lệ');
      return;
    }

    try {
      setLoading(true);

      const request: CreateDisputeRequest = {
        escrowId,
        disputeMessage: message.trim(),
        actualAmount: parseFloat(actualAmount),
        actualGrade1Amount: actualGrade1 ? parseFloat(actualGrade1) : 0,
        actualGrade2Amount: actualGrade2 ? parseFloat(actualGrade2) : 0,
        actualGrade3Amount: actualGrade3 ? parseFloat(actualGrade3) : 0,
        attachments: attachments,
      };

      await createDispute(request);

      Alert.alert(
        'Thành công',
        'Đã tạo yêu cầu tranh chấp. Chờ nông dân xét duyệt.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              onClose();
              // Reset form
              setMessage('');
              setActualAmount('');
              setActualGrade1('');
              setActualGrade2('');
              setActualGrade3('');
              setAttachments([]);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating dispute:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo tranh chấp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Tạo yêu cầu tranh chấp</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Total Amount Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Tổng giá trị hợp đồng</Text>
              <Text style={styles.infoValue}>{totalAmount.toLocaleString('vi-VN')} VND</Text>
            </View>

            {/* Message */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Lý do tranh chấp *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Mô tả chi tiết vấn đề..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
                editable={!loading}
              />
            </View>

            {/* Actual Amounts */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Số lượng thực tế (kg) *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 350"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={actualAmount}
                onChangeText={setActualAmount}
                editable={!loading}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Loại 1 (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={actualGrade1}
                  onChangeText={setActualGrade1}
                  editable={!loading}
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>Loại 2 (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={actualGrade2}
                  onChangeText={setActualGrade2}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Loại 3 (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={actualGrade3}
                onChangeText={setActualGrade3}
                editable={!loading}
              />
            </View>

            {/* Attachments */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Hình ảnh đính kèm</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handlePickImage}
                disabled={loading}
              >
                <Upload size={20} color="#3B82F6" />
                <Text style={styles.uploadButtonText}>Chọn hình ảnh</Text>
              </TouchableOpacity>

              {attachments.length > 0 && (
                <View style={styles.imageGrid}>
                  {attachments.map((uri, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image source={{ uri }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveImage(index)}
                      >
                        <X size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Actions */}
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
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Tạo tranh chấp</Text>
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
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 13,
    color: '#92400E',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B45309',
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 10,
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#EF4444',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
