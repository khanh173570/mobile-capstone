import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Bell, X, AlertCircle } from 'lucide-react-native';
import { NotificationMessage } from '../../services/notificationService';

interface NotificationToastProps {
  notification: NotificationMessage | null;
  onDismiss?: () => void;
  onPress?: () => void;
  duration?: number;
}

export default function NotificationToast({
  notification,
  onDismiss,
  onPress,
  duration = 5000,
}: NotificationToastProps) {
  const [opacity] = useState(new Animated.Value(0));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
        if (onDismiss) {
          onDismiss();
        }
      });
    }
  }, [notification]);

  if (!visible || !notification) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'auction_log':
        return '#ECFDF5'; // Light green
      case 'system':
        return '#FEF3C7'; // Light yellow
      case 'info':
      default:
        return '#DBEAFE'; // Light blue
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'auction_log':
        return '#10B981'; // Green
      case 'system':
        return '#F59E0B'; // Yellow
      case 'info':
      default:
        return '#3B82F6'; // Blue
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'auction_log':
        return '#047857'; // Dark green
      case 'system':
        return '#92400E'; // Dark yellow
      case 'info':
      default:
        return '#1E40AF'; // Dark blue
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.toast,
          {
            backgroundColor: getBackgroundColor(),
            borderLeftColor: getBorderColor(),
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          {notification.type === 'auction_log' ? (
            <Bell size={20} color={getBorderColor()} />
          ) : (
            <AlertCircle size={20} color={getBorderColor()} />
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.title,
              {
                color: getTextColor(),
              },
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text
            style={[
              styles.body,
              {
                color: getTextColor(),
              },
            ]}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              setVisible(false);
              if (onDismiss) {
                onDismiss();
              }
            });
          }}
        >
          <X size={18} color={getBorderColor()} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
