import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert,
  Modal,
  TextInput 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Sprout, Plus, Calendar, MapPin, Trash2, CreditCard as Edit3, CircleCheck as CheckCircle, Clock } from 'lucide-react-native';

interface Crop {
  id: string;
  type: string;
  area: string;
  plantDate: string;
  harvestDate: string;
  status: 'growing' | 'harvested';
  location: string;
}

export default function CropsScreen() {
  const [crops, setCrops] = useState<Crop[]>([
    {
      id: '1',
      type: 'Na dai',
      area: '2.5',
      plantDate: '2024-01-15',
      harvestDate: '2024-07-15',
      status: 'growing',
      location: 'Lô A1'
    },
    {
      id: '2',
      type: 'Na bở',
      area: '1.8',
      plantDate: '2023-12-01',
      harvestDate: '2024-06-01',
      status: 'harvested',
      location: 'Lô B2'
    }
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    area: '',
    plantDate: '',
    harvestDate: '',
    location: ''
  });

  const resetForm = () => {
    setFormData({
      type: '',
      area: '',
      plantDate: '',
      harvestDate: '',
      location: ''
    });
  };

  const handleAddCrop = () => {
    setEditingCrop(null);
    resetForm();
    setModalVisible(true);
  };

  const handleEditCrop = (crop: Crop) => {
    setEditingCrop(crop);
    setFormData({
      type: crop.type,
      area: crop.area,
      plantDate: crop.plantDate,
      harvestDate: crop.harvestDate,
      location: crop.location
    });
    setModalVisible(true);
  };

  const handleSaveCrop = () => {
    if (!formData.type || !formData.area || !formData.plantDate || !formData.harvestDate || !formData.location) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (editingCrop) {
      setCrops(crops.map(crop => 
        crop.id === editingCrop.id 
          ? { ...crop, ...formData }
          : crop
      ));
    } else {
      const newCrop: Crop = {
        id: Date.now().toString(),
        ...formData,
        status: 'growing'
      };
      setCrops([...crops, newCrop]);
    }

    setModalVisible(false);
    resetForm();
    Alert.alert('Thành công', editingCrop ? 'Cập nhật cây trồng thành công!' : 'Thêm cây trồng thành công!');
  };

  const handleDeleteCrop = (cropId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa cây trồng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: () => setCrops(crops.filter(crop => crop.id !== cropId))
        }
      ]
    );
  };

  const handleMarkHarvested = (cropId: string) => {
    setCrops(crops.map(crop => 
      crop.id === cropId 
        ? { ...crop, status: 'harvested' }
        : crop
    ));
    Alert.alert('Thành công', 'Đã cập nhật trạng thái thu hoạch!');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    return status === 'harvested' ? '#22C55E' : '#F59E0B';
  };

  const getStatusText = (status: string) => {
    return status === 'harvested' ? 'Đã thu hoạch' : 'Đang trồng';
  };

  const getStatusIcon = (status: string) => {
    return status === 'harvested' ? CheckCircle : Clock;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Sprout size={32} color="#22C55E" strokeWidth={2} />
          <Text style={styles.headerTitle}>Quản lý Cây trồng</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCrop}>
          <Plus size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{crops.length}</Text>
            <Text style={styles.statLabel}>Tổng lô trồng</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {crops.reduce((sum, crop) => sum + parseFloat(crop.area), 0).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Hecta</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {crops.filter(crop => crop.status === 'harvested').length}
            </Text>
            <Text style={styles.statLabel}>Đã thu hoạch</Text>
          </View>
        </View>

        {/* Crop List */}
        {crops.map(crop => {
          const StatusIcon = getStatusIcon(crop.status);
          return (
            <View key={crop.id} style={styles.cropCard}>
              <View style={styles.cropHeader}>
                <View>
                  <Text style={styles.cropType}>{crop.type}</Text>
                  <View style={styles.cropLocation}>
                    <MapPin size={16} color="#6B7280" />
                    <Text style={styles.cropLocationText}>{crop.location}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(crop.status) + '20' }]}>
                  <StatusIcon size={16} color={getStatusColor(crop.status)} strokeWidth={2} />
                  <Text style={[styles.statusText, { color: getStatusColor(crop.status) }]}>
                    {getStatusText(crop.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.cropDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Diện tích:</Text>
                  <Text style={styles.detailValue}>{crop.area} ha</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ngày trồng:</Text>
                  <Text style={styles.detailValue}>{formatDate(crop.plantDate)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dự kiến thu hoạch:</Text>
                  <Text style={styles.detailValue}>{formatDate(crop.harvestDate)}</Text>
                </View>
              </View>

              <View style={styles.cropActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleEditCrop(crop)}
                >
                  <Edit3 size={16} color="#6B7280" strokeWidth={2} />
                  <Text style={styles.actionText}>Sửa</Text>
                </TouchableOpacity>
                
                {crop.status === 'growing' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.harvestButton]}
                    onPress={() => handleMarkHarvested(crop.id)}
                  >
                    <CheckCircle size={16} color="#22C55E" strokeWidth={2} />
                    <Text style={[styles.actionText, { color: '#22C55E' }]}>Thu hoạch</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteCrop(crop.id)}
                >
                  <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                  <Text style={[styles.actionText, { color: '#EF4444' }]}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {crops.length === 0 && (
          <View style={styles.emptyState}>
            <Sprout size={64} color="#D1D5DB" strokeWidth={1} />
            <Text style={styles.emptyTitle}>Chưa có cây trồng nào</Text>
            <Text style={styles.emptyText}>Nhấn nút + để thêm cây trồng đầu tiên</Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCrop ? 'Sửa cây trồng' : 'Thêm cây trồng mới'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Loại Na</Text>
              <TextInput
                style={styles.input}
                value={formData.type}
                onChangeText={(text) => setFormData({ ...formData, type: text })}
                placeholder="Ví dụ: Na dai, Na bở"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Diện tích (hecta)</Text>
              <TextInput
                style={styles.input}
                value={formData.area}
                onChangeText={(text) => setFormData({ ...formData, area: text })}
                placeholder="Ví dụ: 2.5"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vị trí lô</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="Ví dụ: Lô A1"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngày trồng</Text>
              <TextInput
                style={styles.input}
                value={formData.plantDate}
                onChangeText={(text) => setFormData({ ...formData, plantDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngày dự kiến thu hoạch</Text>
              <TextInput
                style={styles.input}
                value={formData.harvestDate}
                onChangeText={(text) => setFormData({ ...formData, harvestDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveCrop}>
              <Text style={styles.saveButtonText}>
                {editingCrop ? 'Cập nhật' : 'Thêm cây trồng'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  addButton: {
    backgroundColor: '#22C55E',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  cropCard: {
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
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cropType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cropLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cropLocationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cropDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  cropActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  harvestButton: {
    backgroundColor: '#DCFCE7',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 4,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});