import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { checkFarmUpdateStatus, clearFarmUpdateStatus } from '../services/authService';
import FarmUpdateForm from '../components/FarmUpdateForm';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [needsFarmUpdate, setNeedsFarmUpdate] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const needsUpdate = await checkFarmUpdateStatus();
      setNeedsFarmUpdate(needsUpdate);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFarmUpdateComplete = async () => {
    setNeedsFarmUpdate(false);
    await clearFarmUpdateStatus();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Đang kiểm tra trạng thái...</Text>
      </View>
    );
  }

  if (needsFarmUpdate) {
    return (
      <FarmUpdateForm onComplete={handleFarmUpdateComplete} />
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});