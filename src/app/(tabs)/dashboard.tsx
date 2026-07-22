import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import { Check, Clock, Dumbbell, Flame, Play, Settings2, TrendingUp } from 'lucide-react-native';
import { useAuth } from '../../components/AuthProvider';
import { useGamification } from '../../components/GamificationProvider';
import { ProgressRing, RING_COLORS } from '../../components/gym/ProgressRing';
import { COLORS } from '../../constants/colors';
import {
  compositeOf,
  presenceRating,
  xpToNextLevel,
  type AxisScores,
  type GamificationState,
} from '../../lib/gamification';

// ---------------------------------------------------------------------------
// B2C dashboard: real HUD from Supabase stats (streak, level + XP ring, Reps),
// today's quests, and the Presence Rating rings. The old fake streak is gone —
// every number here comes from gam_get_state.
// ---------------------------------------------------------------------------

const AXES: { key: keyof AxisScores; label: string; color: string }[] = [
  { key: 'engagement', label: 'Engagement', color: RING_COLORS.engagement },
  { key: 'comfort', label: 'Comfort', color: RING_COLORS.comfort },
  { key: 'openness', label: 'Openness', color: RING_COLORS.openness },
];

/** Percent of the way from the current level to the next one. */
const levelRingPct = (totalXp: number, level: number): number => {
  const floor = Math.round(100 * Math.pow(level, 1.5));
  const ceil = Math.round(100 * Math.pow(level + 1, 1.5));
  const span = Math.max(1, ceil - floor);
  return Math.max(0, Math.min(100, ((totalXp - floor) / span) * 100));
};

const SkeletonBlock = ({ height }: { height: number }) => (
  <View className="rounded-2xl bg-surface border border-border" style={{ height }} />
);

const DailyQuests = ({ state }: { state: GamificationState }) => {
  const defs = Object.fromEntries(state.quests.map((q) => [q.id, q]));
  const rows = state.todayQuests;

  return (
    <View className="bg-surface border border-border rounded-2xl p-5 mb-6">
      <View className="flex-row items-baseline justify-between mb-4">
        <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Today's quests
        </Text>
        <Text className="text-[10px] text-muted-foreground">reset at midnight</Text>
      </View>
      {rows.length === 0 && (
        <Text className="text-sm text-muted-foreground">
          Your three quests appear after your first session today.
        </Text>
      )}
      <View className="gap-4">
        {rows.map((uq) => {
          const def = defs[uq.quest_id];
          if (!def) return null;
          const pct = Math.min(100, (uq.progress / Math.max(1, def.target)) * 100);
          return (
            <View key={uq.quest_id} className="flex-row items-center gap-3">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full border ${
                  uq.completed ? 'border-engagement bg-engagement/15' : 'border-border'
                }`}
              >
                {uq.completed ? (
                  <Check size={15} color={RING_COLORS.engagement} />
                ) : (
                  <Text className="text-[10px] tabular-nums text-muted-foreground">
                    {uq.progress}/{def.target}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text
                  className={`text-sm ${
                    uq.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                  }`}
                  numberOfLines={1}
                >
                  {def.description}
                </Text>
                <View className="h-1 rounded-full bg-muted overflow-hidden mt-1.5">
                  <View
                    className={`h-full rounded-full ${uq.completed ? 'bg-engagement' : 'bg-primary'}`}
                    style={{ width: `${pct}%` }}
                  />
                </View>
              </View>
              <Text className="text-xs tabular-nums text-comfort">+{def.reps_reward} Reps</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const PresencePanel = ({ state }: { state: GamificationState }) => {
  const reducedMotion = useReducedMotion();

  const { current, sinceYesterday } = useMemo(() => {
    const sessions = state.recentSessions ?? [];
    const current = presenceRating(sessions);

    // "+N since yesterday": today's rolling average vs. the same average
    // computed without today's sessions.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const beforeToday = sessions.filter(
      (s) => new Date(s.created_at).getTime() < startOfToday.getTime(),
    );
    const prev = presenceRating(beforeToday);
    const sinceYesterday =
      current && prev && beforeToday.length < sessions.length
        ? compositeOf(current) - compositeOf(prev)
        : null;
    return { current, sinceYesterday };
  }, [state.recentSessions]);

  return (
    <View className="bg-surface border border-border rounded-2xl p-5 mb-6">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Presence Rating
        </Text>
        {sinceYesterday !== null && sinceYesterday > 0 && (
          <View className="flex-row items-center bg-engagement/15 rounded-full px-2.5 py-1">
            <TrendingUp size={11} color={RING_COLORS.engagement} />
            <Text className="text-[11px] font-semibold ml-1" style={{ color: RING_COLORS.engagement }}>
              +{sinceYesterday} since yesterday
            </Text>
          </View>
        )}
      </View>
      <Text className="text-[11px] text-muted-foreground mb-5">
        Rolling average of your last 10 sessions — you vs. your past self.
      </Text>
      {current ? (
        <View className="flex-row justify-between px-2">
          {AXES.map(({ key, label, color }) => (
            <View key={key} className="items-center gap-2">
              <ProgressRing
                value={current[key]}
                size={84}
                stroke={8}
                color={color}
                animate={!reducedMotion}
                label={`${label} ${current[key]} out of 100`}
              >
                <Text className="text-xl font-semibold text-foreground tabular-nums">
                  {current[key]}
                </Text>
              </ProgressRing>
              <Text className="text-xs font-medium text-foreground">{label}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-sm text-muted-foreground">
          Complete your first session and your three rings appear here.
        </Text>
      )}
    </View>
  );
};

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { state, loading } = useGamification();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const firstName = user?.name.split(' ')[0] ?? 'there';

  const stats = state?.stats ?? null;
  const totalSessions = useMemo(
    () => (state?.skillProgress ?? []).reduce((sum, p) => sum + p.sessions_count, 0),
    [state?.skillProgress],
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-6 pt-6">
        {/* Profile Header */}
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center">
            <View className="h-14 w-14 rounded-full bg-primary/20 items-center justify-center mr-4 overflow-hidden border-2 border-primary/50">
              <Image
                source={require('../../../assets/images/alex-avatar.jpg')}
                className="h-full w-full"
              />
            </View>
            <View>
              <Text className="text-2xl font-bold text-foreground">Hi, {firstName}!</Text>
              <Text className="text-muted-foreground mt-0.5">Ready to level up?</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-x-3">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              accessibilityLabel="Profile settings"
              className="h-10 w-10 bg-surface rounded-full border border-border items-center justify-center"
            >
              <Settings2 size={20} color={COLORS.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={logout}
              className="px-4 py-2 bg-surface rounded-full border border-border justify-center"
            >
              <Text className="text-xs text-foreground font-medium">Switch Persona</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HUD: streak · level ring · Reps */}
        {loading && !state ? (
          <View className="mb-6 gap-4">
            <SkeletonBlock height={110} />
            <SkeletonBlock height={140} />
          </View>
        ) : (
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center">
              <Flame size={28} color={RING_COLORS.primary} />
              <Text className="text-2xl font-bold text-foreground mt-2 tabular-nums">
                {stats?.current_streak ?? 0}
              </Text>
              <Text className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                Day streak
              </Text>
            </View>
            <View className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center">
              <ProgressRing
                value={stats ? levelRingPct(stats.total_xp, stats.level) : 0}
                size={56}
                stroke={5}
                animate={!reducedMotion}
                label={
                  stats
                    ? `Level ${stats.level}, ${xpToNextLevel(stats.total_xp)} XP to the next level`
                    : 'Level'
                }
              >
                <Text className="text-lg font-bold text-foreground tabular-nums">
                  {stats?.level ?? 0}
                </Text>
              </ProgressRing>
              <Text className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
                Level
              </Text>
              {stats && (
                <Text className="text-[9px] text-muted-foreground/80 mt-0.5 tabular-nums">
                  {xpToNextLevel(stats.total_xp)} XP to next
                </Text>
              )}
            </View>
            <View className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center">
              <Dumbbell size={28} color={RING_COLORS.comfort} />
              <Text className="text-2xl font-bold text-foreground mt-2 tabular-nums">
                {stats?.reps ?? 0}
              </Text>
              <Text className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                Reps
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/train')}
          className="bg-primary rounded-3xl p-6 mb-6 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-primary-foreground font-bold text-2xl mb-1">
              Start Today's Workout
            </Text>
            <Text className="text-primary-foreground/80">
              One session keeps the flame alive
            </Text>
          </View>
          <View className="bg-primary-foreground/20 h-12 w-12 rounded-full items-center justify-center">
            <Play color={COLORS.primaryForeground} size={24} fill={COLORS.primaryForeground} />
          </View>
        </TouchableOpacity>

        {state && <DailyQuests state={state} />}
        {state && <PresencePanel state={state} />}

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/history')}
          className="bg-surface border border-border rounded-2xl p-5 mb-6 flex-row items-center justify-between"
          accessibilityLabel="Workout history"
        >
          <View className="flex-row items-center">
            <Clock size={20} color={COLORS.mutedForeground} />
            <Text className="text-foreground font-semibold ml-3">Workout history</Text>
          </View>
          <Text className="text-muted-foreground text-sm tabular-nums">
            {totalSessions} session{totalSessions === 1 ? '' : 's'}
          </Text>
        </TouchableOpacity>

        <View className="bg-primary/10 rounded-2xl p-6 mb-12">
          <Text className="text-primary font-bold text-lg mb-2">Social Gyms Pro</Text>
          <Text className="text-primary/80 mb-4">
            You have 3 free sessions remaining. Upgrade to unlock unlimited scenarios.
          </Text>
          <TouchableOpacity className="bg-primary px-6 py-3 rounded-full items-center">
            <Text className="text-primary-foreground font-bold">Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
