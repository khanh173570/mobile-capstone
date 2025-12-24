import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { X, Bell } from 'lucide-react-native';
import { BackendNotification ,
  getNotificationTypeColor,
  getNotificationIcon,
} from '../../services/notificationService';

interface NotificationPopupProps {
  notification: BackendNotification | null;
  onDismiss: () => void;
  onPress: () => void;
  duration?: number;
}

const { width } = Dimensions.get('window');

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  notification,
  onDismiss,
  onPress,
  duration = 5000,
}) => {
  const [opacity] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-100));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      
      // Animate in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setVisible(false);
          onDismiss();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [notification, duration, onDismiss]);

  if (!visible || !notification) {
    return null;
  }

  const typeColor = getNotificationTypeColor(notification.type);
  const typeIcon = getNotificationIcon(notification.type);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.container,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.popup, { borderLeftColor: typeColor }]}
            onPress={onPress}
            activeOpacity={0.9}
          >
            <View style={[styles.iconContainer, { backgroundColor: typeColor + '20' }]}>
              <Text style={styles.icon}>{typeIcon}</Text>
            </View>

            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text style={styles.message} numberOfLines={2}>
                {notification.message}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                Animated.parallel([
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }),
                  Animated.timing(translateY, {
                    toValue: -100,
                    duration: 200,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  setVisible(false);
                  onDismiss();
                });
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  container: {
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    marginHorizontal: 16,
    pointerEvents: 'box-none',
  },
  popup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 70,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  message: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

