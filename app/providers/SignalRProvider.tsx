import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signalRService } from '../../services/signalRService';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SignalRContextType {
  isConnected: boolean;
  reconnect: () => Promise<void>;
}

const SignalRContext = createContext<SignalRContextType>({
  isConnected: false,
  reconnect: async () => {},
});

export const useSignalR = () => useContext(SignalRContext);

interface SignalRProviderProps {
  children: ReactNode;
}

/**
 * SignalR Provider Component
 * Manages global SignalR connection lifecycle
 * - Waits for user authentication before connecting
 * - Auto-reconnects when app comes to foreground
 * - Disconnects when app goes to background
 */
export const SignalRProvider: React.FC<SignalRProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        setIsAuthenticated(!!token);
        if (token) {
          console.log('SignalR Provider: User authenticated, connecting...');
          await connectSignalR();
        } else {
          console.log('SignalR Provider: User not authenticated, skipping connection');
        }
      } catch (error) {
        console.error('SignalR Provider: Error checking authentication', error);
      }
    };

    checkAuthentication();

    // Subscribe to connection state changes
    const unsubscribe = signalRService.onConnectionStateChange((connected) => {
      console.log('SignalR Provider: Connection state changed:', connected);
      setIsConnected(connected);
    });

    // Handle app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      unsubscribe();
      subscription.remove();
      signalRService.disconnect();
    };
  }, []);

  const connectSignalR = async () => {
    try {
      // Double-check token exists before connecting
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('SignalR Provider: No token, skipping connection');
        return;
      }

      console.log('SignalR Provider: Connecting...');
      await signalRService.connect();
    } catch (error) {
      console.error('SignalR Provider: Connection failed', error);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log('SignalR Provider: App state changed:', nextAppState);
    
    if (nextAppState === 'active') {
      // App came to foreground - reconnect if disconnected
      if (!signalRService.isConnected()) {
        console.log('SignalR Provider: Reconnecting (app foreground)...');
        connectSignalR();
      }
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background - optionally disconnect to save resources
      // Comment out if you want to maintain connection in background
      console.log('SignalR Provider: Disconnecting (app background)...');
      signalRService.disconnect();
    }
  };

  const reconnect = async () => {
    console.log('SignalR Provider: Manual reconnect requested');
    await signalRService.disconnect();
    await connectSignalR();
  };

  return (
    <SignalRContext.Provider value={{ isConnected, reconnect }}>
      {children}
    </SignalRContext.Provider>
  );
};
