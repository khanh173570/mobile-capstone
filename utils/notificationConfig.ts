import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure how notifications are handled when app is in foreground
 */
export const configureNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

/**
 * Configure notification channels for Android
 */
export const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('auction', {
      name: 'Auction Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    console.log('✓ Android notification channels configured');
  }
};

/**
 * Setup notification listeners
 */
export const setupNotificationListeners = () => {
  // Handle notification received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📬 Notification received:', notification);
    console.log('  Title:', notification.request.content.title);
    console.log('  Body:', notification.request.content.body);
    console.log('  Data:', notification.request.content.data);
  });

  // Handle notification tap
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification tapped:', response);
    const data = response.notification.request.content.data;
    
    // Handle navigation based on notification data
    if (data?.screen) {
      console.log('  Navigate to:', data.screen);
      // Add your navigation logic here
    }
  });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};
