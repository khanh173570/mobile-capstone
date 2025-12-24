import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import { FontAwesome } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';

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
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { User, Lock, Sprout, Mail } from 'lucide-react-native';
import { loginUser, LoginData } from '../../services/authService';
import { setupPushNotifications } from '../../services/pushNotificationService';

export default function LoginScreen() { // Test fix workflow
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Form validation - only check email is provided
    if (email.trim() === '') {
      Alert.alert('Thông báo', 'Vui lòng nhập email');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Thông báo', 'Vui lòng nhập email hợp lệ');
      return;
    }

    try {
      setLoading(true);
      const loginData: LoginData = {
        email: email.trim(),
        password
      };
      
      const response = await loginUser(loginData);
      
      if (response.isSuccess) {
        // 🔔 Setup push notifications after successful login
        if (response.data?.user?.id) {
          const userId = response.data.user.id;
          //console.log('🔔 User logged in - extracted userId:', userId);
          //console.log('   userId type:', typeof userId);
          //console.log('   userId length:', userId.length);
          
          // Call push notification setup asynchronously (don't block navigation)
          setupPushNotifications(userId)
            .then(success => {
              if (success) {
                //console.log('✓ Push notifications setup completed successfully');
              } else {
                //console.log('⚠️ Push notification setup failed, but continuing with login');
              }
            })
            .catch(error => {
              console.error('❌ Error during push notification setup:', error);
            });
        }
        // Navigate directly to home
        router.replace('/(tabs)');
      } else {
        // Handle error response
        let errorMessage = 'Đã xảy ra lỗi khi đăng nhập.';
        
        // Get the backend message
        let backendMessage = '';
        
        // Check if errors is an array with messages
        if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
          backendMessage = response.errors.join('\n');
        } 
        // Check if errors is an object
        else if (response.errors && typeof response.errors === 'object') {
          const errorDetails = Object.entries(response.errors)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return value.join(', ');
              }
              return String(value);
            })
            .filter(text => text)
            .join('\n');
          
          if (errorDetails) {
            backendMessage = errorDetails;
          }
        }
        // Use message if available
        else if (response.message) {
          backendMessage = response.message;
        }
        
        // Translate common backend error messages to Vietnamese
        const lowerMessage = backendMessage.toLowerCase();
        
        // Check for account/user not found errors
        if (lowerMessage.includes('user') && (lowerMessage.includes('not found') || 
            lowerMessage.includes('does not exist') || lowerMessage.includes('not exist'))) {
          errorMessage = 'Tài khoản không tồn tại.';
        } else if (lowerMessage.includes('account') && (lowerMessage.includes('not found') || 
                   lowerMessage.includes('does not exist') || lowerMessage.includes('not exist'))) {
          errorMessage = 'Tài khoản không tồn tại.';
        } else if (lowerMessage.includes('email') && (lowerMessage.includes('not found') || 
                   lowerMessage.includes('does not exist') || lowerMessage.includes('not exist'))) {
          errorMessage = 'Tài khoản không tồn tại.';
        } else if (lowerMessage.includes('not found')) {
          errorMessage = 'Tài khoản không tồn tại.';
        } 
        // Check for password errors
        else if (lowerMessage.includes('password') || lowerMessage.includes('incorrect') || 
            lowerMessage.includes('wrong') || lowerMessage.includes('invalid password')) {
          errorMessage = 'Sai mật khẩu. Vui lòng thử lại.';
        } 
        // Check for account status issues
        else if (lowerMessage.includes('account') && lowerMessage.includes('disabled')) {
          errorMessage = 'Tài khoản đã bị vô hiệu hóa.';
        } else if (lowerMessage.includes('account') && lowerMessage.includes('locked')) {
          errorMessage = 'Tài khoản đã bị khóa.';
        } else if (lowerMessage.includes('not verified') || lowerMessage.includes('not activated') || 
                   lowerMessage.includes('pending') || lowerMessage.includes('waiting for approval')) {
          errorMessage = 'Tài khoản chưa được xác nhận. Vui lòng chờ hệ thống xác nhận và kiểm tra email.';
        } else if (lowerMessage.includes('rejected') || lowerMessage.includes('denied')) {
          errorMessage = 'Tài khoản đã bị từ chối. Vui lòng liên hệ quản trị viên.';
        } else if (lowerMessage.includes('email') && lowerMessage.includes('not verified')) {
          errorMessage = 'Email chưa được xác nhận. Vui lòng kiểm tra email để xác nhận tài khoản.';
        } else if (backendMessage) {
          errorMessage = backendMessage;
        }
        
        // Customize error message based on status code
        if (response.statusCode === 400) {
          Alert.alert('Lỗi đăng nhập', errorMessage);
        } else if (response.statusCode === 500) {
          Alert.alert('Lỗi đăng nhập', errorMessage);
        } else if (response.statusCode === 0) {
          Alert.alert(
            'Lỗi kết nối', 
            'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'
          );
        } else {
          Alert.alert('Lỗi đăng nhập', errorMessage);
        }
      }
    } catch (error) {
      // Try to extract error message from caught error
      let errorMessage = 'Đã xảy ra lỗi không xác định khi đăng nhập.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      Alert.alert('Lỗi hệ thống', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="light" />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/agriMart.png')} 
            style={styles.logo}
          />
          <Text style={styles.appTitle}>AgriMart</Text>
          <Text style={styles.subtitle}>Quản lý Nông trại thông minh</Text>
        </View>
      </View>

      {/* Login Form */}
      <View style={styles.formContainer}>
        <Text style={styles.welcomeText}>Đăng nhập</Text>
        <Text style={styles.welcomeSubtext}>Xin chào bạn vesion mới !</Text>

        <View style={styles.inputContainer}>
          <Mail size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
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


        <TouchableOpacity 
          style={[styles.loginButton, loading && { opacity: 0.7 }]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        {/* Hàng Quên mật khẩu + Đăng ký */}
       <View style={styles.bottomRow}>
          <TouchableOpacity
            onPress={() => Alert.alert('Quên mật khẩu', 'Không sử dụng')}
          >
            <Text style={styles.bottomText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/role-selection')}>
            <Text style={[styles.bottomText, styles.registerText]}>
              Đăng ký tài khoản
            </Text>
          </TouchableOpacity>
        </View>
{/* <View style={styles.socialContainer}>
  <Text style={styles.socialText}>Hoặc đăng nhập bằng</Text>
  <View style={styles.socialRow}>
    <TouchableOpacity style={styles.socialButton}>
      <FontAwesome name="facebook" size={32} color="#1877F2" />
    </TouchableOpacity>

    <TouchableOpacity style={styles.socialButton}>
      <FontAwesome name="google" size={32} color="#DB4437" />
    </TouchableOpacity>

    <TouchableOpacity style={styles.socialButton}>
      <FontAwesome5 name="tiktok" size={32} color="#000000" />
    </TouchableOpacity>
  </View>
</View> */}


      </View>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#22C55E',
  },
  header: {
    flex: 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 16,
    resizeMode: 'contain',
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
    flex: 0.55,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
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
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerText: {
    fontWeight: 'bold',
   
  },
  eyeIcon: {
  fontSize: 20,
  color: '#6B7280',
},
  socialContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  socialText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20, // RN mới hỗ trợ, nếu lỗi thì dùng marginHorizontal
  },
  socialButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    width:  50,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',

    marginHorizontal: 10,
    elevation: 4,
  },
  socialIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },


});
