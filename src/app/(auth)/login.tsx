import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../components/AuthProvider';
import { UserPersona, MOCK_USERS } from '../../lib/mockBackend';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { User, Heart, GraduationCap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const { login } = useAuth();

  const handleLogin = (persona: UserPersona) => {
    login(persona);
  };

  const getIcon = (persona: UserPersona) => {
    if (persona === 'b2c_user') return <User size={24} color="#f4f4f5" />;
    if (persona === 'b2b_autism_user') return <Heart size={24} color="#f4f4f5" />;
    return <GraduationCap size={24} color="#f4f4f5" />;
  };

  const getSubtitle = (persona: UserPersona) => {
    if (persona === 'b2c_user') return "Standard Consumer Path & Gamification";
    if (persona === 'b2b_autism_user') return "Neurodivergent Path & Guardrails";
    return "Enterprise Educator Dashboard";
  };

  return (
    <SafeAreaView className="flex-1 bg-background justify-center px-6">
      <View className="items-center mb-8 relative w-full px-2">
        <View style={{ width: '100%', aspectRatio: 1709 / 902 }} className="relative mb-2">
          <Image 
            source={require('../../../assets/images/sg_app_big.png')} 
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
          {/* Deep Vertical Vignette - Fading from App BG to Image BG */}
          <LinearGradient 
            colors={['#0e1424', 'rgba(21, 22, 40, 0)', 'rgba(21, 22, 40, 0)', '#0e1424']} 
            locations={[0, 0.4, 0.6, 1]}
            className="absolute inset-0 pointer-events-none" 
          />
          {/* Deep Horizontal Vignette */}
          <LinearGradient 
            colors={['#0e1424', 'rgba(21, 22, 40, 0)', 'rgba(21, 22, 40, 0)', '#0e1424']} 
            locations={[0, 0.25, 0.75, 1]}
            start={{x: 0, y: 0}} end={{x: 1, y: 0}}
            className="absolute inset-0 pointer-events-none" 
          />
        </View>
        <Text className="text-muted-foreground text-center px-4">
          Select a persona to demo the corresponding path.
        </Text>
      </View>

      <View className="space-y-4">
        {(Object.keys(MOCK_USERS) as UserPersona[]).map((persona) => {
          const user = MOCK_USERS[persona];
          return (
            <TouchableOpacity
              key={persona}
              onPress={() => handleLogin(persona)}
              className="flex-row items-center bg-surface p-4 rounded-2xl border border-border mb-4"
            >
              <View className="h-12 w-12 bg-primary rounded-xl items-center justify-center mr-4">
                {getIcon(persona)}
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">{user.name}</Text>
                <Text className="text-sm text-muted-foreground">{getSubtitle(persona)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
