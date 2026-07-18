import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Mic, MicOff, PhoneOff, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import type { CameraView } from 'expo-camera';
import { EmotionPanel } from './EmotionPanel';
import type { SessionResult } from './Results';
import type { FaceTrackerBridgeHandle } from '../FaceTrackerBridge';
import { useFaceCapture } from '../../hooks/useFaceCapture';
import { useGeminiLive } from '../../hooks/useGeminiLive';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { NEUTRAL_METRICS, type EmotionMetrics } from '../../lib/emotion';
import { scoreConversation, type ChatMessage, type ScoreResult } from '../../lib/chat';
import { trinityPrompt, type PhaseContext } from '../../lib/trinity';
import { useAuth } from '../../components/AuthProvider';
import { injectAutismGuardrails } from '../../lib/autism-guardrails';
import {
  FINAL_DEBRIEF_CAP_MS,
  KICKOFF_FEEDBACK,
  KICKOFF_FINAL,
  KICKOFF_REVERSAL,
  KICKOFF_WRAP_EARLY,
  advanceOnCap,
  advanceOnTimerEnd,
  advanceOnTranscript,
  detectGoldenRule,
  extractGoldenRule,
  untimedPhaseCapMs,
} from '../../lib/phaseMachine';
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

const FALLBACK_SCORE: ScoreResult = {
  attempt1: { engagement: 0, comfort: 0, openness: 0 },
  attempt2: { engagement: 0, comfort: 0, openness: 0 },
  coachRead: "We couldn't score this session automatically. Your practice still counts — try again when you're back online.",
  didWell: 'You showed up and ran the full circuit.',
  tryNext: 'Run another session when scoring is available so you can see the before/after lift.',
  improvement: 'Scoring was unavailable for this session.',
};

interface Props {
  topic: Topic;
  lessonLength: LessonLength;
  active: boolean;
  cameraGranted: boolean;
  onComplete: (r: SessionResult) => void;
}

const SPEAKER_META: Record<string, { name: string; color: string }> = {
  coach: { name: 'Coach', color: '#cbd5e1' },
  partner: { name: 'Jordan', color: '#3B9EF5' },
  self: { name: 'Coach · as Alex', color: '#cbd5e1' },
  you: { name: 'You', color: '#F5A340' },
};

export const TrinityCoachSession = ({ topic, lessonLength, active, cameraGranted, onComplete }: Props) => {
  const { user } = useAuth();
  const gemini = useGeminiLive(GEMINI_API_KEY);

  const [phase, setPhase] = useState<TrinityPhase>('phase-1-setup');
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const [faceMetrics, setFaceMetrics] = useState<EmotionMetrics | null>(null);
  const fused = faceMetrics ?? NEUTRAL_METRICS;
  const fusedRef = useRef(fused);
  useEffect(() => { fusedRef.current = fused; }, [fused]);

  const [cameraReady, setCameraReady] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [pendingResult, setPendingResult] = useState<SessionResult | null>(null);

  const cameraRef = useRef<CameraView | null>(null);
  const bridgeRef = useRef<FaceTrackerBridgeHandle | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const scenarioRef = useRef('');
  const attempt1Ref = useRef<ChatMessage[]>([]);
  const attempt2Ref = useRef<ChatMessage[]>([]);
  const pendingAdvanceRef = useRef<{ next: TrinityPhase; kickoff?: string } | null>(null);
  const advanceGuardRef = useRef<Partial<Record<TrinityPhase, boolean>>>({});

  const topicRef = useRef(topic);
  useEffect(() => { topicRef.current = topic; }, [topic]);
  const faceMetricsRef = useRef(faceMetrics);
  useEffect(() => { faceMetricsRef.current = faceMetrics; }, [faceMetrics]);

  useFaceCapture({
    cameraRef,
    bridgeRef,
    gated: true,
    enabled: active,
    cameraReady,
    intervalMs: 3000,
    onMetrics: setFaceMetrics,
  });

  const buildCtx = useCallback((): PhaseContext => {
    const f = fusedRef.current;
    return {
      topic: topicRef.current,
      scenarioFromCoach: scenarioRef.current,
      emotion: {
        confidence: f.confidence,
        anxiety: f.anxiety,
        engagement: f.engagement,
        smiling: f.smiling,
        faceTop: faceMetricsRef.current?.primaryEmotion,
        voiceTop: undefined,
      },
    };
  }, []);

  const withGuardrails = useCallback(
    (prompt: string) => (user ? injectAutismGuardrails(prompt, user) : prompt),
    [user],
  );

  const geminiRef = useRef(gemini);
  useEffect(() => { geminiRef.current = gemini; }, [gemini]);

  const advanceTo = useCallback(
    async (next: TrinityPhase, kickoffText?: string) => {
      setPhase(next);
      if (next === 'scoring') return;

      const systemPrompt = withGuardrails(trinityPrompt(next, buildCtx()));
      await geminiRef.current.updateSystemPrompt(systemPrompt);

      const t1 = () =>
        attempt1Ref.current.map((m) => `${m.role === 'user' ? 'Me' : 'Coach'}: ${m.content}`).join('\n');
      const t2 = () =>
        attempt2Ref.current.map((m) => `${m.role === 'user' ? 'Me' : 'Coach'}: ${m.content}`).join('\n');

      if (next === 'phase-3-feedback-1') {
        geminiRef.current.sendText(
          `My first attempt transcript:\n${t1() || '(no transcript)'}\n\n${kickoffText ?? KICKOFF_FEEDBACK}`,
        );
      } else if (next === 'phase-4-reversal') {
        geminiRef.current.sendText(
          `For reference, here's how my first attempt went:\n${t1() || '(no transcript)'}\n\n${kickoffText ?? KICKOFF_REVERSAL}`,
        );
      } else if (next === 'phase-6-final') {
        geminiRef.current.sendText(
          `First attempt:\n${t1() || '(no transcript)'}\n\nSecond attempt:\n${t2() || '(no transcript)'}\n\n${kickoffText ?? KICKOFF_FINAL}`,
        );
      } else if (kickoffText) {
        setTimeout(() => geminiRef.current.sendText(kickoffText), 300);
      }
    },
    [buildCtx, withGuardrails],
  );

  const advanceToRef = useRef(advanceTo);
  useEffect(() => { advanceToRef.current = advanceTo; }, [advanceTo]);

  const queueOrAdvance = useCallback(
    (next: TrinityPhase, kickoff?: string) => {
      if (geminiRef.current.isPlaying) pendingAdvanceRef.current = { next, kickoff };
      else void advanceTo(next, kickoff);
    },
    [advanceTo],
  );

  useEffect(() => {
    if (gemini.isPlaying || !pendingAdvanceRef.current) return;
    const { next, kickoff } = pendingAdvanceRef.current;
    pendingAdvanceRef.current = null;
    void advanceTo(next, kickoff);
  }, [gemini.isPlaying, advanceTo]);

  const timed = isTimedPhase(phase);
  const timerDuration = phaseDurationSec(phase, lessonLength);

  const handleTimerEnd = useCallback(() => {
    const a = advanceOnTimerEnd(phaseRef.current);
    if (a) queueOrAdvance(a.next, a.kickoff);
  }, [queueOrAdvance]);

  const timer = useSessionTimer(timerDuration, timed, handleTimerEnd);

  const startedRef = useRef(false);
  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        await geminiRef.current.connect(
          withGuardrails(trinityPrompt('phase-1-setup', buildCtx())),
        );
        setTimeout(() => geminiRef.current.sendText('Begin the setup now.'), 400);
      } catch (e) {
        console.error('Gemini Live connect failed', e);
      }
    })();

    return () => {
      geminiRef.current.disconnect();
    };
  }, [active, buildCtx, withGuardrails]);

  const finalizeRanRef = useRef(false);
  const goldenRuleRef = useRef<string | null>(null);
  const earlyScoreRef = useRef<ScoreResult | null>(null);
  const earlyScoreStartedRef = useRef(false);

  useEffect(() => {
    if (phase !== 'phase-6-final') return;
    if (earlyScoreStartedRef.current) return;
    earlyScoreStartedRef.current = true;

    void scoreConversation({
      topicLabel: topicRef.current.label,
      northStar: topicRef.current.northStar,
      scenario: scenarioRef.current,
      attempt1: attempt1Ref.current,
      attempt2: attempt2Ref.current,
      presence: {
        engagement: fusedRef.current.engagement,
        comfort: 100 - fusedRef.current.anxiety,
        openness: fusedRef.current.smiling,
      },
    }).then((result) => {
      earlyScoreRef.current = result;
    }).catch(() => {});
  }, [phase]);

  const finalize = useCallback(async () => {
    if (finalizeRanRef.current) return;
    finalizeRanRef.current = true;
    setPhase('scoring');

    let scoring: ScoreResult | null = earlyScoreRef.current;
    if (!scoring) {
      try {
        scoring = await scoreConversation({
          topicLabel: topicRef.current.label,
          northStar: topicRef.current.northStar,
          scenario: scenarioRef.current,
          attempt1: attempt1Ref.current,
          attempt2: attempt2Ref.current,
          presence: {
            engagement: fusedRef.current.engagement,
            comfort: 100 - fusedRef.current.anxiety,
            openness: fusedRef.current.smiling,
          },
        });
      } catch {
        // toast handled inside helper
      }
    }

    geminiRef.current.disconnect();

    const result: SessionResult = {
      topicLabel: topicRef.current.label,
      scoring: scoring ?? FALLBACK_SCORE,
      goldenRule:
        goldenRuleRef.current ??
        'Practice one deliberate social rep this week — same scene, one clearer move.',
    };
    setPendingResult(result);
    setSessionComplete(true);
  }, []);

  const lastSeenRef = useRef(0);
  useEffect(() => {
    const msgs = gemini.messages;
    for (let i = lastSeenRef.current; i < msgs.length; i++) {
      const m = msgs[i];

      if (m.type === 'user_message') {
        const text = m.message.content;
        if (!text) continue;
        const cur = phaseRef.current;
        if (cur === 'phase-2-convo-1') attempt1Ref.current.push({ role: 'user', content: text });
        else if (cur === 'phase-5-convo-2') attempt2Ref.current.push({ role: 'user', content: text });
      } else if (m.type === 'assistant_message') {
        const text = m.message.content;
        if (!text) continue;
        const cur = phaseRef.current;
        if (cur === 'phase-2-convo-1') attempt1Ref.current.push({ role: 'assistant', content: text });
        else if (cur === 'phase-5-convo-2') attempt2Ref.current.push({ role: 'assistant', content: text });

        if (cur === 'phase-1-setup') {
          scenarioRef.current = text;
        }

        const adv = advanceOnTranscript(cur, text);
        if (adv && !advanceGuardRef.current[cur]) {
          advanceGuardRef.current[cur] = true;
          if (geminiRef.current.isPlaying) {
            pendingAdvanceRef.current = { next: adv.next, kickoff: adv.kickoff };
          } else {
            void advanceToRef.current(adv.next, adv.kickoff);
          }
        }

        if (cur === 'phase-6-final' && detectGoldenRule(text)) {
          const rule = extractGoldenRule(text);
          if (rule) goldenRuleRef.current = rule;
          setTimeout(() => { void finalize(); }, 2000);
        }
      }
    }
    lastSeenRef.current = msgs.length;
  }, [gemini.messages, finalize]);

  useEffect(() => {
    const capMs = untimedPhaseCapMs(phase, lessonLength);
    if (capMs == null) return;
    const capped = phase;
    const id = setTimeout(() => {
      if (advanceGuardRef.current[capped]) return;
      const a = advanceOnCap(capped);
      if (!a) return;
      advanceGuardRef.current[capped] = true;
      if (geminiRef.current.isPlaying) {
        pendingAdvanceRef.current = { next: a.next, kickoff: a.kickoff };
      } else {
        void advanceToRef.current(a.next, a.kickoff);
      }
    }, capMs);
    return () => clearTimeout(id);
  }, [phase, lessonLength]);

  useEffect(() => {
    if (phase !== 'phase-6-final') return;
    const id = setTimeout(() => { void finalize(); }, FINAL_DEBRIEF_CAP_MS);
    return () => clearTimeout(id);
  }, [phase, finalize]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const onEndEarly = () => {
    if (phase === 'phase-1-setup' || phase === 'phase-2-convo-1') {
      void finalize();
    } else if (phase === 'phase-6-final' || phase === 'scoring') {
      void finalize();
    } else {
      queueOrAdvance('phase-6-final', KICKOFF_WRAP_EARLY);
    }
  };

  if (!active) return null;

  const curOrder = PHASE_ORDER[phase];
  const coachSpeaking = gemini.isPlaying;

  return (
    <View className="flex-1 bg-background pt-3 px-4">
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

      {sessionComplete && pendingResult ? (
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
            onPress={() => onComplete(pendingResult)}
            className="flex-row items-center justify-center bg-primary rounded-full py-4 w-full"
          >
            <Text className="text-primary-foreground font-bold text-base mr-2">See your results</Text>
            <ArrowRight size={18} color="#0e1424" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View
            className="rounded-2xl border border-border bg-surface overflow-hidden mb-3"
            style={{ flex: 1, flexShrink: 1, minHeight: 0 }}
          >
            <ScrollView ref={scrollRef} className="flex-1 px-4 py-4" onContentSizeChange={scrollToEnd}>
              {gemini.messages.map((m, i) => {
                const speaker = m.speaker ?? (m.type === 'user_message' ? 'you' : 'coach');
                const isMine = speaker === 'you';
                const meta = SPEAKER_META[speaker] ?? SPEAKER_META.coach;
                const label = m.name ?? meta.name;
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

          <View className="mb-2" style={{ zIndex: 10, elevation: 10 }}>
            <EmotionPanel
              active={active}
              cameraGranted={cameraGranted}
              metrics={fused}
              evi={gemini.status.value}
              cameraRef={cameraRef}
              bridgeRef={bridgeRef}
              onMetrics={setFaceMetrics}
              onCameraReady={() => setCameraReady(true)}
            />
          </View>
        </>
      )}
    </View>
  );
};

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
