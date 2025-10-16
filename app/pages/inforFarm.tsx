import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser, User, logout } from '../../services/authService';

export default function InforFarm() {
  const router = useRouter();
  const [hasFarm, setHasFarm] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);

  // State cho form khi chưa có farm
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserData(user);
          setName(user.firstName + ' ' + user.lastName);
          setPhone(user.phoneNumber);
          // If user has farm data, set hasFarm to true
          // For now we'll assume they don't have a farm yet
          setHasFarm(false);
        } else {
          // No user data found, redirect to login
          Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại', [
            { text: 'OK', onPress: () => router.replace('/auth') }
          ]);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleConfirm = () => {
    if (!name || !phone || !farmName || !location) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    Alert.alert('Thành công', 'Đăng ký nông trại thành công!', [
      { text: 'OK', onPress: () => router.replace('/(tabs)') },
    ]);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Lỗi', 'Không thể đăng xuất');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Thông tin nông trại</Text>
      
      {userData && (
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoLabel}>Thông tin tài khoản:</Text>
          <Text style={styles.userInfoText}>Họ và tên: {userData.firstName} {userData.lastName}</Text>
          <Text style={styles.userInfoText}>Email: {userData.email}</Text>
          <Text style={styles.userInfoText}>Số điện thoại: {userData.phoneNumber}</Text>
          <Text style={styles.userInfoText}>Địa chỉ: {userData.address}</Text>
          <Text style={styles.userInfoText}>Xã/Phường: {userData.communes}</Text>
          <Text style={styles.userInfoText}>Tỉnh/Thành phố: {userData.province}</Text>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasFarm === null && (
        <View style={styles.optionContainer}>
          <Text style={styles.question}>Bạn đã có nông trại chưa?</Text>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.optionText}>Đã có</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setHasFarm(false)}
          >
            <Text style={styles.optionText}>Chưa có</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasFarm === false && (
        <View style={styles.form}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập họ tên"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Tên nông trại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên nông trại"
            value={farmName}
            onChangeText={setFarmName}
          />

          <Text style={styles.label}>Địa chỉ nông trại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập địa chỉ"
            value={location}
            onChangeText={setLocation}
          />

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#22C55E',
  },
  userInfoContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  userInfoLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  userInfoText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionContainer: {
    alignItems: 'center',
  },
  question: {
    fontSize: 18,
    marginBottom: 20,
    color: '#374151',
  },
  optionButton: {
    backgroundColor: '#22C55E',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    width: '60%',
    alignItems: 'center',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#111827',
  },
  confirmButton: {
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
