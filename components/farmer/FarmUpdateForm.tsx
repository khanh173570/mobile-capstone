import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Upload, Tractor } from 'lucide-react-native';
import { updateFarm, type UpdateFarmFormData, type FarmFormData } from '../../services/farmService';
import { getPendingFarmId } from '../../services/authService';
import * as ImagePicker from 'expo-image-picker';

interface FarmUpdateFormProps {
  onComplete: () => void;
}

export default function FarmUpdateForm({ onComplete }: FarmUpdateFormProps) {
  const [formData, setFormData] = useState<FarmFormData>({
    name: '',
    farmImage: '',
    description: '',
  });
  // Separate state for the actual file object to upload
  const [farmImageFile, setFarmImageFile] = useState<any>(null);
  const [previewUri, setPreviewUri] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleImagePicker = () => {
    Alert.alert(
      'Chọn hình ảnh trang trại',
      'Vui lòng chọn hoặc chụp hình ảnh cho trang trại của bạn',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chụp ảnh', onPress: () => takePhoto() },
        { text: 'Chọn từ thư viện', onPress: () => pickImage() },
      ]
    );
  };

  const takePhoto = () => {
    (async () => {
      try {
        const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPerm.granted) {
          Alert.alert('Quyền bị từ chối', 'Cần quyền camera để chụp ảnh');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        });

  if ((result as any).canceled) return;

        // Newer expo returns assets array
        const uri = (result as any).assets?.[0]?.uri || (result as any).uri;
        if (!uri) return;

        const fileObj = {
          uri,
          name: `farm_${Date.now()}.jpg`,
          type: 'image/jpeg',
        } as any;

        setPreviewUri(uri);
        setFarmImageFile(fileObj);
        setFormData(prev => ({ ...prev, farmImage: uri }));
      } catch (error) {
        console.error('takePhoto error:', error);
        Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
      }
    })();
  };

  const pickImage = () => {
    (async () => {
      try {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Quyền bị từ chối', 'Cần quyền truy cập thư viện để chọn ảnh');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        });

  if ((result as any).canceled) return;

        const uri = (result as any).assets?.[0]?.uri || (result as any).uri;
        if (!uri) return;

        const fileObj = {
          uri,
          name: `farm_${Date.now()}.jpg`,
          type: 'image/jpeg',
        } as any;

        setPreviewUri(uri);
        setFarmImageFile(fileObj);
        setFormData(prev => ({ ...prev, farmImage: uri }));
      } catch (error) {
        console.error('pickImage error:', error);
        Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
      }
    })();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên trang trại');
      return;
    }

    setIsLoading(true);
    try {
      // Get pending farm ID
      const farmId = await getPendingFarmId();
      if (!farmId) {
        throw new Error('No pending farm ID found');
      }

      // Prepare update data
      const updateData: UpdateFarmFormData = {
        id: farmId,
        name: formData.name,
        farmImageFile: farmImageFile
      };

      const result = await updateFarm(updateData);
      
      if (result.isSuccess) {
        Alert.alert(
          'Thành công',
          'Thông tin trang trại đã được cập nhật thành công!',
          [
            {
              text: 'OK',
                onPress: () => {
                    onComplete();
                    router.replace('/(tabs)/farmer/home');
                  }
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể cập nhật thông tin trang trại');
      }
    } catch (error) {
      console.error('Farm update error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật thông tin trang trại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {/* <View style={styles.iconContainer}>
            <Tractor size={32} color="#22C55E" />
          </View> */}
          <Text style={styles.title}>Cập nhật thông tin trang trại</Text>
          <Text style={styles.subtitle}>
            Vui lòng cung cấp thông tin về trang trại của bạn để tiếp tục
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Farm Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên trang trại *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên trang trại"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              editable={!isLoading}
            />
          </View>

          {/* Farm Image */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hình ảnh trang trại</Text>
            <TouchableOpacity
              style={styles.imageUpload}
              onPress={handleImagePicker}
              disabled={isLoading}
            >
              {previewUri ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: previewUri }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Upload size={24} color="#6B7280" />
                  <Text style={styles.imageUploadText}>Chọn hình ảnh</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Description */}
          {/* <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả trang trại</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả về trang trại của bạn..."
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View> */}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Đang cập nhật...' : 'Cập nhật trang trại'}
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.infoText}>
            * Thông tin bắt buộc. Bạn có thể cập nhật lại thông tin này sau trong phần cài đặt.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  imageUpload: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  imageUploadText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  imagePreview: {
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  imageText: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  info: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});