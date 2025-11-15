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
    </Stack>
  );
}