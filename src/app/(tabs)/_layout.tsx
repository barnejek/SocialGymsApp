import React from 'react';
import { Tabs } from 'expo-router';
import { Dumbbell, LayoutDashboard, Settings, Award, FlaskConical } from 'lucide-react-native';
import { useAuth } from '../../components/AuthProvider';
import { personaTheme } from '../../constants/themes';

export default function TabLayout() {
  const { user } = useAuth();

  // Conditionally hide tabs based on persona
  const isEducator = user?.persona === 'b2b_educator';
  const theme = personaTheme(user?.persona);

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: theme.colors.tabBarActive,
      tabBarInactiveTintColor: theme.colors.tabBarInactive,
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
      }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null // Intelligent router screen, hidden from tabs
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
          href: user?.persona === 'b2c_user' ? '/(tabs)/dashboard' : null
        }}
      />
      <Tabs.Screen
        name="science"
        options={{
          title: 'Science',
          tabBarIcon: ({ color }) => <FlaskConical color={color} size={24} />,
          href: user?.persona === 'b2c_user' ? '/(tabs)/science' : null
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
          tabBarIcon: ({ color }) => <Award color={color} size={24} />,
          href: user?.persona === 'b2c_user' ? '/(tabs)/skills' : null
        }}
      />
      <Tabs.Screen
        name="enterprise"
        options={{
          title: 'Enterprise',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
          href: isEducator ? '/(tabs)/enterprise' : null
        }}
      />
      <Tabs.Screen
        name="autism-home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
          href: user?.persona === 'b2b_autism_user' ? '/(tabs)/autism-home' : null
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Train',
          tabBarIcon: ({ color }) => <Dumbbell color={color} size={24} />,
          href: '/(tabs)/train'
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null // Hidden from tab bar, accessed via Dashboard
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null // Hidden from tab bar, accessed via the B2C Dashboard "Workouts" card
        }}
      />
    </Tabs>
  );
}
