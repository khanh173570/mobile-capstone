import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationToast from '../components/shared/NotificationToast';
import { useNotifications, useSingleAuctionLogPolling } from '../hooks/useNotifications';
import { NotificationMessage } from '../services/notificationService';
import { registerGlobalNotificationSetter } from '../services/auctionLogNotificationService';
import { AuctionContext } from '../hooks/useAuctionContext';
import { SignalRProvider } from './providers/SignalRProvider';
import { NotificationProvider } from '../contexts/NotificationContext';
import { initializeNotifications, setupPushNotifications } from '../services/pushNotificationService';
import { initializeFirebase } from '../services/firebaseInit';
import { getCurrentUser } from '../services/authService';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Add your custom fonts here if needed
  });
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [currentAuctionId, setCurrentAuctionId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'farmer' | 'wholesaler'>('farmer');
  const { notification, setNotification } = useNotifications();

  // Register global notification setter for use in services
  useEffect(() => {
    registerGlobalNotificationSetter(setNotification);
  }, [setNotification]);

  // Get user role for NotificationProvider
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.role) {
          setUserRole(user.role === 'farmer' ? 'farmer' : 'wholesaler');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    fetchUserRole();
  }, []);

  // Initialize Firebase FIRST before anything else
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const success = await initializeFirebase();
        if (success) {
          //console.log('✓ Firebase init service ready');
        } else {
          // console.warn('⚠️ Firebase init failed, but continuing');
        }
      } catch (error) {
        console.error('✗ Error initializing Firebase:', error);
      } finally {
        // Always mark Firebase as ready (even if it failed) to unblock the app
        setFirebaseReady(true);
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
        //console.log('✓ Firebase notifications initialized');
      } catch (error) {
        console.warn('⚠️ Failed to initialize notifications:', error);
        // Continue anyway
      }
    };

    if (firebaseReady) {
      initNotifications();
    }
  }, [firebaseReady]);

  // Setup device token on app startup if user is already logged in
  // This optimizes the flow: device token is ready immediately, not just after login
  useEffect(() => {
    const setupDeviceTokenOnStartup = async () => {
      try {
        //console.log('📱 [Startup] Checking if user is logged in to setup device token...');
        
        // Get stored user from AsyncStorage
        const userJson = await AsyncStorage.getItem('user');
        if (!userJson) {
          //console.log('ℹ️  [Startup] User not logged in, skipping device token setup');
          return;
        }
        
        try {
          const user = JSON.parse(userJson);
          //console.log('✓ [Startup] User found on startup:', user.id.substring(0, 20) + '...');
          
          // Check if device token already registered for this user (avoid duplicate setup)
          const registeredUserId = await AsyncStorage.getItem('deviceTokenRegisteredUserId');
          if (registeredUserId === user.id) {
            //console.log('✓ [Startup] Device token already registered for this user, skipping');
            return;
          }
          
          // Setup push notifications for this user
          //console.log('📍 [Startup] Setting up device token on app startup...');
          const success = await setupPushNotifications(user.id);
          
          if (success) {
            //console.log('✅ [Startup] Device token setup completed successfully on app startup');
          } else {
            console.warn('⚠️  [Startup] Device token setup had issues, will retry on next login');
          }
        } catch (parseError) {
          console.error('❌ [Startup] Error parsing user from AsyncStorage:', parseError);
        }
      } catch (error) {
        console.error('❌ [Startup] Error setting up device token on startup:', error);
        // Don't crash the app if device token setup fails on startup
      }
    };

    // Don't block on Firebase - just call async setup
    setupDeviceTokenOnStartup();
  }, []);

  useEffect(() => {
    // Hide splash screen only when BOTH fonts are loaded AND Firebase is ready
    if ((loaded || error) && firebaseReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, firebaseReady]);

  // Don't show anything until both fonts and Firebase are ready
  if ((!loaded && !error) || !firebaseReady) {
    return null;
  }

  return (
    <SignalRProvider>
      <NotificationProvider role={userRole}>
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
      </NotificationProvider>
    </SignalRProvider>
  );
}