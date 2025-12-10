import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="withdraw" />
      <Stack.Screen name="transactions" />
    </Stack>
  );
}