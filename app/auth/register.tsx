import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { User, Lock, Mail, Sprout, Home, MapPin, Phone, Camera } from 'lucide-react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { registerUser, RegisterData } from '../../services/authService';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { handleError } from '@/utils/errorHandler';

const RegisterScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const roleId = params.roleId as string;

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [communes, setCommunes] = useState<string>('');
  const [province, setProvince] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [frontIdImage, setFrontIdImage] = useState<string | null>(null);
  const [backIdImage, setBackIdImage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roleId) {
      Alert.alert(
        'Lỗi',
        'Vui lòng chọn vai trò trước khi đăng ký',
        [{ text: 'OK', onPress: () => router.replace('/auth/role-selection') }]
      );
    }
  }, [roleId]);

  const pickImage = async (setImage: React.Dispatch<React.SetStateAction<string | null>>, title: string) => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission denied for media library');
        Alert.alert('Thông báo', 'Cần quyền truy cập thư viện ảnh để tải ảnh lên');
        return;
      }

      // Launch image picker - using the correct API
      const result = await ImagePicker.launchImageLibraryAsync({
        // Using string type to avoid the deprecation warning
        mediaTypes: 'images', 
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Reduced quality for smaller image size
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        console.log(`Selected ${title} image: ${selectedUri.substring(0, 30)}...`);
        console.log(`Image size: ${result.assets[0].fileSize ? result.assets[0].fileSize / 1024 : 'unknown'} KB`);
        console.log(`Image type: ${result.assets[0].mimeType || 'unknown'}`);
        
        // Resize the image to ensure it's not too large and optimize for upload
        try {
          console.log('Resizing image to optimize for upload...');
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            selectedUri,
            [{ resize: { width: 800 } }], // resize to max width 800px
            { 
              compress: 0.5, // Further compress to reduce size
              format: ImageManipulator.SaveFormat.JPEG 
            }
          );
          
          console.log(`Resized ${title} image: ${manipulatedImage.uri.substring(0, 30)}...`);
          console.log(`New size: ${manipulatedImage.width}x${manipulatedImage.height}`);
          
          // Store the optimized URI
          setImage(manipulatedImage.uri);
        } catch (resizeError) {
          console.error(`Error resizing ${title} image:`, resizeError);
          // If resize fails, use the original image
          setImage(selectedUri);
        }
      }
    } catch (error) {
      console.error(`Error picking ${title} image:`, error);
      const errorMessage = handleError(error, `Pick ${title} Image`);
      Alert.alert('Lỗi', errorMessage);
    }
  };

  const handleRegister = async () => {
    if(loading) return; // Prevent multiple submissions
    setLoading(true);
    try {
      // Validate all fields
      if (!firstName || !lastName || !email || !password || !confirmPassword || !address || !communes || !province || !phoneNumber) {
        console.log('Missing required fields:', {
          firstName: !!firstName,
          lastName: !!lastName,
          email: !!email,
          password: !!password,
          confirmPassword: !!confirmPassword,
          address: !!address,
          communes: !!communes,
          province: !!province,
          phoneNumber: !!phoneNumber
        });
        Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin');
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Thông báo', 'Vui lòng nhập đúng định dạng email');
        return;
      }
      
      // Validate password complexity
      if (password.length < 6) {
        Alert.alert('Thông báo', 'Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
      
      // Validate phone number (10-11 digits)
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(phoneNumber)) {
        Alert.alert('Thông báo', 'Số điện thoại không hợp lệ (cần 10-11 chữ số)');
        return;
      }
      
      // Validate ID images
      if (!frontIdImage || !backIdImage) {
        console.log('Missing ID images:', {
          frontIdImage: !!frontIdImage,
          backIdImage: !!backIdImage
        });
        Alert.alert('Thông báo', 'Vui lòng tải lên ảnh CCCD/CMND (mặt trước và mặt sau)');
        return;
      }
      
      // Validate passwords match
      if (password !== confirmPassword) {
        console.log('Passwords do not match');
        Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp');
        return;
      }
      
      // Set loading state
      setLoading(true);
      
      // Show loading message
      Alert.alert(
        'Đang xử lý',
        'Đang tải ảnh lên và đăng ký tài khoản, vui lòng đợi...'
      );
      
      // Prepare registration data - TypeScript safe
      const userData: RegisterData = {
        email,
        password,
        firstName,
        lastName,
        address,
        communes,
        province,
        phoneNumber,
        roleId: roleId,
        userVerifications: [
          {
            document: frontIdImage || '', // TypeScript safety
            documentType: 0 // Front ID
          },
          {
            document: backIdImage || '', // TypeScript safety
            documentType: 1 // Back ID
          }
        ]
      };

      console.log('Sending registration data:', {
        ...userData,
        password: '******', // Don't log actual password
        userVerifications: userData.userVerifications.map(v => ({
          documentType: v.documentType,
          hasDocument: !!v.document
        }))
      });
      
      try {
        const response = await registerUser(userData);
        
        console.log('Registration API response:', JSON.stringify(response));
        
        if (response.isSuccess) {
          Alert.alert(
            'Đăng ký thành công',
            'Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.',
            [{ text: 'OK', onPress: () => router.replace('/auth') }]
          );
        } else {
          // Handle specific error messages
          let errorMessage = response.message || 'Đã xảy ra lỗi khi đăng ký.';
          
          // Check for document-specific errors first
          if (errorMessage.includes('ảnh') || errorMessage.includes('CCCD') || 
              errorMessage.includes('document') || errorMessage.includes('hình ảnh')) {
            Alert.alert(
              'Lỗi tải ảnh',
              errorMessage,
              [
                { text: 'Thử lại', style: 'cancel' },
                { text: 'Chọn ảnh khác', onPress: () => {
                  setFrontIdImage(null);
                  setBackIdImage(null);
                }}
              ]
            );
            return;
          }
          
          // Handle validation and other errors
          if (response.errors) {
            try {
              const errorDetails = Object.entries(response.errors)
                .map(([key, value]) => {
                  // Format the key for better readability
                  let formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
                  if (formattedKey === 'Email') formattedKey = 'Email';
                  if (formattedKey === 'Password') formattedKey = 'Mật khẩu';
                  if (formattedKey === 'FirstName') formattedKey = 'Họ';
                  if (formattedKey === 'LastName') formattedKey = 'Tên';
                  if (formattedKey === 'PhoneNumber') formattedKey = 'Số điện thoại';
                  
                  return `${formattedKey}: ${Array.isArray(value) ? value.join(', ') : value}`;
                })
                .join('\n');
              
              if (errorDetails) {
                errorMessage += '\n\nChi tiết lỗi:\n' + errorDetails;
              }
            } catch (parseError) {
              console.error('Error parsing error details:', parseError);
            }
          }
          
          console.error('Registration failed:', errorMessage);
          Alert.alert('Lỗi đăng ký', errorMessage, [{ text: 'OK' }]);
        }
      } catch (apiError) {
        console.error('Registration API call error:', apiError);
        const errorMessage = handleError(apiError, 'Register User');
        Alert.alert('Lỗi kết nối', errorMessage, [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Validation error:', error);
      const errorMessage = handleError(error, 'Validation');
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
          <Text style={styles.welcomeText}>Đăng ký tài khoản </Text>
          <Text style={styles.welcomeSubtext}>Xin chào !</Text>

          {/* First Name */}
          <View style={styles.inputContainer}>
            <User size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Tên"
              placeholderTextColor="#9CA3AF"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputContainer}>
            <User size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Họ"
              placeholderTextColor="#9CA3AF"
              value={lastName}
              onChangeText={setLastName}
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

          {/* Phone Number */}
          <View style={styles.inputContainer}>
            <Phone size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              placeholderTextColor="#9CA3AF"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          {/* Address */}
          <View style={styles.inputContainer}>
            <Home size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Địa chỉ"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* Communes */}
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Xã/Phường"
              placeholderTextColor="#9CA3AF"
              value={communes}
              onChangeText={setCommunes}
            />
          </View>

          {/* Province */}
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Tỉnh/Thành phố"
              placeholderTextColor="#9CA3AF"
              value={province}
              onChangeText={setProvince}
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

          {/* Document Verification Section */}
          <Text style={styles.verificationTitle}>Xác thực danh tính</Text>
          <Text style={styles.verificationSubtitle}>Vui lòng tải lên ảnh CMND/CCCD của bạn</Text>

          {/* Front ID */}
          <View style={styles.documentContainer}>
            <Text style={styles.documentLabel}>Mặt trước CMND/CCCD</Text>
            <TouchableOpacity 
              style={styles.documentSelector}
              onPress={() => pickImage(setFrontIdImage, 'Mặt trước')}
            >
              {frontIdImage ? (
                <Image source={{ uri: frontIdImage }} style={styles.documentPreview} />
              ) : (
                <View style={styles.documentPlaceholder}>
                  <Camera size={32} color="#6B7280" />
                  <Text style={styles.documentPlaceholderText}>Tải lên ảnh</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Back ID */}
          <View style={styles.documentContainer}>
            <Text style={styles.documentLabel}>Mặt sau CMND/CCCD</Text>
            <TouchableOpacity 
              style={styles.documentSelector}
              onPress={() => pickImage(setBackIdImage, 'Mặt sau')}
            >
              {backIdImage ? (
                <Image source={{ uri: backIdImage }} style={styles.documentPreview} />
              ) : (
                <View style={styles.documentPlaceholder}>
                  <Camera size={32} color="#6B7280" />
                  <Text style={styles.documentPlaceholderText}>Tải lên ảnh</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <Pressable
            onPress={handleRegister}
            disabled={loading}
            style={({ pressed }) => [
              styles.registerButton,
              pressed && styles.registerButtonPressed,
              loading && { opacity: 0.7 }
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Đăng ký</Text>
            )}
          </Pressable>
        </ScrollView>






        <TouchableOpacity
          style={styles.backLogin}
          onPress={() => router.replace('/auth')}
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
  
  // Document verification styles
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 4,
  },
  verificationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  documentContainer: {
    marginBottom: 16,
  },
  documentLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  documentSelector: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  documentPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  documentPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentPlaceholderText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  
});
