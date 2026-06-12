import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, CheckCircle2, Star } from 'lucide-react-native';

const SKILLS = [
  { id: 1, name: 'Basic Small Talk', status: 'completed', tier: 1 },
  { id: 2, name: 'Active Listening', status: 'unlocked', tier: 1 },
  { id: 3, name: 'Giving Feedback', status: 'locked', tier: 2 },
  { id: 4, name: 'Salary Negotiation', status: 'locked', tier: 3 },
  { id: 5, name: 'Conflict De-escalation', status: 'locked', tier: 4 },
];

export default function SkillsTreeScreen() {
  const renderNode = (name: string, status: 'completed' | 'unlocked' | 'locked', tier: number, isCenter = false) => (
    <TouchableOpacity 
      className={`p-4 rounded-2xl border-2 items-center justify-center h-32 ${isCenter ? 'w-full max-w-[200px]' : 'w-[48%]' }
        ${status === 'completed' ? 'bg-primary/20 border-primary/50' : 
          status === 'unlocked' ? 'bg-surface border-primary' : 
          'bg-surface/50 border-border opacity-60'}`}
    >
      <View className={`h-10 w-10 rounded-full items-center justify-center mb-3
        ${status === 'completed' ? 'bg-primary' : 
          status === 'unlocked' ? 'bg-surface border-2 border-primary' : 
          'bg-muted'}`}
      >
        {status === 'completed' ? <CheckCircle2 color="#fff" size={20} /> : 
         status === 'unlocked' ? <Star color="#2563eb" size={20} /> : 
         <Lock color="#64748b" size={20} />}
      </View>
      <Text className={`font-bold text-center text-sm ${status === 'locked' ? 'text-muted-foreground' : 'text-foreground'}`}>
        {name}
      </Text>
      <Text className="text-xs text-muted-foreground mt-1">Tier {tier}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mb-10 px-2">
          <Text className="text-3xl font-bold text-foreground">Skills Tree</Text>
          <Text className="text-muted-foreground mt-1">Unlock new conversational paths.</Text>
        </View>

        <View className="flex-col w-full px-2 space-y-6">
          
          {/* Tier 1 */}
          <View className="bg-surface/30 border border-border rounded-2xl p-4">
            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Tier 1: Foundations</Text>
            <View className="items-center">
              {renderNode('Basic Small Talk', 'completed', 1, true)}
            </View>
          </View>

          {/* Tier 2 */}
          <View className="bg-surface/30 border border-border rounded-2xl p-4">
            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Tier 2: The Split</Text>
            <View className="flex-row w-full justify-between">
              {renderNode('Active Listening', 'unlocked', 2)}
              {renderNode('Office Politics', 'locked', 2)}
            </View>
          </View>

          {/* Tier 3 */}
          <View className="bg-surface/30 border border-border rounded-2xl p-4">
            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Tier 3: Advanced Core</Text>
            <View className="items-center">
              {renderNode('Salary Negotiation', 'locked', 3, true)}
            </View>
          </View>

          {/* Tier 4 */}
          <View className="bg-surface/30 border border-border rounded-2xl p-4">
            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Tier 4: Master Level</Text>
            <View className="items-center">
              {renderNode('Conflict De-escalation', 'locked', 4, true)}
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
