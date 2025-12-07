import { Stack } from 'expo-router';

export default function WholesalerHomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Trang chủ',
        }} 
      />
      <Stack.Screen 
        name="auction-detail" 
        options={{ 
          title: 'Chi tiết đấu giá',
        }} 
      />
    </Stack>
  );
}