import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Brain, Camera, Upload, History, BookOpen, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Lightbulb } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface Detection {
  id: string;
  image: string;
  disease: string;
  confidence: number;
  treatment: string;
  date: string;
}

export default function AIDetectionScreen() {
  const [detections, setDetections] = useState<Detection[]>([
    {
      id: '1',
      image: 'https://images.pexels.com/photos/1459853/pexels-photo-1459853.jpeg?auto=compress&cs=tinysrgb&w=400',
      disease: 'Sâu đục trái',
      confidence: 92,
      treatment: 'Phun thuốc Abamectin 1.8% EC, loại bỏ quả bị nhiễm',
      date: '2024-01-20'
    },
    {
      id: '2',
      image: 'https://images.pexels.com/photos/1379636/pexels-photo-1379636.jpeg?auto=compress&cs=tinysrgb&w=400',
      disease: 'Bệnh thối quả',
      confidence: 88,
      treatment: 'Cải thiện thoát nước, phun fungicide Copper oxychloride',
      date: '2024-01-18'
    }
  ]);

  const handleTakePhoto = async () => {
  // xin quyền camera
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Lỗi', 'Cần cấp quyền sử dụng camera');
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled) {
    addDetection(result.assets[0].uri);
  }
};

const handleUploadPhoto = async () => {
  // xin quyền gallery
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled) {
    addDetection(result.assets[0].uri);
  }
};

const addDetection = (imageUri: string) => {
  const newDetection: Detection = {
    id: Date.now().toString(),
    image: imageUri, // dùng ảnh vừa chọn
    disease: 'Rệp sáp',
    confidence: 95,
    treatment: 'Sử dụng dầu neem hoặc thuốc diệt rệp Imidacloprid',
    date: new Date().toISOString().split('T')[0],
  };

  setDetections([newDetection, ...detections]);
  Alert.alert(
    'Phát hiện thành công!',
    `Phát hiện: ${newDetection.disease} (${newDetection.confidence}% độ tin cậy)`
  );
};
  const simulateDetection = () => {
    // Simulate AI detection process
    Alert.alert('Đang phân tích...', 'Vui lòng chờ AI phân tích hình ảnh');
    
    setTimeout(() => {
      const newDetection: Detection = {
        id: Date.now().toString(),
        image: 'https://images.pexels.com/photos/1459853/pexels-photo-1459853.jpeg?auto=compress&cs=tinysrgb&w=400',
        disease: 'Rệp sáp',
        confidence: 95,
        treatment: 'Sử dụng dầu neem hoặc thuốc diệt rệp Imidacloprid, tăng cường thông gió',
        date: new Date().toISOString().split('T')[0]
      };
      
      setDetections([newDetection, ...detections]);
      Alert.alert('Phát hiện thành công!', `Phát hiện: ${newDetection.disease} (${newDetection.confidence}% độ tin cậy)`);
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return '#22C55E';
    if (confidence >= 70) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Brain size={32} color="#22C55E" strokeWidth={2} />
          <Text style={styles.headerTitle}>AI Gợi ý</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleTakePhoto}>
            <Camera size={24} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.primaryButtonText}>Chụp ảnh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleUploadPhoto}>
            <Upload size={24} color="#22C55E" strokeWidth={2} />
            <Text style={styles.secondaryButtonText}>Tải ảnh lên</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions Card */}
        <View style={styles.instructionCard}>
          <View style={styles.instructionHeader}>
            <Lightbulb size={20} color="#F59E0B" strokeWidth={2} />
            <Text style={styles.instructionTitle}>Hướng dẫn sử dụng</Text>
          </View>
          <Text style={styles.instructionText}>
            • Chụp ảnh rõ nét phần lá hoặc quả bị nghi ngờ nhiễm bệnh{'\n'}
            • Đảm bảo ánh sáng đủ và không bị mờ{'\n'}
            • AI sẽ phân tích và đưa ra gợi ý điều trị phù hợp{'\n'}
            • Kết quả có độ tin cậy càng cao càng chính xác
          </Text>
        </View>

        {/* Detection History */}
        <View style={styles.sectionHeader}>
          <History size={20} color="#6B7280" strokeWidth={2} />
          <Text style={styles.sectionTitle}>Lịch sử phát hiện</Text>
        </View>

        {detections.map(detection => (
          <View key={detection.id} style={styles.detectionCard}>
            <View style={styles.detectionHeader}>
              <Image source={{ uri: detection.image }} style={styles.detectionImage} />
              <View style={styles.detectionInfo}>
                <Text style={styles.diseaseTitle}>{detection.disease}</Text>
                <View style={styles.confidenceContainer}>
                  <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(detection.confidence) + '20' }]}>
                    <CheckCircle size={16} color={getConfidenceColor(detection.confidence)} strokeWidth={2} />
                    <Text style={[styles.confidenceText, { color: getConfidenceColor(detection.confidence) }]}>
                      {detection.confidence}% tin cậy
                    </Text>
                  </View>
                </View>
                <Text style={styles.detectionDate}>{formatDate(detection.date)}</Text>
              </View>
            </View>
            
            <View style={styles.treatmentSection}>
              <Text style={styles.treatmentTitle}>Gợi ý điều trị:</Text>
              <Text style={styles.treatmentText}>{detection.treatment}</Text>
            </View>
          </View>
        ))}

        {detections.length === 0 && (
          <View style={styles.emptyState}>
            <Brain size={64} color="#D1D5DB" strokeWidth={1} />
            <Text style={styles.emptyTitle}>Chưa có phát hiện nào</Text>
            <Text style={styles.emptyText}>Chụp hoặc tải ảnh lên để AI phân tích sâu bệnh</Text>
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <BookOpen size={20} color="#3B82F6" strokeWidth={2} />
            <Text style={styles.tipsTitle}>Mẹo phòng ngừa</Text>
          </View>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipNumber}>1</Text>
              <Text style={styles.tipText}>Kiểm tra cây định kỳ mỗi tuần</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipNumber}>2</Text>
              <Text style={styles.tipText}>Đảm bảo thoát nước tốt và thông gió</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipNumber}>3</Text>
              <Text style={styles.tipText}>Loại bỏ lá và quả bị bệnh ngay lập tức</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipNumber}>4</Text>
              <Text style={styles.tipText}>Sử dụng phân bón cân đối, tăng sức đề kháng</Text>
            </View>
          </View>
        </View>

        {/* Warning Card */}
        <View style={styles.warningCard}>
          <AlertTriangle size={20} color="#EF4444" strokeWidth={2} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Lưu ý quan trọng</Text>
            <Text style={styles.warningText}>
              Kết quả AI chỉ mang tính chất tham khảo. Nên tham khảo ý kiến chuyên gia nông nghiệp để có phương án điều trị tốt nhất.
            </Text>
          </View>
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  secondaryButtonText: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginLeft: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  detectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detectionHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detectionImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  detectionInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  diseaseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  confidenceContainer: {
    marginVertical: 8,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  detectionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  treatmentSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  treatmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  treatmentText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginLeft: 8,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
});