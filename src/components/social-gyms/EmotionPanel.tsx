import React, { useEffect, useRef, type RefObject } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CameraView } from 'expo-camera';
import { FaceTrackerBridge, type FaceTrackerBridgeHandle } from '../FaceTrackerBridge';
import { useAuth } from '../../components/AuthProvider';
import type { EmotionMetrics } from '../../lib/emotion';
import { DEMO_MODE } from '../../lib/utils';
import { COLORS } from '../../constants/colors';

interface EmotionPanelProps {
  active: boolean;
  /** Lifted from train.tsx so permission state is single-sourced. */
  cameraGranted: boolean;
  metrics: EmotionMetrics;
  evi: string;
  cameraRef: RefObject<CameraView | null>;
  bridgeRef: RefObject<FaceTrackerBridgeHandle | null>;
  onMetrics: (metrics: EmotionMetrics) => void;
  onCameraReady: () => void;
}

const METRIC_COLORS = {
  engagement: COLORS.engagement,
  comfort: COLORS.comfort,
  openness: COLORS.openness,
  anxiety: COLORS.destructive,
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

export const EmotionPanel = ({
  active,
  cameraGranted,
  metrics,
  evi: _evi,
  cameraRef,
  bridgeRef,
  onMetrics,
  onCameraReady,
}: EmotionPanelProps) => {
  const { user } = useAuth();

  const showCamera = active && cameraGranted;

  const rows: { label: string; key: MetricKey; value: number }[] = [
    { label: 'Engagement', key: 'engagement', value: metrics.engagement },
    { label: 'Comfort', key: 'comfort', value: 100 - metrics.anxiety },
    { label: 'Openness', key: 'openness', value: metrics.confidence },
    { label: 'Anxiety', key: 'anxiety', value: metrics.anxiety },
    { label: 'Smiling', key: 'smiling', value: metrics.smiling },
  ];

  return (
    <View className="flex-row gap-3">
      <View className="w-36 aspect-square rounded-2xl overflow-hidden border border-border bg-black relative">
        {showCamera ? (
          <>
            <CameraView
              ref={cameraRef}
              style={[StyleSheet.absoluteFill, { transform: [{ scaleX: -1 }] }]}
              facing="front"
              onCameraReady={onCameraReady}
            />
            <FaceTrackerBridge ref={bridgeRef} enabled={active} onMetrics={onMetrics} />
            <View className="absolute top-2 left-2">
              <LivePulse active={active} />
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground text-xs">
              {DEMO_MODE ? 'Demo mode' : 'Camera inactive'}
            </Text>
            {DEMO_MODE && (
              <View className="mt-2">
                <LivePulse active={active} />
              </View>
            )}
          </View>
        )}
      </View>

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
