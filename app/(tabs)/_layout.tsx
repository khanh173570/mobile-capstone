import { Tabs } from 'expo-router';
import { Home, Plus, Bell, User } from 'lucide-react-native';
import AuthWrapper from '../../components/AuthWrapper';

export default function TabLayout() {
  return (
    <AuthWrapper>
      <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 90,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Thông tin',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
          href: "/(tabs)/home"
        }}
      />
      <Tabs.Screen
        name="create-auction"
        options={{
          title: 'Tạo đấu giá',
          tabBarIcon: ({ size, color }) => (
            <Plus size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="auction-management"
        options={{
          title: 'Quản lý đấu giá',
          tabBarIcon: ({ size, color }) => (
            <Bell size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      {/* Hide old tabs */}
      <Tabs.Screen
        name="crops"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ai-detection"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="weather"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </AuthWrapper>
  );
}