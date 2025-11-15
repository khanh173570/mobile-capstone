import { Stack } from 'expo-router';

export default function FarmProfileLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}