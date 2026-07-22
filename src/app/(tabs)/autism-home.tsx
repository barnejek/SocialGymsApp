import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../components/AuthProvider';
import { Play, Info, ShieldCheck, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { personaTheme } from '../../constants/themes';

// Carer portal renders under the calm autism theme.
const CALM = personaTheme('b2b_autism_user').colors;

// Mock per-goal progress; in production this comes from session history.
const GOAL_PROGRESS = [40, 85, 60];

export default function AutismHomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const firstName = user?.name.split(' ')[0] ?? 'friend';
  const iepGoals = user?.autismProfile?.iepGoals ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-6 pt-6">
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-3xl font-bold text-foreground">Welcome, {firstName}</Text>
            <Text className="text-muted-foreground mt-1">Carer Portal & Session Prep</Text>
          </View>
          <TouchableOpacity onPress={logout} className="px-4 py-2 bg-surface rounded-full border border-border">
            <Text className="text-xs text-foreground font-medium">Switch Persona</Text>
          </TouchableOpacity>
        </View>

        {/* Carer Info Panel */}
        <View className="bg-surface/50 border border-primary/30 rounded-2xl p-6 mb-6">
          <View className="flex-row items-center mb-4">
            <ShieldCheck color={CALM.primary} size={24} />
            <Text className="text-foreground font-bold text-lg ml-2">Active Guardrails</Text>
          </View>
          <Text className="text-muted-foreground text-sm mb-4 leading-relaxed">
            The Trinity Engine is currently operating in <Text className="text-primary font-medium">NDBI Mode</Text>. 
            All AI responses will be literal, avoid metaphors, and speak at a calm 0.8x pace. 
            Eye contact tracking is strictly disabled to reduce sensory overload.
          </Text>
        </View>

        {/* IEP Goals */}
        <View className="bg-surface border border-border rounded-2xl p-6 mb-8">
          <View className="flex-row items-center mb-4">
            <Heart color={CALM.primary} size={24} />
            <Text className="text-foreground font-bold text-lg ml-2">Today's Focus (IEP)</Text>
          </View>
          
          <View className="space-y-4">
            {iepGoals.map((goal, i) => (
              <View key={goal} className="flex-row items-start mb-4">
                <View className="h-6 w-6 rounded-full bg-primary/20 items-center justify-center mr-3 mt-0.5">
                  <Text className="text-primary text-xs font-bold">{i + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-medium">{goal}</Text>
                  <Text className="text-muted-foreground text-sm mt-1">
                    Goal progress: {GOAL_PROGRESS[i] ?? 0}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Low Stimulus Start Button */}
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/train')}
          className="bg-primary/90 rounded-2xl p-6 mb-12 flex-row items-center justify-center"
        >
          <Play color="#ffffff" size={24} fill="#ffffff" />
          <Text className="text-white font-bold text-xl ml-3">Begin Session</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
