import React, { useState } from 'react';

import {
  Pressable,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { User, Lock, Mail, Sprout } from 'lucide-react-native';
import { Eye, EyeOff } from 'lucide-react-native';

const RegisterScreen: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);


const handleRegister = () => {
  if (!username || !email || !password || !confirmPassword) {
    Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin');
    return;
  }
  if (password !== confirmPassword) {
    Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp');
    return;
  }

  // ✅ Sau khi đăng ký thì chuyển sang OTP
  router.replace('/auth/otp');
};




  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Sprout size={60} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.appTitle}>AgriMart</Text>
          <Text style={styles.subtitle}>Quản lý Nông trại thông minh</Text>
        </View>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <Text style={styles.welcomeText}>Đăng ký tài khoản </Text>
        <Text style={styles.welcomeSubtext}>Xin chào !</Text>

        {/* Username */}
        <View style={styles.inputContainer}>
          <User size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Tên đăng nhập"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Mail size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
<View style={styles.inputContainer}>
  <Lock size={20} color="#6B7280" style={styles.inputIcon} />
  <TextInput
    style={styles.input}
    placeholder="Mật khẩu"
    placeholderTextColor="#9CA3AF"
    value={password}
    onChangeText={setPassword}
    secureTextEntry={!showPassword} // 👈 bật/tắt theo state
  />
  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
    {showPassword ? (
      <Eye size={20} color="#6B7280" />
    ) : (
      <EyeOff size={20} color="#6B7280" />
    )}
  </TouchableOpacity>
</View>

{/* Confirm Password */}
<View style={styles.inputContainer}>
  <Lock size={20} color="#6B7280" style={styles.inputIcon} />
  <TextInput
    style={styles.input}
    placeholder="Xác nhận mật khẩu"
    placeholderTextColor="#9CA3AF"
    value={confirmPassword}
    onChangeText={setConfirmPassword}
    secureTextEntry={!showConfirmPassword} // 👈 bật/tắt theo state
  />
  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
    {showConfirmPassword ? (
      <Eye size={20} color="#6B7280" />
    ) : (
      <EyeOff size={20} color="#6B7280" />
    )}
  </TouchableOpacity>
</View>



        {/* Buttons */}
<Pressable
      onPress={handleRegister}
      style={({ pressed }) => [
        styles.registerButton,
        pressed && styles.registerButtonPressed, // đổi style khi ấn giữ
      ]}
    >
      <Text style={styles.registerButtonText}>Đăng ký</Text>
    </Pressable>






        <TouchableOpacity
          style={styles.backLogin}
          onPress={() => router.replace('/auth/')}
        >
          <Text style={styles.backLoginText}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#22C55E' },
  header: {
    flex: 0.22,
    justifyContent: 'center',
    alignItems: 'center',
    // paddingTop: 20,
  },
  logoContainer: { alignItems: 'center' },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: 1,
    fontFamily: 'Helvetica Neue',
  },
  subtitle: { fontSize: 16, color: '#FFFFFF', opacity: 0.9, marginTop: 8 },
  formContainer: {
    //inside body register
    flex: 0.65,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#9CA3AF',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 56, fontSize: 16, color: '#1F2937' },
  registerButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    
  },
  registerButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },

   registerButtonPressed: {
    backgroundColor: '#16A34A', // màu khác khi ấn giữ
    transform: [{ scale: 0.99 }], // hiệu ứng thu nhỏ nhẹ
  },
  
  backLogin: { alignItems: 'flex-start', marginTop: 16 },
  backLoginText: { fontSize: 16, fontWeight: '500' },
  
});
