import { Tabs } from 'expo-router';
import { Home, Plus, Bell, User, Eye, ShoppingCart } from 'lucide-react-native';
import AuthWrapper from '../../components/shared/AuthWrapper';
import { useState, useEffect } from 'react';
import { getCurrentUser } from '../../services/authService';
import { View, ActivityIndicator } from 'react-native';

export default function TabLayout() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.role) {
          setUserRole(user.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserRole();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  const isFarmer = userRole === 'farmer';
  const initialRouteName = isFarmer ? 'farmer/home' : 'wholesaler/home';

  return (
    <AuthWrapper>
      <Tabs
        initialRouteName={initialRouteName}
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
        }}
      >
        {/* Index Route - Redirect only, no tab */}
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />

        {/* Farmer Routes */}
        <Tabs.Screen
          name="farmer/home"
          options={{
            href: isFarmer ? undefined : null,
            title: 'Thông tin',
            tabBarIcon: ({ size, color }) => (
              <Home size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="farmer/create-auction"
          options={{
            href: isFarmer ? undefined : null,
            title: 'Tạo đấu giá',
            tabBarIcon: ({ size, color }) => (
              <Plus size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="farmer/auction-management"
          options={{
            href: isFarmer ? undefined : null,
            title: 'Quản lý đấu giá',
            tabBarIcon: ({ size, color }) => (
              <Bell size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="farmer/profile"
          options={{
            href: isFarmer ? undefined : null,
            title: 'Profile',
            tabBarIcon: ({ size, color }) => (
              <User size={size} color={color} strokeWidth={2} />
            ),
          }}
        />

        {/* Wholesaler Routes */}
        <Tabs.Screen
          name="wholesaler/home"
          options={{
            href: !isFarmer ? undefined : null,
            title: 'Trang chủ',
            tabBarIcon: ({ size, color }) => (
              <Home size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="wholesaler/auction-browse"
          options={{
            href: !isFarmer ? undefined : null,
            title: 'Duyệt đấu giá',
            tabBarIcon: ({ size, color }) => (
              <Eye size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="wholesaler/bidding-history"
          options={{
            href: !isFarmer ? undefined : null,
            title: 'Lịch sử đấu thầu',
            tabBarIcon: ({ size, color }) => (
              <ShoppingCart size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="wholesaler/profile"
          options={{
            href: !isFarmer ? undefined : null,
            title: 'Profile',
            tabBarIcon: ({ size, color }) => (
              <User size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      </Tabs>
    </AuthWrapper>
  );
}