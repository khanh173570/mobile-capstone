import { Stack } from 'expo-router';

export default function AuctionBrowseLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Tạo yêu cầu',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="detail" 
        options={{ 
          title: 'Chi tiết sản phẩm',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="history-detail" 
        options={{ 
          title: 'Chi tiết lịch sử',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}