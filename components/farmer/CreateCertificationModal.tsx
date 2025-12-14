import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { X, Upload, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import {
  createCertification,
  getCertificationTypes,
  CertificationType,
  type CreateCertificationRequest,
} from '../../services/certificationService';

interface CreateCertificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCertificationModal({
  visible,
  onClose,
  onSuccess,
}: CreateCertificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<CertificationType>(CertificationType.VietGAP);
  const [certificationName, setCertificationName] = useState('');
  const [issuingOrganization, setIssuingOrganization] = useState('');
  const [issueDate, setIssueDate] = useState(new Date());
  const [expiryDate, setExpiryDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [certificateImage, setCertificateImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const [showTypePicker, setShowTypePicker] = useState(false);

  const certificationTypes = getCertificationTypes();

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCertificateImage({
          uri: asset.uri,
          name: asset.fileName || `certificate_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!certificationName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên chứng chỉ');
      return;
    }
    if (!issuingOrganization.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tổ chức cấp');
      return;
    }
    if (!certificateImage) {
      Alert.alert('Lỗi', 'Vui lòng chọn ảnh chứng chỉ');
      return;
    }
    if (expiryDate <= issueDate) {
      Alert.alert('Lỗi', 'Ngày hết hạn phải sau ngày cấp');
      return;
    }

    try {
      setLoading(true);

      const request: CreateCertificationRequest = {
        type: selectedType,
        certificationName: certificationName.trim(),
        issuingOrganization: issuingOrganization.trim(),
        issueDate: issueDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        certificateImage: certificateImage,
      };

      await createCertification(request);

      Alert.alert(
        'Thành công',
        'Chứng chỉ đã được tạo và đang chờ admin phê duyệt',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              handleClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating certification:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo chứng chỉ');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCertificationName('');
    setIssuingOrganization('');
    setIssueDate(new Date());
    setExpiryDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
    setCertificateImage(null);
    setSelectedType(CertificationType.VietGAP);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tạo chứng chỉ mới</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Loại chứng chỉ <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTypePicker(!showTypePicker)}
            >
              <Text style={styles.pickerButtonText}>
                {certificationTypes.find(t => t.value === selectedType)?.label}
              </Text>
            </TouchableOpacity>
            {showTypePicker && (
              <View style={styles.pickerContainer}>
                {certificationTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.pickerItem,
                      selectedType === type.value && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedType(type.value);
                      setShowTypePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedType === type.value && styles.pickerItemTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Certification Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Tên chứng chỉ <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={certificationName}
              onChangeText={setCertificationName}
              placeholder="Ví dụ: Chứng chỉ VietGAP"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Issuing Organization */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Tổ chức cấp <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={issuingOrganization}
              onChangeText={setIssuingOrganization}
              placeholder="Ví dụ: Việt Nam"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Issue Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Ngày cấp <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowIssueDatePicker(true)}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {issueDate.toLocaleDateString('vi-VN')}
              </Text>
            </TouchableOpacity>
            {showIssueDatePicker && (
              <DateTimePicker
                value={issueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowIssueDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setIssueDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          {/* Expiry Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Ngày hết hạn <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowExpiryDatePicker(true)}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {expiryDate.toLocaleDateString('vi-VN')}
              </Text>
            </TouchableOpacity>
            {showExpiryDatePicker && (
              <DateTimePicker
                value={expiryDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={issueDate}
                onChange={(event, selectedDate) => {
                  setShowExpiryDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setExpiryDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          {/* Certificate Image */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Ảnh chứng chỉ <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickImage}
            >
              <Upload size={20} color="#22C55E" />
              <Text style={styles.uploadButtonText}>
                {certificateImage ? 'Đổi ảnh' : 'Chọn ảnh'}
              </Text>
            </TouchableOpacity>
            {certificateImage && (
              <Image
                source={{ uri: certificateImage.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
          </View>

          <Text style={styles.note}>
            * Chứng chỉ sẽ được gửi đến admin để phê duyệt. Bạn sẽ nhận được thông báo khi chứng chỉ được duyệt.
          </Text>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Tạo chứng chỉ</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  pickerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 15,
    color: '#111827',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemSelected: {
    backgroundColor: '#DCFCE7',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#111827',
  },
  pickerItemTextSelected: {
    fontWeight: '600',
    color: '#16A34A',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#111827',
  },
  uploadButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22C55E',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: '#F3F4F6',
  },
  note: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
