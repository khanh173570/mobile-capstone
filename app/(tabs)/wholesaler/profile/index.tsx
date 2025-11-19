import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, MapPin, Phone, LogOut, User, MapPinned, Building2 } from 'lucide-react-native';
import { getCurrentUser, logout } from '../../../../services/authService';
import Header from '../../../../components/shared/Header';

export default function WholesalerProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?',
      [
        {
          text: 'Hủy',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          onPress: async () => {
            await performLogout();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
      // Navigate to login screen
      router.replace('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi đăng xuất');
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Hồ sơ cá nhân" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Header title="Hồ sơ cá nhân" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không thể tải thông tin người dùng</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Hồ sơ cá nhân" />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </Text>
          </View>
          <View style={styles.profileNameContainer}>
            <Text style={styles.profileName}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.profileRole}>Nhà bán buôn</Text>
          </View>
        </View>

        {/* Profile Information Card */}
        <View style={styles.infoCard}>
          {/* Email */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Mail size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
          </View>

          {/* Phone */}
          <View style={[styles.infoRow, styles.borderTop]}>
            <View style={styles.iconContainer}>
              <Phone size={20} color="#059669" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.label}>Số điện thoại</Text>
              <Text style={styles.value}>{user.phoneNumber}</Text>
            </View>
          </View>

          {/* Province */}
          <View style={[styles.infoRow, styles.borderTop]}>
            <View style={styles.iconContainer}>
              <Building2 size={20} color="#F59E0B" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.label}>Tỉnh/Thành phố</Text>
              <Text style={styles.value}>{user.province}</Text>
            </View>
          </View>

          {/* District/Commune */}
          <View style={[styles.infoRow, styles.borderTop]}>
            <View style={styles.iconContainer}>
              <MapPinned size={20} color="#EC4899" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.label}>Quận/Phường</Text>
              <Text style={styles.value}>{user.communes}</Text>
            </View>
          </View>

          {/* Address */}
          <View style={[styles.infoRow, styles.borderTop]}>
            <View style={styles.iconContainer}>
              <MapPin size={20} color="#8B5CF6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.label}>Địa chỉ chi tiết</Text>
              <Text style={styles.value}>{user.address}</Text>
            </View>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          <View style={styles.accountInfoCard}>
            <View style={styles.accountInfoRow}>
              <Text style={styles.accountInfoLabel}>Loại tài khoản:</Text>
              <Text style={styles.accountInfoValue}>{user.role === 'wholesaler' ? 'Nhà bán buôn' : user.role}</Text>
            </View>
            <View style={[styles.accountInfoRow, styles.borderTop]}>
              <Text style={styles.accountInfoLabel}>Ngày tạo:</Text>
              <Text style={styles.accountInfoValue}>
                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.logoutButton, logoutLoading && styles.logoutButtonDisabled]}
            onPress={handleLogout}
            disabled={logoutLoading}
          >
            {logoutLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <LogOut size={20} color="#FFFFFF" />
                <Text style={styles.logoutButtonText}>Đăng xuất</Text>
              </>
            )}
          </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 120,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 40,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileNameContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  accountInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  accountInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  accountInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  accountInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  buttonContainer: {
    marginTop: 12,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});