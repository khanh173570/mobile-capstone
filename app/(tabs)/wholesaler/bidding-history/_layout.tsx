import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function BiddingHistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#111827',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 24,
          color: '#111827',
        },
        headerShadowVisible: true,
        contentStyle: {
          backgroundColor: '#F9FAFB',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Lịch sử đấu giá',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="auction-detail" 
        options={{ 
          title: 'Chi tiết đấu giá',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}