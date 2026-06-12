import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, Star, MessageCircle } from 'lucide-react-native';

const MOCK_HISTORY = [
  {
    id: 1,
    date: 'Today, 2:30 PM',
    topic: 'Meeting new people',
    score: 85,
    feedback: 'Great eye contact and warm opener. Try to ask more open-ended questions next time to let the conversation breathe.'
  },
  {
    id: 2,
    date: 'Yesterday, 11:15 AM',
    topic: 'Salary Negotiation',
    score: 92,
    feedback: 'Very confident tone. You anchored high and held your ground without coming across as aggressive. Perfect execution.'
  },
  {
    id: 3,
    date: 'June 10, 4:00 PM',
    topic: 'Small talk & everyday chat',
    score: 78,
    feedback: 'A bit rushed. You fired off questions too quickly. Remember to pause and react to their answers before moving on.'
  }
];

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pt-4 pb-6 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center bg-surface rounded-full border border-border">
          <ArrowLeft size={20} color="#f8fafc" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Workout History</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row items-center mb-6">
          <Clock size={24} color="#64748b" className="mr-2" />
          <Text className="text-muted-foreground text-lg font-medium">Your Recent Sessions</Text>
        </View>

        {MOCK_HISTORY.map((session) => (
          <View key={session.id} className="bg-surface border border-border rounded-2xl p-5 mb-4">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 pr-4">
                <Text className="text-foreground font-bold text-lg mb-1">{session.topic}</Text>
                <Text className="text-muted-foreground text-sm">{session.date}</Text>
              </View>
              <View className="bg-primary/20 px-3 py-1.5 rounded-lg flex-row items-center">
                <Star size={16} color="#3b82f6" fill="#3b82f6" className="mr-1.5" />
                <Text className="text-primary font-bold">{session.score}</Text>
              </View>
            </View>
            
            <View className="bg-background rounded-xl p-4 mt-2">
              <View className="flex-row items-center mb-2">
                <MessageCircle size={16} color="#F5A340" className="mr-2" />
                <Text className="text-foreground font-semibold">Coach Feedback</Text>
              </View>
              <Text className="text-muted-foreground leading-relaxed">
                {session.feedback}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
