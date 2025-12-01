import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { X } from 'lucide-react-native';
import { getHarvestImages, HarvestImage } from '../../services/harvestImageService';

interface HarvestImagesGalleryProps {
  harvestId: string;
}

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 48) / 3; // 3 columns

export default function HarvestImagesGallery({ harvestId }: HarvestImagesGalleryProps) {
  const [images, setImages] = useState<HarvestImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (harvestId) {
      loadImages();
    }
  }, [harvestId]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const data = await getHarvestImages(harvestId);
      setImages(data);
    } catch (error) {
      console.error('Error loading harvest images:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#22C55E" />
        <Text style={styles.loadingText}>Đang tải ảnh...</Text>
      </View>
    );
  }

  if (images.length === 0) {
    return null; // Don't show anything if no images
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ảnh vụ thu hoạch ({images.length})</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {images.map((image) => (
          <TouchableOpacity
            key={image.id}
            style={styles.imageCard}
            onPress={() => setSelectedImage(image.imageUrl)}
          >
            <Image
              source={{ uri: image.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedImage(null)}
          >
            <X size={32} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollContent: {
    gap: 8,
  },
  imageCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
