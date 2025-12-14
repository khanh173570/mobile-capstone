import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  getCurrentUser, 
  getCurrentFarm,
  getUserProfile,
  User
} from '../../../../services/authService';
import { 
  getUserFarmsFromStorage,
  getUserFarms,
  updateFarm,
  type Farm,
  type UpdateFarmFormData
} from '../../../../services/farmService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  MapPin, 
  Calendar,
  TrendingUp,
  Sprout,
  BarChart3,
  Clock,
  Edit3,
  Activity,
  Leaf,
  Sun,
  Droplets,
  X,
  Camera,
  Upload,
  Bell
} from 'lucide-react-native';
import Header from '../../../../components/shared/Header';
import { NotificationModal } from '../../../../components/shared/NotificationModal';
import { getUnreadNotificationCount, getUserNotifications, UserNotification } from '../../../../services/userNotificationService';
import { signalRService, NewNotificationEvent } from '../../../../services/signalRService';
import * as ImagePicker from 'expo-image-picker';
import { handleError } from '@/utils/errorHandler';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [farmData, setFarmData] = useState<Farm | null>(null);
  const [userFarms, setUserFarms] = useState<Farm[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    farmImage: '',
    farmImageFile: null as any
  });

  const loadData = async () => {
    try {
      // Try to get fresh user profile with reputation score
      try {
        const profileResponse = await getUserProfile();
        if (profileResponse.isSuccess && profileResponse.data) {
          setUserData(profileResponse.data);
          // Update storage with fresh data
          await AsyncStorage.setItem('user', JSON.stringify(profileResponse.data));
        } else {
          // Fallback to storage
          const user = await getCurrentUser();
          if (user) {
            setUserData(user);
          }
        }
      } catch (error) {
        console.error('Error loading user profile from API:', error);
        // Fallback to storage
        const user = await getCurrentUser();
        if (user) {
          setUserData(user);
        }
      }
      
      if (userData || await getCurrentUser()) {
        // Load farm data
        const farm = await getCurrentFarm();
        if (farm) {
          setFarmData(farm);
        }
        
        // Load user farms list - try API first, then storage
        try {
          const farmsResponse = await getUserFarms();
          if (farmsResponse.isSuccess && farmsResponse.data.length > 0) {
            setUserFarms(farmsResponse.data);
            // Update current farm with fresh data if available
            const currentFarm = farmsResponse.data[0];
            if (currentFarm) {
              setFarmData(currentFarm);
              // Update storage
              await AsyncStorage.setItem('farm', JSON.stringify(currentFarm));
              await AsyncStorage.setItem('userFarms', JSON.stringify(farmsResponse.data));
            }
          } else {
            // Fallback to storage
            const farms = await getUserFarmsFromStorage();
            setUserFarms(farms);
          }
        } catch (error) {
          console.error('Error loading farms from API:', error);
          // Fallback to storage
          const farms = await getUserFarmsFromStorage();
          setUserFarms(farms);
        }
      } else {
        router.replace('/auth');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await loadUnreadCount();
    setRefreshing(false);
  };

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      console.log('📊 Farmer unread notification count:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('❌ Error loading unread count:', error);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      
      // Initialize SignalR connection
      console.log('🔌 Initializing SignalR for farmer...');
      await signalRService.connect();
      
      // Setup real-time notification listener
      const unsubscribeNotifications = signalRService.onNewNotification((event: NewNotificationEvent) => {
        console.log('🔔🔔🔔 New notification received in farmer home 🔔🔔🔔');
        console.log('   Type:', event.type);
        console.log('   Title:', event.title);
        console.log('   Message:', event.message);
        console.log('   Severity:', event.severity);
        console.log('   Full event:', JSON.stringify(event, null, 2));
        
        // Convert SignalR event to UserNotification format
        const userNotification: UserNotification = {
          id: event.id,
          userId: event.userId,
          type: event.type,
          severity: event.severity === 'Info' ? 0 : event.severity === 'Warning' ? 1 : 2,
          title: event.title,
          message: event.message,
          isRead: event.isRead,
          readAt: event.readAt || null,
          data: event.data || null,
          relatedEntityId: event.relatedEntityId || null,
          relatedEntityType: event.relatedEntityType || null,
          createdAt: event.createdAt,
          updatedAt: null,
        };
        
        // Add new notification to the list at the top
        setNotifications(prev => {
          const updated = [userNotification, ...prev];
          console.log('📝 Notifications state updated, total count:', updated.length);
          return updated;
        });
        loadUnreadCount();
      });
      
      await loadData();
      await loadUnreadCount();
      setLoading(false);
      
      // Cleanup
      return () => {
        unsubscribeNotifications();
      };
    };

    loadUserData();
  }, []);

  const handleUpdateFarm = () => {
    if (!farmData) return;
    
    // Pre-fill form with current farm data
    setFormData({
      name: farmData.name || '',
      farmImage: farmData.farmImage || '',
      farmImageFile: null
    });
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async () => {
    if (!farmData || !formData.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên trang trại');
      return;
    }

    setUpdateLoading(true);
    try {
      const updateData: UpdateFarmFormData = {
        id: farmData.id,
        name: formData.name.trim(),
        farmImageFile: formData.farmImageFile
      };
      
   
      
      const result = await updateFarm(updateData);
      
      if (result.isSuccess) {
        Alert.alert('Thành công', 'Cập nhật thông tin trang trại thành công!');
        setShowUpdateModal(false);
        await loadData(); // Reload data
      } else {
        const errorMessage = result.message || 'Không thể cập nhật thông tin trang trại. Vui lòng thử lại.';
        Alert.alert('Lỗi', errorMessage);
      }
    } catch (error) {
      console.error('Update farm error:', error);
      const errorMessage = handleError(error, 'Update Farm');
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Chọn hình ảnh',
      'Chọn hình ảnh cho trang trại của bạn',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chụp ảnh', onPress: () => takePhoto() },
        { text: 'Thư viện', onPress: () => pickFromLibrary() }
      ]
    );
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPerm.granted) {
        Alert.alert('Quyền bị từ chối', 'Cần quyền camera để chụp ảnh');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if ((result as any).canceled) return;

      // Get URI from result
      const uri = (result as any).assets?.[0]?.uri || (result as any).uri;
      if (!uri) return;

      const fileObj = {
        uri,
        name: `farm_camera_${Date.now()}.jpg`,
        type: 'image/jpeg',
      };
      
      setFormData(prev => ({ 
        ...prev, 
        farmImage: uri,
        farmImageFile: fileObj 
      }));
    } catch (error) {
      console.error('Camera error:', error);
      const errorMessage = handleError(error, 'Take Photo');
      Alert.alert('Lỗi', errorMessage);
    }
  };

  const pickFromLibrary = async () => {
    try {
      // Request media library permissions
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Quyền bị từ chối', 'Cần quyền truy cập thư viện để chọn ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if ((result as any).canceled) return;

      // Get URI from result
      const uri = (result as any).assets?.[0]?.uri || (result as any).uri;
      if (!uri) return;

      const fileObj = {
        uri,
        name: `farm_library_${Date.now()}.jpg`,
        type: 'image/jpeg',
      };
      
      setFormData(prev => ({ 
        ...prev, 
        farmImage: uri,
        farmImageFile: fileObj 
      }));
    } catch (error) {
      console.error('Image picker error:', error);
      const errorMessage = handleError(error, 'Pick Image');
      Alert.alert('Lỗi', errorMessage);
    }
  };

  const navigateToFarmProfile = () => {
    router.push('/pages/farmer/farmProfile');
  };

  const navigateToSettings = () => {
    // Điều hướng đến profile tab
    router.push('./profile');
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
    <View style={styles.container}>
      <Header 
        userName={userData ? `${userData.firstName} ${userData.lastName}` : 'Người dùng'}
        onNotificationPress={() => setShowNotificationModal(true)}
        unreadNotificationCount={unreadCount}
      />
      
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >

      {/* Farm Information Card */}
      {farmData && (
        <TouchableOpacity 
          style={styles.farmCard}
          onPress={() => router.push({
            pathname: '/pages/farmer/farmDetail',
            params: { farmId: farmData.id }
          })}
          activeOpacity={0.7}
        >
          <View style={styles.farmHeader}>
            <View style={styles.farmImageContainer}>
              {farmData.farmImage && farmData.farmImage !== 'string' && farmData.farmImage.startsWith('http') ? (
                <Image 
                  source={{ uri: farmData.farmImage }} 
                  style={styles.farmImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.farmImagePlaceholder}>
                  <Sprout size={40} color="#22C55E" />
                </View>
              )}
            </View>
            <View style={styles.farmInfo}>
              <Text style={styles.farmName}>{farmData.name}</Text>
              <View style={styles.farmStatus}>
                <View 
                  style={[
                    styles.statusDot, 
                    { backgroundColor: farmData.isActive ? '#22C55E' : '#F59E0B' }
                  ]} 
                />
                <Text style={styles.statusText}>
                  {farmData.isActive ? 'Đang hoạt động' : 'Chưa kích hoạt'}
                </Text>
              </View>
              <View style={styles.farmDateRow}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.farmDate}>
                  {new Date(farmData.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          </View>

          {/* Farm Details */}
          <View style={styles.farmDetails}>
            <View style={styles.farmDetailItem}>
              <View style={styles.farmDetailIcon}>
                <Activity size={20} color="#22C55E" />
              </View>
              <View style={styles.farmDetailContent}>
                <Text style={styles.farmDetailLabel}>Trạng thái</Text>
                <Text style={[styles.farmDetailValue, {color: farmData.isActive ? '#22C55E' : '#F59E0B'}]}>
                  {farmData.isActive ? 'Hoạt động' : 'Tạm dừng'}
                </Text>
              </View>
            </View>

            {/* Reputation Score */}
            <View style={styles.farmDetailItem}>
              <View style={[styles.farmDetailIcon, { backgroundColor: '#FEF3C7' }]}>
                <Text style={{ fontSize: 20 }}>⭐</Text>
              </View>
              <View style={styles.farmDetailContent}>
                <Text style={styles.farmDetailLabel}>Điểm uy tín</Text>
                <Text style={[styles.farmDetailValue, { color: '#F59E0B', fontWeight: '600' }]}>
                  {userData?.reputationScore ?? 0} điểm
                </Text>
                {userData?.reputation?.trustScore !== undefined && (
                  <Text style={[styles.farmDetailLabel, { fontSize: 11, marginTop: 2 }]}>
                    Trust Score: {userData.reputation.trustScore}
                  </Text>
                )}
              </View>
            </View>

            {/* <View style={styles.farmDetailItem}>
              <View style={styles.farmDetailIcon}>
                <Leaf size={20} color="#10B981" />
              </View>
              <View style={styles.farmDetailContent}>
                <Text style={styles.farmDetailLabel}>Loại hình</Text>
                <Text style={styles.farmDetailValue}>Nông nghiệp hữu cơ</Text>
              </View>
            </View> */}

            <View style={styles.farmDetailItem}>
              <View style={styles.farmDetailIcon}>
                <MapPin size={20} color="#3B82F6" />
              </View>
              <View style={styles.farmDetailContent}>
                <Text style={styles.farmDetailLabel}>Vị trí</Text>
                <Text style={styles.farmDetailValue}>
                  {userData?.communes}, {userData?.province}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Farm Statistics */}
    

      {/* Weather Info */}
      {/* <View style={styles.weatherCard}>
        <View style={styles.weatherHeader}>
          <Sun size={24} color="#F59E0B" />
          <Text style={styles.weatherTitle}>Thông tin thời tiết</Text>
        </View>
        <View style={styles.weatherContent}>
          <View style={styles.weatherItem}>
            <Sun size={20} color="#F59E0B" />
            <Text style={styles.weatherLabel}>Nhiệt độ</Text>
            <Text style={styles.weatherValue}>28°C</Text>
          </View>
          <View style={styles.weatherItem}>
            <Droplets size={20} color="#3B82F6" />
            <Text style={styles.weatherLabel}>Độ ẩm</Text>
            <Text style={styles.weatherValue}>75%</Text>
          </View>
        </View>
      </View> */}

      {/* Update Farm Button */}
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdateFarm}>
        <Edit3 size={20} color="#fff" />
        <Text style={styles.updateButtonText}>Cập nhật thông tin nông trại</Text>
      </TouchableOpacity>
    </ScrollView>

    {/* Update Farm Modal */}
    <Modal
      visible={showUpdateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowUpdateModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Cập nhật thông tin trang trại</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowUpdateModal(false)}
          >
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Farm Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên trang trại *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập tên trang trại"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              editable={!updateLoading}
            />
          </View>

          {/* Farm Image */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hình ảnh trang trại</Text>
            
            {/* Current Image Preview */}
            {farmData?.farmImage && farmData.farmImage !== 'string' && farmData.farmImage.startsWith('http') && (
              <View style={styles.currentImageContainer}>
                <Text style={styles.currentImageLabel}>Hình ảnh hiện tại:</Text>
                <Image 
                  source={{ uri: farmData.farmImage }} 
                  style={styles.currentImagePreview}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* New Image Preview */}
            {formData.farmImageFile && formData.farmImage && (
              <View style={styles.currentImageContainer}>
                <Text style={styles.currentImageLabel}>Hình ảnh mới đã chọn:</Text>
                <Image 
                  source={{ uri: formData.farmImage }} 
                  style={styles.currentImagePreview}
                  resizeMode="cover"
                />
              </View>
            )}
            
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={handleImagePicker}
              disabled={updateLoading}
            >
              {formData.farmImageFile ? (
                <View style={styles.imageSelected}>
                  <Camera size={20} color="#22C55E" />
                  <Text style={styles.imageSelectedText}>
                    Đã chọn: {formData.farmImageFile.name || 'Hình ảnh mới'}
                  </Text>
                </View>
              ) : (
                <View style={styles.imageUpload}>
                  <Upload size={20} color="#6B7280" />
                  <Text style={styles.imageUploadText}>Chọn hình ảnh mới</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Current Farm Info */}
          <View style={styles.currentInfo}>
            <Text style={styles.currentInfoTitle}>Thông tin hiện tại:</Text>
            <Text style={styles.currentInfoText}>
              Trạng thái: {farmData?.isActive ? 'Hoạt động' : 'Tạm dừng'}
            </Text>
            <Text style={styles.currentInfoText}>
              Ngày tạo: {farmData?.createdAt ? new Date(farmData.createdAt).toLocaleDateString('vi-VN') : 'Chưa xác định'}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowUpdateModal(false)}
            disabled={updateLoading}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, updateLoading && styles.submitButtonDisabled]}
            onPress={handleSubmitUpdate}
            disabled={updateLoading}
          >
            {updateLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Cập nhật</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

      {/* Notification Modal */}
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => {
          console.log('Closing notification modal, current notifications count:', notifications.length);
          setShowNotificationModal(false);
          loadUnreadCount(); // Refresh count when closing
        }}
        role="farmer"
        onRefresh={loadUnreadCount}
        notifications={notifications}
        onNotificationsChange={(updated) => {
          console.log('Notifications changed from modal, new count:', updated.length);
          setNotifications(updated);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#22C55E',
  },
  scrollContainer: {
    flex: 1,
    marginTop: 120, // Space for fixed header
  },
  scrollContent: {
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  farmCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  farmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmImageContainer: {
    marginRight: 16,
  },
  farmImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  farmImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  farmStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
  },
  farmDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  profileDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  actionsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  farmDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  farmDetails: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  farmDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  farmDetailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  farmDetailContent: {
    flex: 1,
  },
  farmDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  farmDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  weatherCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherItem: {
    alignItems: 'center',
    flex: 1,
  },
  weatherLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  weatherValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  updateButton: {
    backgroundColor: '#22C55E',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  imageUploadButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  imageUpload: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  imageSelected: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
  },
  imageSelectedText: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '500',
    marginTop: 8,
  },
  currentInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  currentInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  currentInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  currentImageContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currentImageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  currentImagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
});