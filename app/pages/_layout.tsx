import { Stack } from 'expo-router';

export default function PagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="farmProfile" />
      <Stack.Screen name="farmDetail" />
      <Stack.Screen name="harvestList" />
    </Stack>
  );
}