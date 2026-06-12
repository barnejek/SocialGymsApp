import React from 'react';
import { Tabs } from 'expo-router';
import { Dumbbell, LayoutDashboard, Settings, Network, Award, Clock } from 'lucide-react-native';
import { useAuth } from '../../components/AuthProvider';

export default function TabLayout() {
  const { user } = useAuth();
  
  // Conditionally hide tabs based on persona
  const isEducator = user?.persona === 'b2b_educator';

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#2563eb',
      tabBarInactiveTintColor: '#64748b',
      tabBarStyle: {
        backgroundColor: '#0f172a',
        borderTopColor: '#1e293b',
      }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null as any // Intelligent router screen, hidden from tabs
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
          href: (user?.persona === 'b2c_user' ? '/(tabs)/dashboard' : null) as any
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
          tabBarIcon: ({ color }) => <Award color={color} size={24} />,
          href: (user?.persona === 'b2c_user' ? '/(tabs)/skills' : null) as any
        }}
      />
      <Tabs.Screen
        name="enterprise"
        options={{
          title: 'Enterprise',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
          href: (isEducator ? '/(tabs)/enterprise' : null) as any
        }}
      />
      <Tabs.Screen
        name="autism-home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
          href: (user?.persona === 'b2b_autism_user' ? '/(tabs)/autism-home' : null) as any
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Train',
          tabBarIcon: ({ color }) => <Dumbbell color={color} size={24} />,
          href: '/(tabs)/train' as any
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null as any // Hidden from tab bar, accessed via Dashboard
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Clock color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
