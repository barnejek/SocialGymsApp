import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FaceTrackerBridge } from '../FaceTrackerBridge';
import { useAuth } from '../../components/AuthProvider';
import type { EmotionMetrics } from '../../lib/emotion';
import { DEMO_MODE } from '../../lib/utils';

interface EmotionPanelProps {
  active: boolean;
  metrics: EmotionMetrics;
  evi: string;
}

// Raw colours (RN style props can't read the CSS tokens). Mirror the
// engagement / comfort / openness tokens in global.css and add two more.
const METRIC_COLORS = {
  engagement: '#34C759',
  comfort: '#F5A340',
  openness: '#3B9EF5',
  anxiety: '#F87171',
  smiling: '#FBBF24',
} as const;

type MetricKey = keyof typeof METRIC_COLORS;

const AnimatedMetric = ({
  label, value, color,
}: {
  label: string; value: number; color: string;
}) => {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const width = useRef(new Animated.Value(v)).current;

  useEffect(() => {
    Animated.timing(width, { toValue: v, duration: 350, useNativeDriver: false }).start();
  }, [v, width]);

  const animatedWidth = width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View className="mb-2.5">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Text>
        <Text className="text-xs font-semibold tabular-nums" style={{ color }}>{v}%</Text>
      </View>
      <View className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
        <Animated.View style={{ height: '100%', width: animatedWidth, backgroundColor: color, borderRadius: 999 }} />
      </View>
    </View>
  );
};

const LivePulse = ({ active }: { active: boolean }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  return (
    <View className="flex-row items-center">
      <Animated.View style={{ opacity }} className="h-1.5 w-1.5 rounded-full bg-engagement mr-1.5" />
      <Text className="text-[9px] uppercase tracking-widest text-engagement">Live</Text>
    </View>
  );
};

export const EmotionPanel = ({ active, metrics }: EmotionPanelProps) => {
  const { user } = useAuth();
  // Permission is resolved on the pre-session screen (see train.tsx). We only
  // read it here — never prompt mid-session, so a recorded take never shows a
  // tap-to-enable gate. If it's somehow not granted, fall back to the inert
  // "Camera inactive" placeholder below.
  const [permission] = useCameraPermissions();

  const runFaceBridge = !DEMO_MODE;

  // Only show the live feed when the session is active AND permission is granted.
  const showCamera = active && !!permission?.granted;

  const rows: { label: string; key: MetricKey; value: number }[] = [
    { label: 'Engagement', key: 'engagement', value: metrics.engagement },
    { label: 'Comfort', key: 'comfort', value: 100 - metrics.anxiety },
    { label: 'Openness', key: 'openness', value: metrics.confidence },
    { label: 'Anxiety', key: 'anxiety', value: metrics.anxiety },
    { label: 'Smiling', key: 'smiling', value: metrics.smiling },
  ];

  return (
    <View className="flex-row gap-3">
      {/* Square, mirrored camera self-view on the left */}
      <View className="w-36 aspect-square rounded-2xl overflow-hidden border border-border bg-black relative">
        {showCamera ? (
          <>
            <CameraView style={[StyleSheet.absoluteFill, { transform: [{ scaleX: -1 }] }]} facing="front" />
            {runFaceBridge && <FaceTrackerBridge enabled={active} onMetrics={(_m: any) => {}} />}
            <View className="absolute top-2 left-2">
              <LivePulse active={active} />
            </View>
            {DEMO_MODE && (
              <View className="absolute bottom-2 left-2 right-2 rounded-md bg-black/55 px-2 py-1">
                <Text className="text-white text-[8px] uppercase tracking-widest text-center">Simulated metrics</Text>
              </View>
            )}
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground text-xs">Camera inactive</Text>
          </View>
        )}
      </View>

      {/* Animated scores beside it */}
      <View className="flex-1 bg-surface-2 rounded-2xl border border-border px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-semibold text-foreground">Real-time presence</Text>
          <LivePulse active={active} />
        </View>
        {rows.map(r => (
          <AnimatedMetric key={r.key} label={r.label} value={r.value} color={METRIC_COLORS[r.key]} />
        ))}
        {user?.persona === 'b2b_autism_user' && (
          <Text className="text-[9px] text-muted-foreground mt-1">Eye contact not tracked in this mode</Text>
        )}
      </View>
    </View>
  );
};
