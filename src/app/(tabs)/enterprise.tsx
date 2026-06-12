import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../components/AuthProvider';
import { GraduationCap, Users, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react-native';

export default function EnterprisePortalScreen() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<'hr' | 'educator'>('hr');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-6 pt-6">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-3xl font-bold text-foreground">Enterprise Portal</Text>
            <Text className="text-muted-foreground mt-1">{user?.company || 'Acme Corp'}</Text>
          </View>
          <TouchableOpacity onPress={logout} className="px-4 py-2 bg-surface rounded-full border border-border">
            <Text className="text-xs text-foreground font-medium">Switch Persona</Text>
          </TouchableOpacity>
        </View>

        {/* Segmented Control */}
        <View className="flex-row bg-surface rounded-xl p-1 mb-8 border border-border">
          <TouchableOpacity 
            onPress={() => setView('hr')}
            className={`flex-1 py-2 items-center rounded-lg ${view === 'hr' ? 'bg-primary' : 'bg-transparent'}`}
          >
            <Text className={`font-medium ${view === 'hr' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Corporate HR</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setView('educator')}
            className={`flex-1 py-2 items-center rounded-lg ${view === 'educator' ? 'bg-primary' : 'bg-transparent'}`}
          >
            <Text className={`font-medium ${view === 'educator' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Special Ed Tracker</Text>
          </TouchableOpacity>
        </View>

        {view === 'hr' && (
          <View>
            <View className="flex-row space-x-4 mb-6">
              <View className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center">
                <Users size={32} color="#2563eb" />
                <Text className="text-2xl font-bold text-foreground mt-3">2,401</Text>
                <Text className="text-xs text-muted-foreground mt-1 uppercase tracking-wider text-center">Active Users</Text>
              </View>
              <View className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center">
                <TrendingUp size={32} color="#22c55e" />
                <Text className="text-2xl font-bold text-foreground mt-3">82%</Text>
                <Text className="text-xs text-muted-foreground mt-1 uppercase tracking-wider text-center">Avg Presence</Text>
              </View>
            </View>

            <View className="bg-surface border border-border rounded-xl p-6 mb-6">
              <View className="flex-row items-center mb-4">
                <AlertTriangle size={24} color="#F5A340" />
                <Text className="text-foreground font-bold text-lg ml-2">Top Corporate Weakness</Text>
              </View>
              <Text className="text-foreground font-medium text-lg">Conflict Resolution</Text>
              <Text className="text-muted-foreground mt-2 leading-relaxed">
                Aggregated data shows employees struggle most with de-escalating angry clients. Recommending a mandatory module rollout for Q3.
              </Text>
            </View>
          </View>
        )}

        {view === 'educator' && (
          <View>
            <View className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-8 flex-row items-center">
          <View className="bg-primary h-12 w-12 rounded-full items-center justify-center mr-4">
            <GraduationCap color="#fff" size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-primary font-bold text-lg">Active Student: Sam</Text>
            <Text className="text-primary/80 text-sm">Autism Module • GLP Communication</Text>
          </View>
        </View>

        <Text className="text-lg font-bold text-foreground mb-4">IEP Goal Progress (This Week)</Text>

        <View className="space-y-4 mb-8">
          <View className="bg-surface border border-border rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-semibold text-foreground text-base">Initiate Greetings</Text>
              <Text className="text-muted-foreground text-sm">4 / 5</Text>
            </View>
            <View className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <View className="h-full bg-emerald-500 w-[80%]" />
            </View>
          </View>

          <View className="bg-surface border border-border rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-semibold text-foreground text-base">Request Breaks Calmly</Text>
              <Text className="text-muted-foreground text-sm">2 / 3</Text>
            </View>
            <View className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <View className="h-full bg-emerald-500 w-[66%]" />
            </View>
          </View>
        </View>

        <Text className="text-lg font-bold text-foreground mb-4">Recent Sessions</Text>
        
        <View className="bg-surface border border-border rounded-xl p-4 mb-4">
          <View className="flex-row items-center mb-2">
            <CheckCircle2 size={16} color="#22c55e" className="mr-2" />
            <Text className="font-medium text-foreground">Coffee Shop Order</Text>
          </View>
          <Text className="text-sm text-muted-foreground">
            Sam successfully utilized a gestalt phrase ("Time for a treat!") to initiate the interaction. The AI coach validated the intent perfectly. No sensory overload detected.
          </Text>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
