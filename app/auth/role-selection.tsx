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
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Sprout, ShoppingBag, User } from 'lucide-react-native';
import { Loader2, UserCircle } from 'lucide-react-native';
import { getRoles, Role } from '../../services/authService';
import { handleError } from '@/utils/errorHandler';

export default function RoleSelection() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoles();
        if (response.isSuccess && response.data.items) {
          // Filter out admin role - only show farmer and consumer
          const filteredRoles = response.data.items.filter(
            role => role.name !== 'admin'
          );
          setRoles(filteredRoles);
        } else {
          Alert.alert('Lỗi', 'Không thể tải danh sách vai trò');
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        const errorMessage = handleError(error, 'Load Roles');
        Alert.alert('Lỗi', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const handleContinue = () => {
    if (!selectedRole) {
      Alert.alert('Thông báo', 'Vui lòng chọn vai trò của bạn');
      return;
    }

    // Navigate to register screen with selected role
    router.push({
      pathname: '/auth/register',
      params: { roleId: selectedRole }
    });
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'farmer':
        return <Sprout size={48} color="#22C55E" />;
      case 'consumer':
        return <ShoppingBag size={48} color="#3B82F6" />;
      default:
        return <User size={48} color="#6B7280" />;
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'farmer':
        return '#22C55E';
      case 'consumer':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getRoleDescription = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'farmer':
        return 'Quản lý nông trại, đăng sản phẩm, bán nông sản';
      case 'consumer':
        return 'Mua nông sản, tìm kiếm sản phẩm từ nông dân';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Sprout size={60} color="#FFFFFF" strokeWidth={2} />
        <Text style={styles.appTitle}>AgriMart</Text>
        <Text style={styles.subtitle}>Quản lý Nông trại thông minh</Text>
      </View>

      {/* Role Selection */}
      <View style={styles.formContainer}>
        <Text style={styles.welcomeText}>Chọn vai trò của bạn</Text>
        <Text style={styles.welcomeSubtext}>
          Vui lòng chọn vai trò phù hợp với mục đích sử dụng của bạn
        </Text>

        <ScrollView contentContainerStyle={styles.rolesContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleCard,
                selectedRole === role.id && {
                  borderColor: getRoleColor(role.name),
                  borderWidth: 2,
                  shadowColor: getRoleColor(role.name),
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                },
              ]}
              onPress={() => setSelectedRole(role.id)}
            >
              <View style={styles.roleIconContainer}>
                {getRoleIcon(role.name)}
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleName}>
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </Text>
                <Text style={styles.roleDescription}>
                  {getRoleDescription(role.name)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
        >
          <Text style={styles.continueButtonText}>Tiếp tục</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/auth')}
        >
          <Text style={styles.backButtonText}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#22C55E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#22C55E',
  },
  header: {
    flex: 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
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
    flex: 0.75,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  rolesContainer: {
    paddingVertical: 16,
  },
  roleCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
});