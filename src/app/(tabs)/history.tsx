import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, Star, MessageCircle, Swords } from 'lucide-react-native';
import { useGamification } from '../../components/GamificationProvider';

// Static sample rows kept below the divider until there's enough real history
// to delete them.
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

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return `Today, ${time}`;
  if (sameDay(d, yesterday)) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString([], { month: 'long', day: 'numeric' })}, ${time}`;
};

export default function HistoryScreen() {
  const router = useRouter();
  const { state } = useGamification();

  const realSessions = useMemo(() => {
    const skillTitle = Object.fromEntries((state?.skills ?? []).map((s) => [s.id, s.title]));
    return (state?.recentSessions ?? []).map((s) => ({
      id: s.id,
      date: formatDate(s.created_at),
      topic: skillTitle[s.skill_id] ?? s.skill_id,
      score: s.composite,
      xp: s.xp_awarded,
      challenge: s.was_challenge,
    }));
  }, [state?.recentSessions, state?.skills]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pt-4 pb-6 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back" className="h-10 w-10 items-center justify-center bg-surface rounded-full border border-border">
          <ArrowLeft size={20} color="#f8fafc" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Workout History</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row items-center mb-6">
          <Clock size={24} color="#64748b" />
          <Text className="text-muted-foreground text-lg font-medium ml-2">Your Recent Sessions</Text>
        </View>

        {realSessions.length === 0 && (
          <View className="bg-surface border border-border rounded-2xl p-5 mb-6">
            <Text className="text-foreground font-semibold mb-1">No workouts yet</Text>
            <Text className="text-muted-foreground text-sm">
              Finish your first session and it shows up here instantly.
            </Text>
          </View>
        )}

        {realSessions.map((session) => (
          <View key={session.id} className="bg-surface border border-border rounded-2xl p-5 mb-4">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-4">
                <View className="flex-row items-center">
                  <Text className="text-foreground font-bold text-lg mb-1">{session.topic}</Text>
                  {session.challenge && (
                    <View className="ml-2 mb-1 flex-row items-center rounded-full border border-primary/40 px-2 py-0.5">
                      <Swords size={10} color="#F5A340" />
                      <Text className="text-[10px] text-primary ml-1">Challenge</Text>
                    </View>
                  )}
                </View>
                <Text className="text-muted-foreground text-sm">{session.date}</Text>
              </View>
              <View className="items-end">
                <View className="bg-primary/20 px-3 py-1.5 rounded-lg flex-row items-center">
                  <Star size={16} color="#F5A340" fill="#F5A340" />
                  <Text className="text-primary font-bold ml-1.5 tabular-nums">{session.score}</Text>
                </View>
                <Text className="text-[11px] text-muted-foreground mt-1.5 tabular-nums">+{session.xp} XP</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Sample data divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-[10px] uppercase tracking-widest text-muted-foreground mx-3">
            Sample data
          </Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        {MOCK_HISTORY.map((session) => (
          <View key={session.id} className="bg-surface/60 border border-border rounded-2xl p-5 mb-4">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 pr-4">
                <Text className="text-foreground font-bold text-lg mb-1">{session.topic}</Text>
                <Text className="text-muted-foreground text-sm">{session.date}</Text>
              </View>
              <View className="bg-primary/20 px-3 py-1.5 rounded-lg flex-row items-center">
                <Star size={16} color="#F5A340" fill="#F5A340" />
                <Text className="text-primary font-bold ml-1.5 tabular-nums">{session.score}</Text>
              </View>
            </View>

            <View className="bg-background rounded-xl p-4 mt-2">
              <View className="flex-row items-center mb-2">
                <MessageCircle size={16} color="#F5A340" />
                <Text className="text-foreground font-semibold ml-2">Coach Feedback</Text>
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
