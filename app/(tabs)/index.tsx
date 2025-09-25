import React, { useState } from 'react';
import { router } from 'expo-router';
import { ToastAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  User,
  MapPin,
  Maximize,
  CreditCard as Edit3,
  Save,
  Eye,
} from 'lucide-react-native';

export default function FarmProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [farmData, setFarmData] = useState({
    name: 'Nông trại Na Thịnh Phát',
    location: 'Tây Ninh',
    area: '5.2',
    previousLocation: 'Long An',
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
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <User size={32} color="#22C55E" strokeWidth={2} />
          <Text style={styles.headerTitle}>Hồ sơ Nông trại</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <Eye size={24} color="#6B7280" strokeWidth={2} />
          ) : (
            <Edit3 size={24} color="#6B7280" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Farm Profile Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin Nông trại</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên nông trại</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? editData.name : farmData.name}
                onChangeText={(text) =>
                  setEditData({ ...editData, name: text })
                }
                placeholder="Nhập tên nông trại"
                placeholderTextColor="#9CA3AF"
                editable={isEditing}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vị trí hiện tại</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? editData.location : farmData.location}
                onChangeText={(text) =>
                  setEditData({ ...editData, location: text })
                }
                placeholder="Nhập vị trí"
                placeholderTextColor="#9CA3AF"
                editable={isEditing}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vị trí trước đây</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={
                  isEditing
                    ? editData.previousLocation
                    : farmData.previousLocation
                }
                onChangeText={(text) =>
                  setEditData({ ...editData, previousLocation: text })
                }
                placeholder="Nhập vị trí trước đây"
                placeholderTextColor="#9CA3AF"
                editable={isEditing}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Diện tích trồng Na (hecta)</Text>
            <View style={styles.inputContainer}>
              <Maximize size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? editData.area : farmData.area}
                onChangeText={(text) =>
                  setEditData({ ...editData, area: text })
                }
                placeholder="Nhập diện tích"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                editable={isEditing}
              />
              <Text style={styles.unit}>ha</Text>
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
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Save size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.saveButtonText}>Lưu thông tin</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tổng quan</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>1</Text>
              <Text style={styles.summaryLabel}>Nông trại</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{farmData.area}</Text>
              <Text style={styles.summaryLabel}>Hecta</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>2</Text>
              <Text style={styles.summaryLabel}>Vị trí</Text>
            </View>
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Mẹo quản lý</Text>
          <Text style={styles.tipsText}>
            Cập nhật thông tin nông trại thường xuyên để nhận được gợi ý chăm
            sóc phù hợp và cảnh báo thời tiết chính xác cho vị trí của bạn.
          </Text>
        </View>
 <TouchableOpacity
  style={styles.logoutButton}
  onPress={() => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            // Xóa dữ liệu user nếu có lưu
            await AsyncStorage.removeItem('userToken'); // thay bằng key của bạn

            // Thông báo đăng xuất thành công
            if (Platform.OS === 'android') {
              ToastAndroid.show('Đăng xuất thành công!', ToastAndroid.SHORT);
            } else {
              Alert.alert('Thông báo', 'Đăng xuất thành công!');
            }

            // Quay về login (app/index.tsx)
            router.replace('/auth/');
          } catch (error) {
            console.log('Lỗi đăng xuất:', error);
          }
        },
      },
    ]);
  }}
>
  <Text style={styles.logoutButtonText}>Đăng xuất</Text>
</TouchableOpacity>


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
  card: {
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
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1F2937',
  },
  inputDisabled: {
    color: '#6B7280',
  },
  unit: {
    fontSize: 16,
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
  summaryCard: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  tipsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    marginBottom: 40, // tăng khoảng cách với đáy
  },

  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
