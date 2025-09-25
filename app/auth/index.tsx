import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { User, Lock, Sprout } from 'lucide-react-native';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (username.trim() === '' || password.trim() === '') {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin đăng nhập');
      return;
    }

    // Demo login - accept any non-empty credentials
    Alert.alert('Đăng nhập thành công!', 'Chào mừng bạn đến với AgriMart', [
      {
        text: 'OK',
        onPress: () => router.replace('/pages/inforFarm'),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Sprout size={60} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.appTitle}>AgriMart</Text>
          <Text style={styles.subtitle}>Quản lý Nông trại thông minh</Text>
        </View>
      </View>

      {/* Login Form */}
      <View style={styles.formContainer}>
        <Text style={styles.welcomeText}>Đăng nhập Farm</Text>
        <Text style={styles.welcomeSubtext}>Xin chào !</Text>

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

        <View style={styles.inputContainer}>
  <Lock size={20} color="#6B7280" style={styles.inputIcon} />
  <TextInput
    style={styles.input}
    placeholder="Mật khẩu"
    placeholderTextColor="#9CA3AF"
    value={password}
    onChangeText={setPassword}
    secureTextEntry={!showPassword}   // toggle theo state
  />
  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
   {showPassword ? (
  <Eye size={20} color="#6B7280" />
) : (
  <EyeOff size={20} color="#6B7280" />
)}

  </TouchableOpacity>
</View>


        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>

        {/* Hàng Quên mật khẩu + Đăng ký */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            onPress={() => Alert.alert('Quên mật khẩu', 'Không sử dụng')}
          >
            <Text style={styles.bottomText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={[styles.bottomText, styles.registerText]}>
              Đăng ký
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#22C55E',
  },
  header: {
    flex: 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginTop: 16,
    letterSpacing: 1,
    fontFamily: 'Helvetica Neue',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 8,
  },
  formContainer: {
    flex: 0.6,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#9CA3AF',
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
  loginButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 24,
  },
  forgotPasswordText: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '500',
  },
  demoInfo: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginTop: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  demoText: {
    color: '#92400E',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // hoặc 'center' + margin cho nút đăng ký
    marginTop: 24,
  },
  bottomText: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerText: {
    fontWeight: 'bold',
    color: '#22C55E',
  },
  eyeIcon: {
  fontSize: 20,
  color: '#6B7280',
},

});
