import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check, Flame, Snowflake, Sunrise } from 'lucide-react-native';
import { ProgressRing, RING_COLORS } from './ProgressRing';
import type { AchievementDef, QuestDef, RewardPayload } from '../../lib/gamification';

// ---------------------------------------------------------------------------
// Staged end-of-session reward sequence — mirror of the web RewardSequence.
// Rendered PURELY from RewardPayload; no client-side reward math. Stages
// auto-advance (~1.2s+) and any tap skips ahead. Celebration is budgeted:
// confetti fires only on mastery-up or level-up. Haptics: light impact per
// stage, success notification on the celebration stage.
// ---------------------------------------------------------------------------

type StageId = 'scores' | 'xp' | 'streak' | 'quests' | 'celebration' | 'achievements';

const MASTERY_NAME = ['', 'Bronze', 'Silver', 'Gold'] as const;

/** Small confetti burst — the single allowed celebration effect. */
const ConfettiBurst = () => {
  const anim = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        angle: (i / 24) * 2 * Math.PI + Math.random() * 0.3,
        dist: 80 + Math.random() * 90,
        size: 5 + Math.random() * 5,
        color: [RING_COLORS.primary, RING_COLORS.engagement, RING_COLORS.openness, RING_COLORS.gold][i % 4],
      })),
    [],
  );

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }).start();
  }, [anim]);

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      accessibilityElementsHidden
    >
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: p.size,
            height: p.size,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.angle) * p.dist] }) },
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.angle) * p.dist - 40] }) },
              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }) },
            ],
          }}
        />
      ))}
    </View>
  );
};

/** Tabular count-up number; instant when reduced motion is on. */
const CountUp = ({ to, duration = 800, instant }: { to: number; duration?: number; instant: boolean }) => {
  const [shown, setShown] = useState(instant ? to : 0);
  useEffect(() => {
    if (instant) {
      setShown(to);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - start) / duration);
      setShown(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [to, duration, instant]);
  return <Text className="tabular-nums">{shown}</Text>;
};

const STREAK_COPY: Record<
  RewardPayload['streakEvent'],
  (r: RewardPayload) => { icon: 'flame' | 'snowflake' | 'sunrise'; title: string; sub: string } | null
> = {
  extended: (r) => ({ icon: 'flame', title: `Day ${r.streak}`, sub: 'Streak extended. Same time tomorrow?' }),
  frozen: (r) => ({ icon: 'snowflake', title: `${r.streak}-day streak held`, sub: 'A streak freeze covered your day off.' }),
  reset: () => ({ icon: 'sunrise', title: 'Fresh start', sub: 'Day 1 of your next streak.' }),
  none: () => null,
};

export const RewardSequence = ({
  rewards,
  questDefs,
  achievementDefs,
  onDone,
}: {
  rewards: RewardPayload;
  questDefs: QuestDef[];
  achievementDefs: AchievementDef[];
  onDone: () => void;
}) => {
  const reducedMotion = useReducedMotion();

  const stages = useMemo<StageId[]>(() => {
    const s: StageId[] = ['scores', 'xp'];
    if (STREAK_COPY[rewards.streakEvent](rewards)) s.push('streak');
    if (rewards.questsCompleted.length > 0) s.push('quests');
    if (rewards.leveledUp || rewards.masteryAfter > rewards.masteryBefore) s.push('celebration');
    if (rewards.achievementsUnlocked.length > 0) s.push('achievements');
    return s;
  }, [rewards]);

  const [idx, setIdx] = useState(0);
  const stage = stages[idx];
  const doneRef = useRef(false);

  const advance = useCallback(() => {
    setIdx((i) => {
      if (i + 1 < stages.length) return i + 1;
      if (!doneRef.current) {
        doneRef.current = true;
        setTimeout(onDone, 0);
      }
      return i;
    });
  }, [stages.length, onDone]);

  // Haptic beat per stage; a success notification on the celebration.
  useEffect(() => {
    if (stage === 'celebration') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [stage]);

  // Auto-advance timer per stage (first stage gets longer to breathe).
  useEffect(() => {
    const ms = stage === 'scores' ? 2600 : stage === 'celebration' ? 2400 : 1400;
    const id = setTimeout(advance, ms);
    return () => clearTimeout(id);
  }, [stage, advance]);

  const questById = Object.fromEntries(questDefs.map((q) => [q.id, q]));
  const achById = Object.fromEntries(achievementDefs.map((a) => [a.id, a]));

  const streak = STREAK_COPY[rewards.streakEvent](rewards);
  const masteryUp = rewards.masteryAfter > rewards.masteryBefore;

  return (
    <Pressable
      onPress={advance}
      accessibilityRole="button"
      accessibilityLabel="Continue"
      className="absolute inset-0 z-50 items-center justify-center bg-background/95 px-6"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <View className="w-full max-w-sm items-center justify-center" style={{ minHeight: 320 }}>
        {stage === 'scores' && (
          <View className="items-center">
            <Text className="text-xs uppercase tracking-[3px] text-primary">Session score</Text>
            <View className="mt-6">
              <ProgressRing
                value={rewards.composite}
                size={160}
                stroke={11}
                animate={!reducedMotion}
                label={`Composite score ${rewards.composite}`}
              >
                <Text className="text-5xl font-semibold text-foreground tabular-nums">
                  <CountUp to={rewards.composite} instant={reducedMotion} />
                </Text>
                <Text className="text-[10px] text-muted-foreground">/100</Text>
              </ProgressRing>
            </View>
            <View className="mt-6 flex-row gap-6">
              {(
                [
                  ['Engagement', rewards.scores.best.engagement],
                  ['Comfort', rewards.scores.best.comfort],
                  ['Openness', rewards.scores.best.openness],
                ] as const
              ).map(([label, v]) => (
                <Text key={label} className="text-xs text-muted-foreground">
                  {label} <Text className="tabular-nums text-foreground">{v}</Text>
                </Text>
              ))}
            </View>
          </View>
        )}

        {stage === 'xp' && (
          <View className="items-center">
            <Text className="text-xs uppercase tracking-[3px] text-primary">Experience</Text>
            <Text className="mt-4 text-6xl font-semibold text-foreground">
              +<CountUp to={rewards.xpAwarded} instant={reducedMotion} />
              <Text className="text-2xl text-muted-foreground"> XP</Text>
            </Text>
            <View className="mt-6 w-full gap-1.5">
              {rewards.xpBreakdown.map((b, i) => (
                <View key={i} className="flex-row items-center justify-between gap-8">
                  <Text className="text-sm text-muted-foreground">{b.reason}</Text>
                  <Text className="text-sm tabular-nums text-foreground">+{b.amount}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {stage === 'streak' && streak && (
          <View className="items-center">
            {streak.icon === 'flame' && <Flame size={64} color={RING_COLORS.primary} />}
            {streak.icon === 'snowflake' && <Snowflake size={64} color={RING_COLORS.openness} />}
            {streak.icon === 'sunrise' && <Sunrise size={64} color={RING_COLORS.primary} />}
            <Text className="mt-4 text-4xl font-semibold text-foreground">{streak.title}</Text>
            <Text className="mt-2 text-sm text-muted-foreground">{streak.sub}</Text>
          </View>
        )}

        {stage === 'quests' && (
          <View className="w-full">
            <Text className="text-xs uppercase tracking-[3px] text-primary text-center">Quest complete</Text>
            <View className="mt-6 gap-3">
              {rewards.questsCompleted.map((qid) => (
                <View
                  key={qid}
                  className="flex-row items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
                >
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-engagement/15">
                    <Check size={16} color={RING_COLORS.engagement} />
                  </View>
                  <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                    {questById[qid]?.description ?? qid}
                  </Text>
                  <Text className="text-xs tabular-nums text-comfort">
                    +{questById[qid]?.reps_reward ?? 0} Reps
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {stage === 'celebration' && (
          <View className="items-center">
            {!reducedMotion && <ConfettiBurst />}
            {masteryUp ? (
              <>
                <Text className="text-xs uppercase tracking-[3px] text-primary">Mastery up</Text>
                <Text className="mt-4 text-5xl font-semibold text-foreground">
                  {MASTERY_NAME[rewards.masteryAfter]}
                </Text>
                {rewards.challenge && (
                  <Text className="mt-2 text-sm text-muted-foreground">
                    Challenge cleared — skill unlocked.
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text className="text-xs uppercase tracking-[3px] text-primary">Level up</Text>
                <Text className="mt-4 text-6xl font-semibold text-foreground">{rewards.level}</Text>
              </>
            )}
            {masteryUp && rewards.leveledUp && (
              <Text className="mt-3 text-sm text-muted-foreground">
                …and you reached level {rewards.level}.
              </Text>
            )}
          </View>
        )}

        {stage === 'achievements' && (
          <View className="w-full">
            <Text className="text-xs uppercase tracking-[3px] text-primary text-center">Badge earned</Text>
            <View className="mt-6 gap-3">
              {rewards.achievementsUnlocked.map((aid) => (
                <View key={aid} className="rounded-2xl border border-primary/40 bg-surface px-4 py-3">
                  <Text className="text-sm font-semibold text-foreground">
                    {achById[aid]?.title ?? aid}
                  </Text>
                  <Text className="mt-0.5 text-xs text-muted-foreground">
                    {achById[aid]?.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
      <Text className="mt-8 text-xs text-muted-foreground">Tap to continue</Text>
    </Pressable>
  );
};
