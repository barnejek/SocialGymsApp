import React, { useEffect, useRef, useState, type RefObject } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CameraView } from 'expo-camera';
import { FaceTrackerBridge, type FaceTrackerBridgeHandle } from '../FaceTrackerBridge';
import { useAuth } from '../../components/AuthProvider';
import type { EmotionMetrics } from '../../lib/emotion';
import { isTimedPhase, type TrinityPhase } from '../../lib/phases';
import { COLORS } from '../../constants/colors';

interface EmotionPanelProps {
  active: boolean;
  /** Lifted from train.tsx so permission state is single-sourced. */
  cameraGranted: boolean;
  metrics: EmotionMetrics;
  evi: string;
  /**
   * Current session phase. Mirrors the web panel: during the rehearsal rounds
   * (convo-1, reversal, convo-2) the numeric readout is force-hidden — watching
   * your own anxiety score while performing increases self-focused attention
   * (Clark & Wells). Analysis keeps running either way.
   */
  phase?: TrinityPhase;
  cameraRef: RefObject<CameraView | null>;
  bridgeRef: RefObject<FaceTrackerBridgeHandle | null>;
  onMetrics: (metrics: EmotionMetrics) => void;
  onCameraReady: () => void;
}

const METRIC_COLORS = {
  engagement: COLORS.engagement,
  confidence: COLORS.comfort,
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
  phase,
  cameraRef,
  bridgeRef,
  onMetrics,
  onCameraReady,
}: EmotionPanelProps) => {
  const { user } = useAuth();
  const [faceError, setFaceError] = useState(false);

  const showCamera = active && cameraGranted;

  // Child (autism) persona NEVER sees numeric metrics — percentages and
  // "Anxiety: 62%" are clinically inappropriate for the child view; the
  // quantitative data belongs in the carer portal after the session.
  const isChild = user?.persona === 'b2b_autism_user';
  // Rehearsal rounds force-hide the numbers for everyone (parity with web).
  const rehearsing = phase != null && isTimedPhase(phase);
  const showNumbers = !isChild && !rehearsing;

  // Same four rows and definitions as the web panel — "Openness" was showing
  // `confidence` here while scoring uses `smiling` as openness; label honestly.
  const rows: { label: string; key: MetricKey; value: number }[] = [
    { label: 'Confidence', key: 'confidence', value: metrics.confidence },
    { label: 'Engagement', key: 'engagement', value: metrics.engagement },
    { label: 'Smiling', key: 'smiling', value: metrics.smiling },
    { label: 'Anxiety', key: 'anxiety', value: metrics.anxiety },
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
              animateShutter={false}
              mute
              onCameraReady={onCameraReady}
            />
            <FaceTrackerBridge
              ref={bridgeRef}
              enabled={active}
              onMetrics={onMetrics}
              onError={() => setFaceError(true)}
            />
            <View className="absolute top-2 left-2">
              <LivePulse active={active} />
            </View>
            {faceError && (
              <View className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                <Text className="text-[9px] text-center" style={{ color: COLORS.mutedForeground }}>
                  Face tracking unavailable
                </Text>
              </View>
            )}
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground text-xs">Camera inactive</Text>
          </View>
        )}
      </View>

      <View className="flex-1 bg-surface-2 rounded-2xl border border-border px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-semibold text-foreground">
            {isChild ? 'Your coach is with you' : 'Real-time presence'}
          </Text>
          <LivePulse active={active} />
        </View>
        {showNumbers ? (
          rows.map(r => (
            <AnimatedMetric key={r.key} label={r.label} value={r.value} color={METRIC_COLORS[r.key]} />
          ))
        ) : (
          <Text className="text-xs leading-relaxed text-muted-foreground">
            {isChild
              ? 'Alex is listening and playing along with you. You’re doing great — just keep talking!'
              : 'You’re mid-rep — your coach keeps reading silently, like a coach watching your form. The full breakdown comes after the round.'}
          </Text>
        )}
        {isChild && (
          <Text className="text-[9px] text-muted-foreground mt-2">Eye contact not tracked in this mode</Text>
        )}
      </View>
    </View>
  );
};
