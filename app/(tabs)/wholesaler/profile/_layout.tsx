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
    </Stack>
  );
}