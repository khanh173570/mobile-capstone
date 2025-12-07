import { Stack } from 'expo-router';

export default function PagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="farmer/farmProfile" />
      <Stack.Screen name="farmer/farmDetail" />
      <Stack.Screen name="farmer/harvestList" />
      <Stack.Screen name="farmer/harvestGradeDetail" />
      <Stack.Screen name="farmer/add-auction-harvests" />
      <Stack.Screen name="farmer/auction-detail" />
      <Stack.Screen name="farmer/farmer-escrow-contracts" />
      <Stack.Screen name="wholesaler" />
      <Stack.Screen name="wholesaler/wholesaler-escrow-contracts" />
    </Stack>
  );
}