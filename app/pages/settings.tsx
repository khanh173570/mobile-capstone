import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  User,
  Bell,
  Shield,
  Globe,
  HelpCircle,
  ChevronRight,
  Moon,
  Smartphone,
  Lock,
  Info
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const settingSections = [
    {
      title: 'Tài khoản',
      items: [
        {
          icon: User,
          title: 'Thông tin cá nhân',
          subtitle: 'Cập nhật thông tin tài khoản',
          onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
        },
        {
          icon: Lock,
          title: 'Đổi mật khẩu',
          subtitle: 'Thay đổi mật khẩu đăng nhập',
          onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
        },
      ],
    },
    {
      title: 'Ứng dụng',
      items: [
        {
          icon: Bell,
          title: 'Thông báo',
          subtitle: 'Quản lý thông báo từ ứng dụng',
          hasSwitch: true,
          switchValue: notifications,
          onSwitchChange: setNotifications,
        },
        {
          icon: Moon,
          title: 'Chế độ tối',
          subtitle: 'Chuyển đổi giao diện tối/sáng',
          hasSwitch: true,
          switchValue: darkMode,
          onSwitchChange: setDarkMode,
        },
        {
          icon: Smartphone,
          title: 'Đồng bộ tự động',
          subtitle: 'Tự động đồng bộ dữ liệu',
          hasSwitch: true,
          switchValue: autoSync,
          onSwitchChange: setAutoSync,
        },
      ],
    },
    {
      title: 'Hỗ trợ',
      items: [
        {
          icon: HelpCircle,
          title: 'Trung tâm trợ giúp',
          subtitle: 'Câu hỏi thường gặp và hướng dẫn',
          onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
        },
        {
          icon: Shield,
          title: 'Chính sách bảo mật',
          subtitle: 'Xem chính sách và điều khoản',
          onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
        },
        {
          icon: Info,
          title: 'Về ứng dụng',
          subtitle: 'Phiên bản 1.0.0',
          onPress: () => Alert.alert('AgriMart', 'Ứng dụng quản lý nông trại\nPhiên bản 1.0.0'),
        },
      ],
    },
  ];

  const renderSettingItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.settingItem}
      onPress={item.onPress}
      disabled={item.hasSwitch}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <item.icon size={20} color="#22C55E" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {item.hasSwitch ? (
          <Switch
            value={item.switchValue}
            onValueChange={item.onSwitchChange}
            trackColor={{ false: '#E5E7EB', true: '#22C55E' }}
            thumbColor={item.switchValue ? '#FFFFFF' : '#FFFFFF'}
          />
        ) : (
          <ChevronRight size={20} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Cài đặt</Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
            </View>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.dangerItem}
              onPress={() => {
                Alert.alert(
                  'Xác nhận',
                  'Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Xóa', style: 'destructive' },
                  ]
                );
              }}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, styles.dangerIcon]}>
                  <User size={20} color="#EF4444" />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, styles.dangerText]}>Xóa tài khoản</Text>
                  <Text style={styles.settingSubtitle}>Xóa vĩnh viễn tài khoản và dữ liệu</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 12,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dangerText: {
    color: '#EF4444',
  },
});