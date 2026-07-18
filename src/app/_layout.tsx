import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import { GamificationProvider } from '../components/GamificationProvider';
import { personaTheme } from '../constants/themes';
import { useEffect } from 'react';

function RootLayoutNav() {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [user, segments]);

  // Persona theme: overrides the global.css variables for every token class
  // below this View (b2c = default navy/orange; autism = light low-stimulus;
  // enterprise = neutral slate).
  const theme = personaTheme(user?.persona);

  return (
    <View style={[{ flex: 1 }, theme.vars]}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        {/* Bootstraps the anonymous Supabase identity on app start. */}
        <GamificationProvider>
          <RootLayoutNav />
        </GamificationProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
