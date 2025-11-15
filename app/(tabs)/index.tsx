import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../services/authService';
import { View, ActivityIndicator } from 'react-native';

export default function TabsIndex() {
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
  const href = isFarmer ? '/(tabs)/farmer/home' : '/(tabs)/wholesaler/home';

  return <Redirect href={href} />;
}
