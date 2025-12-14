import { Stack } from 'expo-router';

export default function WholesalerProfileLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Hồ sơ',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="wallet" 
        options={{ 
          title: 'Ví của tôi',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="withdraw" 
        options={{ 
          title: 'Rút tiền',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="transactions" 
        options={{ 
          title: 'Giao dịch',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="reports" 
        options={{ 
          title: 'Báo cáo',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}