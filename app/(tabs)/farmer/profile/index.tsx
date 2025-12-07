import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  LogOut,
  Settings,
  Shield,
  Award,
  Star,
  Calendar,
  Activity,
  TrendingUp,
  FileText
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getUserProfile, logout, getCurrentUser } from '../../../../services/authService';
import type { User as UserType } from '../../../../services/authService';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const response = await getUserProfile();
      if (response.isSuccess) {
        setUser(response.data);
      } else {
        console.error('Failed to get user profile:', response.message);
        // Fallback to stored user data
        const storedUser = await getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to stored user data
      const storedUser = await getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Thông báo', 'Chức năng chỉnh sửa hồ sơ sẽ sớm được cập nhật');
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileHeaderContent}>
            <View style={styles.avatarContainer}>
              <User size={40} color="#22C55E" />
            </View>
            <Text style={styles.userName}>
              {user ? `${user.firstName} ${user.lastName}` : 'Người dùng'}
            </Text>
            <Text style={styles.userRole}>
              {user?.role === 'farmer' ? 'Nông dân' : user?.role || 'Chưa xác định'}
            </Text>
          </View>
        </View>

        {/* Profile Stats */}
        {/* <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Activity size={20} color="#22C55E" />
            </View>
            <Text style={styles.statValue}>142</Text>
            <Text style={styles.statLabel}>Hoạt động</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Star size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <TrendingUp size={20} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Thành công</Text>
          </View>
        </View> */}

        {/* Achievements */}
        {/* <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Thành tích</Text>
          <View style={styles.achievementsList}>
            <View style={styles.achievementItem}>
              <Award size={24} color="#22C55E" />
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>Nông dân xuất sắc</Text>
                <Text style={styles.achievementDesc}>Đạt được 100+ giao dịch thành công</Text>
              </View>
            </View>
            <View style={[styles.achievementItem, { borderBottomWidth: 0 }]}>
              <Star size={24} color="#F59E0B" />
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>Đánh giá cao</Text>
                <Text style={styles.achievementDesc}>Duy trì điểm đánh giá 4.5+ sao</Text>
              </View>
            </View>
          </View>
        </View> */}

        {/* Profile Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            {/* Email */}
            <View style={styles.infoRow}>
              <Mail size={20} color="#6B7280" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>
                  {user?.email || 'Chưa cập nhật'}
                </Text>
              </View>
            </View>

            {/* Phone */}
            <View style={styles.infoRow}>
              <Phone size={20} color="#6B7280" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>
                  {user?.phoneNumber || 'Chưa cập nhật'}
                </Text>
              </View>
            </View>

            {/* Address */}
            <View style={[styles.infoRow, styles.lastInfoRow]}>
              <MapPin size={20} color="#6B7280" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>
                  {user?.address || 'Chưa cập nhật'}
                </Text>
                {user?.communes && (
                  <Text style={[styles.infoLabel, { marginTop: 4 }]}>
                    {user.communes}, {user.province}
                  </Text>
                )}
              </View>
            </View>
             <View style={styles.infoRow}>
              <Shield size={20} color="#6B7280" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày tạo tài khoản</Text>
                <Text style={styles.infoValue}>
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                    : 'Chưa xác định'
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Escrow Contracts Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.escrowButton}
            onPress={() => router.push('/pages/farmer/farmer-escrow-contracts')}
          >
            <Shield size={20} color="#FFFFFF" />
            <Text style={styles.escrowButtonText}>Hợp đồng cọc tiền</Text>
          </TouchableOpacity>
        </View>

        {/* Account Information */}
        <View style={styles.accountSection}>
         
          
          
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          

        

          <TouchableOpacity
            onPress={handleLogout}
            style={styles.actionButton}>
            <LogOut size={20} color="#EF4444" style={styles.actionIcon} />
            <Text style={[styles.actionText, styles.logoutText]}>
              Đăng xuất
            </Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  profileHeader: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  profileHeaderContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userRole: {
    fontSize: 16,
    color: '#BBF7D0',
    marginTop: 4,
  },
  infoSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  accountSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  actionsSection: {
    marginHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  logoutText: {
    color: '#EF4444',
  },
  accountId: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  appInfo: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  appName: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  appVersion: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  achievementsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  achievementsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  achievementContent: {
    marginLeft: 12,
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  contractButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  contractButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  escrowButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  escrowButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});