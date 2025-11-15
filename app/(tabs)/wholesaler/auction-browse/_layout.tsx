import { Stack } from 'expo-router';

export default function AuctionBrowseLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Duyệt đấu giá',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}