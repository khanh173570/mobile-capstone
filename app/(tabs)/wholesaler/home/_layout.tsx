import { Stack } from 'expo-router';

export default function WholesalerHomeLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Trang chủ',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="auction-detail" 
        options={{ 
          title: 'Chi tiết đấu giá',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}