import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Quote } from 'lucide-react-native';
import type { ChatMessage, ScoreResult } from '../../lib/chat';
import type { Topic } from '../../lib/topics';

export interface SessionResult {
  topicLabel: string;
  topic: Topic;
  /** The concrete scenario the coach invented in Phase 1. */
  scenario: string;
  attempt1: ChatMessage[];
  attempt2: ChatMessage[];
  scoring: ScoreResult;
  /** Live multimodal read (0-100) captured during the session. */
  presence: { engagement: number; comfort: number; openness: number };
  goldenRule: string;
}

interface Props {
  result: SessionResult;
  onTryAnother: () => void;
}

const DIM_COLORS = {
  engagement: '#34C759',
  comfort: '#F5A340',
  openness: '#3B9EF5',
} as const;

const band = (score: number) => {
  if (score <= 35) return "You're warming up. The real reps start now.";
  if (score <= 60) return "You showed up — that's the hardest part. Now we sharpen it.";
  if (score <= 80) return "Solid session. You're building real social fitness.";
  return 'Strong presence. You closed with real confidence.';
};

/** Count a number up from ~20% to its final value over `duration` ms. */
function useCountUp(value: number, duration = 900) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - start) / duration);
      setShown(Math.round(value * (0.2 + 0.8 * k)));
      if (k >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [value, duration]);
  return shown;
}

const Delta = ({ from, to }: { from: number; to: number }) => {
  const d = to - from;
  const Icon = d > 2 ? TrendingUp : d < -2 ? TrendingDown : Minus;
  const color = d > 2 ? '#34C759' : d < -2 ? '#F87171' : '#94a3b8';
  const sign = d > 0 ? '+' : '';
  return (
    <View className="flex-row items-center">
      <Icon size={13} color={color} />
      <Text className="text-xs ml-0.5 tabular-nums" style={{ color }}>{sign}{d}</Text>
    </View>
  );
};

/** A bar that animates its width up on mount. */
const GrowBar = ({ value, color, faded = false }: { value: number; color: string; faded?: boolean }) => {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: value, duration: 900, useNativeDriver: false }).start();
  }, [value, w]);
  const width = w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View className="h-3 w-full bg-muted rounded-full overflow-hidden">
      <Animated.View style={{ height: '100%', width, backgroundColor: color, opacity: faded ? 0.4 : 1, borderRadius: 999 }} />
    </View>
  );
};

const DimensionCompare = ({
  label, color, before, after,
}: {
  label: string; color: string; before: number; after: number;
}) => {
  const a1 = useCountUp(before);
  const a2 = useCountUp(after);
  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        <Delta from={before} to={after} />
      </View>

      <View className="flex-row items-center mb-1.5">
        <Text className="text-[10px] uppercase text-muted-foreground w-16">Attempt 1</Text>
        <View className="flex-1 mx-2"><GrowBar value={before} color={color} faded /></View>
        <Text className="text-xs tabular-nums text-muted-foreground w-8 text-right">{a1}</Text>
      </View>
      <View className="flex-row items-center">
        <Text className="text-[10px] uppercase text-muted-foreground w-16">Attempt 2</Text>
        <View className="flex-1 mx-2"><GrowBar value={after} color={color} /></View>
        <Text className="text-xs font-semibold tabular-nums w-8 text-right" style={{ color }}>{a2}</Text>
      </View>
    </View>
  );
};

const InsightCard = ({ label, body, accent }: { label: string; body: string; accent: string }) => (
  <View className="rounded-2xl border bg-surface-2 p-4 mb-3" style={{ borderColor: accent + '55' }}>
    <Text className="text-[10px] uppercase tracking-wider mb-2" style={{ color: accent }}>{label}</Text>
    <Text className="text-sm leading-relaxed text-foreground/95">{body}</Text>
  </View>
);

export const Results = ({ result, onTryAnother }: Props) => {
  const s = result.scoring;
  const overall1 = Math.round((s.attempt1.engagement + s.attempt1.comfort + s.attempt1.openness) / 3);
  const overall2 = Math.round((s.attempt2.engagement + s.attempt2.comfort + s.attempt2.openness) / 3);
  const finalScore = useCountUp(overall2, 1100);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <View className="items-center mb-6">
        <Text className="text-[11px] uppercase tracking-[3px] text-primary">Debrief</Text>
        <Text className="text-3xl font-bold text-foreground mt-2">Session complete</Text>
        <Text className="text-muted-foreground mt-1">{result.topicLabel}</Text>
      </View>

      {/* Final score */}
      <View className="rounded-3xl border border-border bg-surface p-7 items-center mb-5">
        <Text className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Social fitness score</Text>
        <Text className="text-6xl font-bold text-primary tabular-nums">{finalScore}</Text>
        <Text className="text-xs text-muted-foreground">out of 100</Text>
        <View className="flex-row items-center gap-2 mt-3">
          <Text className="text-xs text-muted-foreground">Attempt 1 → 2</Text>
          <Delta from={overall1} to={overall2} />
        </View>
        <Text className="text-sm text-foreground/90 text-center mt-3 max-w-[18rem]">{band(overall2)}</Text>
      </View>

      {/* Per-dimension before/after */}
      <View className="rounded-3xl border border-border bg-surface p-5 mb-5">
        <Text className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">Where you grew</Text>
        <DimensionCompare label="Engagement" color={DIM_COLORS.engagement} before={s.attempt1.engagement} after={s.attempt2.engagement} />
        <DimensionCompare label="Comfort" color={DIM_COLORS.comfort} before={s.attempt1.comfort} after={s.attempt2.comfort} />
        <DimensionCompare label="Openness" color={DIM_COLORS.openness} before={s.attempt1.openness} after={s.attempt2.openness} />
      </View>

      {/* Golden Rule */}
      <View className="rounded-3xl border border-primary/40 bg-primary/10 p-5 mb-5">
        <View className="flex-row items-center mb-2">
          <Quote size={14} color="#F5A340" />
          <Text className="text-[10px] uppercase tracking-wider text-primary ml-1.5">Your golden rule</Text>
        </View>
        <Text className="text-base leading-relaxed text-foreground font-medium">{result.goldenRule}</Text>
      </View>

      {/* Coach insights */}
      <InsightCard label="Coach's read" body={s.coachRead} accent="#94a3b8" />
      <InsightCard label="What changed" body={s.improvement} accent="#3B9EF5" />
      <InsightCard label="What you did well" body={s.didWell} accent="#34C759" />
      <InsightCard label="Try this next time" body={s.tryNext} accent="#F5A340" />

      <TouchableOpacity
        onPress={onTryAnother}
        className="flex-row items-center justify-center bg-primary rounded-full px-6 py-3.5 mt-3"
        accessibilityLabel="Try another topic"
      >
        <RefreshCw size={16} color="#0e1424" />
        <Text className="text-primary-foreground font-bold ml-2">Try another scenario</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
