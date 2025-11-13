import { Stack } from 'expo-router';

export default function BiddingHistoryLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Lịch sử đấu thầu',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}