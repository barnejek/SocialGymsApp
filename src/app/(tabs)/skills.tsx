import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Briefcase,
  Heart,
  Lock,
  Mic,
  Play,
  Sparkles,
  Swords,
  type LucideIcon,
} from 'lucide-react-native';
import { MedalRing, RING_COLORS } from '../../components/gym/ProgressRing';
import { AdultGateModal } from '../../components/gym/AdultGateModal';
import { COLORS } from '../../constants/colors';
import { useGamification, progressMapOf } from '../../components/GamificationProvider';
import {
  canAttempt,
  isRomanceUnlocked,
  masteryLabel,
  type AttemptStatus,
  type SkillDef,
} from '../../lib/gamification';
import { difficultyForMastery } from '../../lib/topics';

const PATH_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  briefcase: Briefcase,
  mic: Mic,
  heart: Heart,
};

const MASTERY_WORD: Record<string, string> = {
  none: 'Not started',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

const NEXT_UP: Record<string, string> = {
  none: 'First session earns Bronze',
  bronze: 'Score 70+ for Silver',
  silver: 'Score 85+ everywhere for Gold',
  gold: 'Mastered — train anytime',
};

const SkeletonBlock = ({ height }: { height: number }) => (
  <View className="rounded-3xl bg-surface border border-border" style={{ height }} />
);

export default function GymScreen() {
  const router = useRouter();
  const { state, loading, error } = useGamification();
  const [selectedPathId, setSelectedPathId] = useState('foundations');
  const [adultGateOpen, setAdultGateOpen] = useState(false);

  const progress = progressMapOf(state);
  const paths = useMemo(
    () => (state?.paths ?? []).slice().sort((a, b) => a.sort - b.sort),
    [state?.paths],
  );

  const foundationsBronzes = (state?.skills ?? []).filter(
    (s) => s.path_id === 'foundations' && (progress[s.id]?.mastery ?? 0) >= 1,
  ).length;
  const pathsOpen = foundationsBronzes >= 2;

  const tiers = useMemo(() => {
    const skills = (state?.skills ?? [])
      .filter((s) => s.path_id === selectedPathId)
      .sort((a, b) => a.tier - b.tier || a.sort - b.sort);
    const byTier = new Map<number, SkillDef[]>();
    for (const s of skills) byTier.set(s.tier, [...(byTier.get(s.tier) ?? []), s]);
    return [...byTier.entries()].sort(([a], [b]) => a - b);
  }, [state?.skills, selectedPathId]);

  const statusOf = (skill: SkillDef): AttemptStatus =>
    state
      ? canAttempt(skill, {
          skills: state.skills,
          paths: state.paths,
          progress,
          isAdult: isRomanceUnlocked(state.profile),
          challengeUsedToday: state.challengeUsedToday,
        })
      : 'locked';

  const masteredPct = (pathId: string) => {
    const skills = (state?.skills ?? []).filter((s) => s.path_id === pathId);
    if (skills.length === 0) return 0;
    const points = skills.reduce((sum, s) => sum + (progress[s.id]?.mastery ?? 0), 0);
    return Math.round((points / (skills.length * 3)) * 100);
  };

  const selectPath = (pathId: string, requiresAdult: boolean) => {
    if (requiresAdult && !isRomanceUnlocked(state?.profile)) {
      setAdultGateOpen(true);
      return;
    }
    setSelectedPathId(pathId);
  };

  const startSession = (skill: SkillDef, asChallenge: boolean) => {
    if (!skill.topic_id) return;
    const mastery = progress[skill.id]?.mastery ?? 0;
    const difficulty = asChallenge ? 'base' : difficultyForMastery(mastery);
    router.push({
      pathname: '/(tabs)/train',
      params: {
        skill: skill.id,
        topic: skill.topic_id,
        difficulty,
        level: String(asChallenge ? 1 : Math.min(3, mastery + 1)),
        ...(asChallenge ? { challenge: '1' } : {}),
      },
    } as never);
  };

  const selectedPath = paths.find((p) => p.id === selectedPathId);
  const adultBlocked =
    selectedPath?.requires_adult && state && !isRomanceUnlocked(state.profile);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-6 pt-6 mb-5">
          <Text className="text-[11px] uppercase tracking-[3px] text-primary">The Gym</Text>
          <Text className="text-3xl font-bold text-foreground mt-1">Pick your path</Text>
          {!pathsOpen && !loading && state && (
            <Text className="text-sm text-muted-foreground mt-2">
              Earn Bronze on{' '}
              {2 - foundationsBronzes === 1
                ? 'one more Foundations skill'
                : 'two Foundations skills'}{' '}
              to open every path.
            </Text>
          )}
        </View>

        {/* ── Path switcher chips ─────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
          className="mb-6"
        >
          {loading && !state
            ? [0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  className="rounded-full bg-surface border border-border"
                  style={{ width: 130, height: 44 }}
                />
              ))
            : paths.map((path) => {
                const Icon = PATH_ICONS[path.icon] ?? Sparkles;
                const locked = path.id !== 'foundations' && !pathsOpen;
                const active = path.id === selectedPathId;
                const pct = masteredPct(path.id);
                return (
                  <Pressable
                    key={path.id}
                    onPress={() => !locked && selectPath(path.id, path.requires_adult)}
                    accessibilityRole="button"
                    accessibilityLabel={`${path.title}${locked ? ', locked' : `, ${pct}% mastered`}`}
                    className={`flex-row items-center rounded-full border px-4 py-2.5 ${
                      active
                        ? 'bg-primary border-primary'
                        : 'bg-surface border-border'
                    } ${locked ? 'opacity-50' : ''}`}
                  >
                    <Icon size={16} color={active ? COLORS.primaryForeground : RING_COLORS.primary} />
                    <Text
                      className={`ml-2 text-sm font-semibold ${
                        active ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      {path.title}
                    </Text>
                    {path.requires_adult && (
                      <View
                        className={`ml-2 rounded-full border px-1.5 py-0.5 ${
                          active ? 'border-primary-foreground/40' : 'border-border'
                        }`}
                      >
                        <Text
                          className={`text-[9px] font-medium ${
                            active ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          18+
                        </Text>
                      </View>
                    )}
                    {locked && (
                      <View className="ml-2">
                        <Lock size={12} color={COLORS.mutedForeground} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
        </ScrollView>

        <View className="px-6">
          {error && !state && (
            <Text className="text-sm text-muted-foreground text-center mt-10">
              Couldn't load your gym. Check your connection and reopen this tab.
            </Text>
          )}

          {loading && !state && (
            <View className="gap-4 mt-2">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonBlock key={i} height={96} />
              ))}
            </View>
          )}

          {selectedPath && (
            <Text className="text-sm text-muted-foreground mb-6">{selectedPath.tagline}</Text>
          )}

          {adultBlocked ? (
            <View className="rounded-3xl border border-border bg-surface p-8 items-center">
              <Text className="text-sm text-muted-foreground text-center">
                This path contains adult dating scenarios.
              </Text>
              <TouchableOpacity
                onPress={() => setAdultGateOpen(true)}
                className="mt-4 bg-primary rounded-full px-6 py-3"
              >
                <Text className="text-primary-foreground font-bold">
                  Unlock Romance &amp; Dating
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-8">
              {tiers.map(([tier, skills]) => (
                <View key={tier}>
                  <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                    Tier {tier}
                  </Text>
                  <View className="gap-4 border-l border-border pl-5">
                    {skills.map((skill) => {
                      const status = statusOf(skill);
                      const mastery = progress[skill.id]?.mastery ?? 0;
                      const mLabel = masteryLabel(mastery);
                      const unlocked = status === 'unlocked';
                      const challengeable = status === 'challenge';
                      return (
                        <View
                          key={skill.id}
                          className={`rounded-3xl border bg-surface p-4 ${
                            unlocked ? 'border-border' : 'border-border/60'
                          }`}
                        >
                          <View className="flex-row items-center">
                            <MedalRing mastery={mastery} size={52} stroke={4}>
                              {!unlocked && <Lock size={16} color={COLORS.mutedForeground} />}
                            </MedalRing>
                            <View className="flex-1 ml-4 mr-2">
                              <Text
                                className={`font-semibold ${
                                  unlocked ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                              >
                                {skill.title}
                              </Text>
                              <Text className="text-xs text-muted-foreground mt-0.5">
                                {unlocked
                                  ? `${MASTERY_WORD[mLabel]} · ${NEXT_UP[mLabel]}`
                                  : skill.payoff_line}
                              </Text>
                            </View>
                            <View>
                              {unlocked && skill.topic_id && (
                                <TouchableOpacity
                                  onPress={() => startSession(skill, false)}
                                  accessibilityLabel={`Train ${skill.title}`}
                                  className="flex-row items-center bg-primary rounded-full px-4 py-2"
                                >
                                  <Play size={13} color={COLORS.primaryForeground} fill={COLORS.primaryForeground} />
                                  <Text className="text-primary-foreground font-bold text-xs ml-1.5">
                                    Train
                                  </Text>
                                </TouchableOpacity>
                              )}
                              {unlocked && !skill.topic_id && (
                                <Text className="text-xs text-muted-foreground">Coming soon</Text>
                              )}
                              {challengeable && skill.topic_id && (
                                <TouchableOpacity
                                  onPress={() => startSession(skill, true)}
                                  accessibilityLabel={`Challenge ${skill.title}: one shot per day, Gold standard on the first try unlocks it with full mastery`}
                                  className="flex-row items-center border border-border rounded-full px-4 py-2"
                                >
                                  <Swords size={13} color={RING_COLORS.primary} />
                                  <Text className="text-foreground font-semibold text-xs ml-1.5">
                                    Challenge
                                  </Text>
                                </TouchableOpacity>
                              )}
                              {status === 'challenge-used' && (
                                <Text className="text-xs text-muted-foreground text-right w-20">
                                  Challenge back tomorrow
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <AdultGateModal
        open={adultGateOpen}
        onClose={() => setAdultGateOpen(false)}
        onConfirmed={() => setSelectedPathId('romance')}
      />
    </SafeAreaView>
  );
}
