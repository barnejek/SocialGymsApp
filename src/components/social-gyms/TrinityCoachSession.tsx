import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Mic, MicOff, PhoneOff, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { EmotionPanel } from './EmotionPanel';
import type { SessionResult } from './Results';
import { useFaceCapture } from '../../hooks/useFaceCapture';
import { useGeminiLive } from '../../hooks/useGeminiLive';
import { useDemoSession } from '../../hooks/useDemoSession';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { NEUTRAL_METRICS, type EmotionMetrics } from '../../lib/emotion';
import { DEMO_MODE } from '../../lib/utils';
import { DEMO_EMOTION_TIMELINE, DEMO_SCORE_RESULT, DEMO_GOLDEN_RULE } from '../../lib/mockBackend';
import { trinityPrompt } from '../../lib/trinity';
import { useAuth } from '../../components/AuthProvider';
import { injectAutismGuardrails } from '../../lib/autism-guardrails';
import {
  PHASE_LABEL,
  PHASE_HINT,
  PHASE_ORDER,
  PHASE_SHORT_LABEL,
  TRINITY_PHASES,
  isTimedPhase,
  phaseDurationSec,
  type TrinityPhase,
  type LessonLength,
} from '../../lib/phases';
import type { Topic } from '../../lib/topics';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? 'dummy-key-for-now';

interface Props {
  topic: Topic;
  lessonLength: LessonLength;
  active: boolean;
  cameraGranted: boolean;
  onComplete: (r: SessionResult) => void;
}

// How each speaker is labelled and tinted in the transcript.
// Coach side (left, voice A): coach / partner / self -> never orange.
// User side (right, voice B): you -> always orange.
const SPEAKER_META: Record<string, { name: string; color: string }> = {
  coach: { name: 'Coach', color: '#cbd5e1' },
  partner: { name: 'Jordan', color: '#3B9EF5' },
  self: { name: 'Coach · as Alex', color: '#cbd5e1' },
  you: { name: 'You', color: '#F5A340' },
};

export const TrinityCoachSession = ({ topic, lessonLength, active, cameraGranted, onComplete }: Props) => {
  const { user } = useAuth();

  const geminiLive = useGeminiLive(GEMINI_API_KEY);
  const demoSession = useDemoSession();
  const gemini = DEMO_MODE ? demoSession : geminiLive;

  const [phase, setPhase] = useState<TrinityPhase>('phase-1-setup');
  const [faceMetrics, setFaceMetrics] = useState<EmotionMetrics | null>(null);

  const cameraRef = useRef<any>(null);
  const bridgeRef = useRef<any>(null);
  const scrollRef = useRef<ScrollView>(null);

  const fused = faceMetrics ?? NEUTRAL_METRICS;

  useFaceCapture({
    cameraRef,
    bridgeRef,
    gated: true,
    enabled: active && !DEMO_MODE,
    intervalMs: 3000,
    onMetrics: setFaceMetrics,
  });

  // Demo: the progress bar / phase label follow the SCRIPT, not a wall clock.
  useEffect(() => {
    if (DEMO_MODE) setPhase(demoSession.currentPhase);
  }, [demoSession.currentPhase]);

  // Demo: animate emotion gauges from the scripted keyframe timeline.
  useEffect(() => {
    if (!DEMO_MODE || !active) return;
    const startMs = Date.now();
    const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
    const kf = DEMO_EMOTION_TIMELINE;
    const id = setInterval(() => {
      const elapsed = Date.now() - startMs;
      let lo = kf[0];
      let hi = kf[kf.length - 1];
      for (let i = 0; i < kf.length - 1; i++) {
        if (elapsed >= kf[i].timeMs && elapsed <= kf[i + 1].timeMs) {
          lo = kf[i];
          hi = kf[i + 1];
          break;
        }
      }
      const span = hi.timeMs - lo.timeMs;
      const t = span > 0 ? Math.min(1, (elapsed - lo.timeMs) / span) : 1;
      setFaceMetrics({
        engagement: lerp(lo.engagement, hi.engagement, t),
        confidence: lerp(lo.confidence, hi.confidence, t),
        anxiety: lerp(lo.anxiety, hi.anxiety, t),
        smiling: lerp(lo.smiling, hi.smiling, t),
      });
    }, 200);
    return () => clearInterval(id);
  }, [active]);

  // Live mode only: timed phases advance on the clock. In demo the script drives it.
  const timed = !DEMO_MODE && isTimedPhase(phase);
  const timerDuration = phaseDurationSec(phase, lessonLength);

  const handleTimerEnd = useCallback(() => {
    if (phase === 'phase-2-convo-1') setPhase('phase-3-feedback-1');
    else if (phase === 'phase-4-reversal') setPhase('phase-5-convo-2');
    else if (phase === 'phase-5-convo-2') setPhase('phase-6-final');
  }, [phase]);

  const timer = useSessionTimer(timerDuration, timed, handleTimerEnd);

  useEffect(() => {
    if (active && user) {
      const basePrompt = trinityPrompt('phase-1-setup', {
        topic,
        scenarioFromCoach: '',
        emotion: { confidence: 0, anxiety: 0, engagement: 0, smiling: 0 },
      });
      const finalPrompt = injectAutismGuardrails(basePrompt, user);
      gemini.connect(finalPrompt);
    } else {
      gemini.disconnect();
    }
  }, [active]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const buildResult = (): SessionResult => ({
    topicLabel: topic.label,
    scoring: DEMO_SCORE_RESULT,
    goldenRule: DEMO_GOLDEN_RULE,
  });

  const onEndEarly = () => {
    gemini.disconnect();
    onComplete(buildResult());
  };

  if (!active) return null;

  const curOrder = PHASE_ORDER[phase];
  const isComplete = DEMO_MODE && demoSession.isComplete;
  const isPlaying = (gemini as any).isPlaying as boolean;
  // The avatar represents the coach (voice A), so the ring pulses for every
  // coach line -- coach, coach-as-Jordan ("partner") and coach-as-Alex
  // ("self") -- and stays still only while the user ("you") has the floor.
  const currentSpeaker = (gemini as any).currentSpeaker as string | null | undefined;
  const coachSpeaking = isPlaying && currentSpeaker !== 'you';

  return (
    <View className="flex-1 bg-background pt-3 px-4">
      {/* Progress bar (pinned) */}
      <View className="flex-row items-start mb-3">
        {TRINITY_PHASES.map((p) => {
          const isPast = PHASE_ORDER[p] < curOrder;
          const isActive = PHASE_ORDER[p] === curOrder;
          return (
            <View key={p} className="flex-1 mx-0.5">
              <View className={`h-1.5 w-full rounded-full mb-1 ${
                isPast ? 'bg-primary' : isActive ? 'bg-primary/60' : 'bg-muted'
              }`} />
              <Text
                numberOfLines={1}
                className={`text-[9px] font-medium text-center ${
                  isActive ? 'text-primary' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/30'
                }`}
              >
                {PHASE_SHORT_LABEL[p]}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Coach avatar header (pinned) */}
      <View className="flex-row items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 mb-3">
        <View className="flex-row items-center flex-1">
          <View className="mr-3">
            <SpeakingRing active={coachSpeaking}>
              <Image
                source={require('../../../assets/images/alex-avatar.jpg')}
                style={{ width: 40, height: 40, borderRadius: 20 }}
                contentFit="cover"
              />
            </SpeakingRing>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">Trinity Coach</Text>
            <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>{PHASE_LABEL[phase]}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {timed && (
            <View className="rounded-full border border-border bg-muted px-3 py-1">
              <Text className="text-sm font-semibold text-foreground">{timer.formatted}</Text>
            </View>
          )}
          <TouchableOpacity
            accessibilityLabel={gemini.isMuted ? 'Unmute' : 'Mute'}
            onPress={() => (gemini.isMuted ? gemini.unmute() : gemini.mute())}
            className={`h-9 w-9 items-center justify-center rounded-full border ${
              gemini.isMuted ? 'border-destructive/60 bg-destructive/10' : 'border-engagement/60 bg-engagement/10'
            }`}
          >
            {gemini.isMuted ? <MicOff size={16} color="#ef4444" /> : <Mic size={16} color="#22c55e" />}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="End session"
            onPress={onEndEarly}
            className="flex-row items-center rounded-full border border-border px-3 py-1.5"
          >
            <PhoneOff size={12} color="#a1a1aa" />
            <Text className="text-xs text-muted-foreground ml-1">End</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isComplete ? (
        /* Session finished: drop the transcript + camera entirely and show a
           clean, full-height completion state with the results CTA. */
        <View className="flex-1 items-center justify-center px-6 pb-6">
          <View className="h-20 w-20 rounded-full items-center justify-center bg-engagement/15 mb-6">
            <CheckCircle2 size={44} color="#22c55e" />
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">Session complete</Text>
          <Text className="text-sm text-muted-foreground text-center mt-2 mb-8 max-w-[300px] leading-relaxed">
            Nice work — you ran the full six-phase circuit. Here's how you did.
          </Text>
          <TouchableOpacity
            accessibilityLabel="See results"
            onPress={() => onComplete(buildResult())}
            className="flex-row items-center justify-center bg-primary rounded-full py-4 w-full"
          >
            <Text className="text-primary-foreground font-bold text-base mr-2">See your results</Text>
            <ArrowRight size={18} color="#0e1424" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Conversation */}
          <View
            className="rounded-2xl border border-border bg-surface overflow-hidden mb-3"
            style={{ flex: 1, flexShrink: 1, minHeight: 0 }}
          >
            <ScrollView ref={scrollRef} className="flex-1 px-4 py-4" onContentSizeChange={scrollToEnd}>
              {gemini.messages.map((m, i) => {
                const speaker = (m as any).speaker ?? (m.type === 'user_message' ? 'you' : 'coach');
                // ONE rule, no exceptions: whoever is TALKING decides the side.
                // The coach talking (coach / partner / self) is always on the LEFT.
                // The user talking ("you") is always on the RIGHT in orange --
                // whichever character they happen to be voicing that phase.
                const isMine = speaker === 'you';
                const meta = SPEAKER_META[speaker] ?? SPEAKER_META.coach;
                const label = (m as any).name ?? meta.name;
                return (
                  <View key={i} className={`mb-3 ${isMine ? 'items-end' : 'items-start'}`}>
                    <Text className="text-[10px] font-semibold mb-1 px-1" style={{ color: meta.color }}>{label}</Text>
                    <View className={`rounded-2xl px-4 py-2.5 max-w-[85%] ${
                      isMine ? 'bg-primary rounded-br-sm' : 'bg-surface-2 rounded-bl-sm'
                    }`}>
                      <Text className={`text-sm ${isMine ? 'text-primary-foreground' : 'text-foreground'}`}>
                        {m.message.content || '...'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <View className="border-t border-border bg-surface-2 px-4 py-2.5">
              <Text className="text-[11px] text-muted-foreground" numberOfLines={2}>{PHASE_HINT[phase]}</Text>
            </View>
          </View>

          {/* Camera + live metrics — pinned footer above tab bar */}
          <View className="mb-2" style={{ zIndex: 10, elevation: 10 }}>
            <EmotionPanel
              active={active}
              cameraGranted={cameraGranted}
              metrics={fused}
              evi={gemini.status.value}
            />
          </View>
        </>
      )}
    </View>
  );
};

/** Pulsing ring around the coach avatar while the coach is speaking. */
const SpeakingRing = ({ active, children }: { active: boolean; children: React.ReactNode }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View className="items-center justify-center">
      {active && (
        <Animated.View
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#F5A340',
            transform: [{ scale }],
            opacity,
          }}
        />
      )}
      {children}
    </View>
  );
};
