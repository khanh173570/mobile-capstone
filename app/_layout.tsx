import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import NotificationToast from '../components/shared/NotificationToast';
import { useNotifications, useSingleAuctionLogPolling } from '../hooks/useNotifications';
import { NotificationMessage } from '../services/notificationService';
import { registerGlobalNotificationSetter } from '../services/auctionLogNotificationService';
import { AuctionContext } from '../hooks/useAuctionContext';
import { SignalRProvider } from './providers/SignalRProvider';
import { initializeNotifications } from '../services/pushNotificationService';
import { initializeFirebase } from '../services/firebaseInit';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Add your custom fonts here if needed
  });
  const [currentAuctionId, setCurrentAuctionId] = useState<string | null>(null);
  const { notification, setNotification } = useNotifications();

  // Register global notification setter for use in services
  useEffect(() => {
    registerGlobalNotificationSetter(setNotification);
  }, [setNotification]);

  // Initialize Firebase FIRST before anything else
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const success = await initializeFirebase();
        if (success) {
          console.log('✓ Firebase init service ready');
        } else {
          console.error('✗ Firebase init service failed');
        }
      } catch (error) {
        console.error('✗ Error initializing Firebase:', error);
      }
    };

    initFirebase();
  }, []);

  // Initialize Firebase Push Notifications
  // Firebase app is initialized first, then messaging handlers are registered
  useEffect(() => {
    const initNotifications = async () => {
      try {
        const unsubscribe = await initializeNotifications();
        console.log('✓ Firebase notifications initialized');
      } catch (error) {
        console.error('✗ Failed to initialize notifications:', error);
      }
    };

    initNotifications();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // ❌ Polling DISABLED - Using SignalR for real-time updates instead
  // SignalR broadcasts events instantly, no need for polling every 20 seconds
  // useSingleAuctionLogPolling({
  //   auctionId: currentAuctionId,
  //   intervalSeconds: 20,
  //   enabled: !!currentAuctionId,
  //   resetOnMount: false,
  //   onNewLog: (logId) => {
  //     console.log('New log from global polling:', logId);
  //   },
  // });

  if (!loaded && !error) {
    return null;
  }

  return (
    <SignalRProvider>
      <AuctionContext.Provider value={{ currentAuctionId, setCurrentAuctionId }}>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="pages" />
          </Stack>
          
          {/* Global notification toast */}
          <NotificationToast
            notification={notification}
            onDismiss={() => setNotification(null)}
          />
        </View>
      </AuctionContext.Provider>
    </SignalRProvider>
  );
}