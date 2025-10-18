import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  MapPin, 
  Home as HomeIcon,
  Calendar,
  User,
  Edit3,
  Save,
  X
} from 'lucide-react-native';

export default function FarmProfileScreen() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  
  const [farmData, setFarmData] = useState({
    name: 'Nông trại Na Thịnh Phát',
    location: 'Tây Ninh',
    area: '5.2',
    establishedDate: '2023',
    owner: 'Trần Phương Khanh',
    crops: 'Na, Xoài, Bưởi',
  });

  const [editData, setEditData] = useState({ ...farmData });

  const handleSave = () => {
    setFarmData({ ...editData });
    setIsEditing(false);
    Alert.alert('Thành công', 'Thông tin nông trại đã được cập nhật!');
  };

  const handleCancel = () => {
    setEditData({ ...farmData });
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Hồ sơ nông trại</Text>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <X size={24} color="#EF4444" />
          ) : (
            <Edit3 size={24} color="#22C55E" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Farm Image Placeholder */}
        <View style={styles.imageContainer}>
          <HomeIcon size={48} color="#22C55E" />
          <Text style={styles.imageText}>Ảnh nông trại</Text>
        </View>

        {/* Farm Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên nông trại</Text>
            <View style={styles.inputContainer}>
              <HomeIcon size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? editData.name : farmData.name}
                onChangeText={(text) => setEditData({...editData, name: text})}
                placeholder="Tên nông trại"
                editable={isEditing}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vị trí</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? editData.location : farmData.location}
                onChangeText={(text) => setEditData({...editData, location: text})}
                placeholder="Vị trí nông trại"
                editable={isEditing}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Diện tích (hecta)</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📏</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? editData.area : farmData.area}
                onChangeText={(text) => setEditData({...editData, area: text})}
                placeholder="Diện tích"
                keyboardType="numeric"
                editable={isEditing}
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.unit}>ha</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Năm thành lập</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? editData.establishedDate : farmData.establishedDate}
                onChangeText={(text) => setEditData({...editData, establishedDate: text})}
                placeholder="Năm thành lập"
                keyboardType="numeric"
                editable={isEditing}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chủ nông trại</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? editData.owner : farmData.owner}
                onChangeText={(text) => setEditData({...editData, owner: text})}
                placeholder="Tên chủ nông trại"
                editable={isEditing}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cây trồng chính</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🌱</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? editData.crops : farmData.crops}
                onChangeText={(text) => setEditData({...editData, crops: text})}
                placeholder="Các loại cây trồng"
                editable={isEditing}
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>
          </View>

          {isEditing && (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSave}
              >
                <Save size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Thống kê</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{farmData.area}</Text>
              <Text style={styles.statLabel}>Hecta</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Loại cây</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {new Date().getFullYear() - parseInt(farmData.establishedDate)}
              </Text>
              <Text style={styles.statLabel}>Năm hoạt động</Text>
            </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  imageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  inputDisabled: {
    color: '#6B7280',
  },
  unit: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
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
});