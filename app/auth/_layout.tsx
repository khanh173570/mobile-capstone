import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Đây là màn hình mặc định khi app mở */}
        <Stack.Screen name="index" />
          <Stack.Screen name="register" />
        {/* Màn hình Not Found */}
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="otp"     />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
