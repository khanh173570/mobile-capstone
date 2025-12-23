import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  showNotification?: boolean;
  role?: 'farmer' | 'wholesaler';
  onNotificationPress?: () => void;
  unreadNotificationCount?: number; // Deprecated - use NotificationBell instead
}

export default function Header({
  title,
  subtitle,
  userName,
  showNotification = true,
  role = 'farmer',
  onNotificationPress,
  unreadNotificationCount = 0, // Deprecated
}: HeaderProps) {

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#fff" 
        translucent={false}
      />
      <View style={styles.content}>
        <View style={styles.textContainer}>
          {title ? (
            <Text style={styles.title}>{title}</Text>
          ) : (
            <>
              <Text style={styles.welcomeText}>
                {subtitle || 'Xin chào,'}
              </Text>
              <Text style={styles.userName}>
                {userName || 'Người dùng'}
              </Text>
            </>
          )}
        </View>
        
        {showNotification && (
          <NotificationBell role={role} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  notificationBadgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
});