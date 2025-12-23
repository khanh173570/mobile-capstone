import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { X, Upload, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { getHarvestImages, uploadHarvestImage, deleteHarvestImage, HarvestImage } from '../../services/harvestImageService';

interface HarvestImagesModalProps {
  visible: boolean;
  harvestId: string;
  harvestName: string;
  onClose: () => void;
}

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 64) / 3; // 3 columns with padding

export default function HarvestImagesModal({
  visible,
  harvestId,
  harvestName,
  onClose,
}: HarvestImagesModalProps) {
  const [images, setImages] = useState<HarvestImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (visible && harvestId) {
      loadImages();
    }
  }, [visible, harvestId]);

  const loadImages = async () => {
    //console.log('=== HarvestImagesModal: Loading images ===');
    //console.log('HarvestId:', harvestId);
    //console.log('Visible:', visible);
    setLoading(true);
    try {
      const data = await getHarvestImages(harvestId);
      //console.log('✅ Images loaded successfully!');
      //console.log('Number of images:', data.length);
      //console.log('Images array:', data);
      if (data.length > 0) {
        //console.log('First image sample:', JSON.stringify(data[0], null, 2));
      }
      setImages(data);
      //console.log('State updated with', data.length, 'images');
    } catch (error) {
      console.error('❌ Error loading harvest images:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách ảnh');
    } finally {
      setLoading(false);
      //console.log('Loading finished');
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleUploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const handleUploadImage = async (uri: string) => {
    setUploading(true);
    try {
      //console.log('\n=== STARTING IMAGE UPLOAD ===');
      //console.log('URI:', uri);
      //console.log('HarvestId:', harvestId);
      
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // Create actual FormData object - IMPORTANT: Use 'Images' (plural) as shown in Swagger
      const formData = new FormData();
      formData.append('HarvestId', harvestId);
      
      const imageData: any = {
        uri,
        type,
        name: filename,
      };
      
      // Use 'Images' (array) instead of 'Image' to match Swagger API
      formData.append('Images', imageData);

      //console.log('📤 Uploading to harvestId:', harvestId);
      //console.log('📄 Image filename:', filename);
      //console.log('📋 Image type:', type);
      //console.log('🔑 Using field name: Images (array)');
      
      // Get current count before upload
      const currentCount = images.length;
      //console.log('📊 Current image count before upload:', currentCount);
      
      const result = await uploadHarvestImage(harvestId, formData);
      //console.log('✅ Upload completed!');
      //console.log('📦 Upload result:', JSON.stringify(result, null, 2));
      
      if (!result.isSuccess) {
        throw new Error(result.message || 'Upload failed');
      }
      
      // Retry logic: Try to get images multiple times until new image appears
      //console.log('\n🔄 Attempting to reload images with retry...');
      let retryCount = 0;
      const maxRetries = 5;
      let newImages = images;
      
      while (retryCount < maxRetries) {
        retryCount++;
        // //console.log(`🔄 Retry attempt ${retryCount}/${maxRetries}...`);
        
        // Wait before retry (increasing delay)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        
        // Fetch images
        const fetchedImages = await getHarvestImages(harvestId);
        // //console.log(`📊 Fetched ${fetchedImages.length} images (expected: ${currentCount + 1})`);
        
        if (fetchedImages.length > currentCount) {
          //console.log('✅ New image detected!');
          newImages = fetchedImages;
          break;
        }
        
        if (retryCount < maxRetries) {
          // //console.log(`⏳ No new image yet, waiting ${retryCount + 1}s before next retry...`);
        }
      }
      
      // Update state with latest images
      setImages(newImages);
      // //console.log(`📊 Final image count: ${newImages.length}`);
      // //console.log('=== UPLOAD PROCESS COMPLETED ===\n');
      
      if (newImages.length > currentCount) {
        Alert.alert('Thành công', 'Đã tải ảnh lên thành công');
      } else {
        Alert.alert(
          'Cảnh báo', 
          'Ảnh đã được tải lên server nhưng chưa hiển thị. Vui lòng đóng và mở lại modal để xem ảnh mới.',
          [{ text: 'OK', onPress: () => loadImages() }]
        );
      }
    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa ảnh này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHarvestImage(imageId);
              Alert.alert('Thành công', 'Đã xóa ảnh');
              await loadImages(); // Reload images
            } catch (error: any) {
              console.error('Error deleting image:', error);
              Alert.alert('Lỗi', error.message || 'Không thể xóa ảnh');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Ảnh vụ thu hoạch</Text>
              <Text style={styles.subtitle}>{harvestName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Upload Button */}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#22C55E" />
              ) : (
                <>
                  <Upload size={24} color="#22C55E" />
                  <Text style={styles.uploadButtonText}>Tải ảnh lên</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Debug info */}
            
            {/* Images Grid */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.loadingText}>Đang tải ảnh...</Text>
              </View>
            ) : images.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
                <Text style={styles.emptyHint}>
                  Nhấn nút "Tải ảnh lên" để thêm ảnh
                </Text>
              </View>
            ) : (
              <View style={styles.imagesGrid}>
                {images.map((image) => {
                  //console.log('🖼️ Rendering image:', image.id, image.imageUrl);
                  return (
                    <View key={image.id} style={styles.imageCard}>
                      <Image
                        source={{ uri: image.imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                        onLoad={() => {}} // //console.log('✅ Image loaded:', image.id)
                        onError={(e) => console.error('❌ Image load error:', image.id, e.nativeEvent.error)}
                      />
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteImage(image.id)}
                      >
                        <Trash2 size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

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
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
});
