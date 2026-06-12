import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../components/AuthProvider';
import { currentStats } from '../../lib/gamification';
import { Flame, Clock, Activity, Play, Settings2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const stats = currentStats;
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-6 pt-6">
        {/* Profile Header */}
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center">
            <View className="h-14 w-14 rounded-full bg-primary/20 items-center justify-center mr-4 overflow-hidden border-2 border-primary/50">
              <Image 
                source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }} 
                className="h-full w-full"
              />
            </View>
            <View>
              <Text className="text-2xl font-bold text-foreground">Hi, Alex!</Text>
              <Text className="text-muted-foreground mt-0.5">Ready to level up?</Text>
            </View>
          </View>
          <View className="flex-row items-center space-x-3 gap-x-3">
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile' as any)} className="h-10 w-10 bg-surface rounded-full border border-border items-center justify-center">
              <Settings2 size={20} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} className="px-4 py-2 bg-surface rounded-full border border-border justify-center">
              <Text className="text-xs text-foreground font-medium">Switch Persona</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gamification Stats */}
        <View className="flex-row space-x-4 mb-8">
          <View className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center">
            <Flame size={32} color="#F5A340" />
            <Text className="text-2xl font-bold text-foreground mt-3">{stats.streakDays}</Text>
            <Text className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Day Streak</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/history' as any)}
            className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center"
          >
            <Clock size={32} color="#2563eb" />
            <Text className="text-2xl font-bold text-foreground mt-3">{stats.totalSessions}</Text>
            <Text className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Workouts</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/train' as any)}
          className="bg-primary rounded-3xl p-6 mb-8 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-primary-foreground font-bold text-2xl mb-1">Start Today's Workout</Text>
            <Text className="text-primary-foreground/80">3 scenarios recommended for you</Text>
          </View>
          <View className="bg-primary-foreground/20 h-12 w-12 rounded-full items-center justify-center">
            <Play color="#ffffff" size={24} fill="#ffffff" />
          </View>
        </TouchableOpacity>

        <View className="bg-surface border border-border rounded-2xl p-6 mb-8">
          <View className="flex-row items-center mb-4">
            <Activity size={20} color="#22c55e" />
            <Text className="text-lg font-semibold text-foreground ml-2">Presence Score</Text>
          </View>
          <View className="flex-row items-end">
            <Text className="text-5xl font-bold text-foreground">{stats.presenceScore}</Text>
            <Text className="text-lg text-muted-foreground mb-1 ml-1">/ 100</Text>
          </View>
          <Text className="text-sm text-muted-foreground mt-3">
            Based on your eye contact, engagement, and vocal tone over the last 7 days.
          </Text>
        </View>
        
        <View className="bg-primary/10 rounded-2xl p-6 mb-12">
          <Text className="text-primary font-bold text-lg mb-2">Social Gyms Pro</Text>
          <Text className="text-primary/80 mb-4">You have 3 free sessions remaining. Upgrade to unlock unlimited scenarios.</Text>
          <TouchableOpacity className="bg-primary px-6 py-3 rounded-full items-center">
            <Text className="text-primary-foreground font-bold">Upgrade Now</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
