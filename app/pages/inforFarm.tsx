import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function InforFarm() {
  const router = useRouter();
  const [hasFarm, setHasFarm] = useState<boolean | null>(null);

  // State cho form khi chưa có farm
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');

  const handleConfirm = () => {
    if (!name || !phone || !farmName || !location) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    Alert.alert('Thành công', 'Đăng ký nông trại thành công!', [
      { text: 'OK', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Xác nhận thông tin nông trại</Text>

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
