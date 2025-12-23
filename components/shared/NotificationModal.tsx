import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationTypeName,
  getNotificationIcon,
  getNotificationColor,
  UserNotification,
} from '../../services/userNotificationService';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  role: 'farmer' | 'wholesaler';
  onRefresh?: () => void;
  notifications?: UserNotification[];
  onNotificationsChange?: (notifications: UserNotification[]) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  role,
  onRefresh,
  notifications: initialNotifications = [],
  onNotificationsChange,
}) => {
  const [notifications, setNotifications] = useState<UserNotification[]>(initialNotifications);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // //console.log('🔄 Loading notifications from API...');
      const data = await getUserNotifications(1, 50); // Get latest 50
      // //console.log(`✅ Loaded ${data.length} notifications`);
      setNotifications(data);
      onNotificationsChange?.(data);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // //console.log('🔄 Marking notification as read:', notificationId);
      const success = await markNotificationAsRead(notificationId);
      if (success) {
        // Update local state immediately
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
        onRefresh?.(); // Refresh unread count in parent
      }
    } catch (error) {
      // console.error('❌ Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      // Remove from local state immediately for instant UI feedback
      const updated = notifications.filter(n => n.id !== notificationId);
      setNotifications(updated);
      onNotificationsChange?.(updated);
      //console.log('✅ Notification removed from UI:', notificationId);
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    onRefresh?.();
  };

  const handleMarkAllAsRead = async () => {
    try {
      //console.log('🔄 Marking all notifications as read...');
      const success = await markAllNotificationsAsRead();
      if (success) {
        // Update local state immediately
        setNotifications(prev =>
          prev.map(n => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString()
          }))
        );
        onRefresh?.(); // Refresh unread count in parent
        Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc');
      } else {
        Alert.alert('Lỗi', 'Không thể đánh dấu tất cả thông báo');
      }
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi đánh dấu thông báo');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderNotificationItem = ({ item }: { item: UserNotification }) => {
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.notificationItemUnread,
        ]}
        onPress={() => handleMarkAsRead(item.id)}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getNotificationColor(item.severity) + '20' },
          ]}
        >
          <Text style={styles.icon}>{getNotificationIcon(item.type)}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.typeLabel}>
            {getNotificationTypeName(item.type)}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <MaterialIcons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="notifications-none" size={48} color="#D1D5DB" />
      <Text style={styles.emptyText}>Không có thông báo nào</Text>
      <Text style={styles.emptySubText}>
        Bạn sẽ nhận thông báo khi có sự kiện mới
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header2}>
            <View>
              <Text style={styles.headerTitle}>Thông báo</Text>
              {unreadCount > 0 && (
                <Text style={styles.unreadLabel}>
                  {unreadCount} thông báo chưa đọc
                </Text>
              )}
            </View>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity 
                  onPress={handleMarkAllAsRead} 
                  style={styles.markAllButton}
                >
                  <Text style={styles.markAllButtonText}>Đọc tất cả</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={
                notifications.length === 0 ? styles.listContent : undefined
              }
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 0.9,
    display: 'flex',
    flexDirection: 'column',
  },
  header2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  unreadLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  notificationItemUnread: {
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginLeft: 8,
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    marginTop: -4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});
