import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Mic, MicOff, PhoneOff } from 'lucide-react-native';
import { EmotionPanel } from './EmotionPanel';
import { useFaceCapture } from '../../hooks/useFaceCapture';
import { useGeminiLive } from '../../hooks/useGeminiLive';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { fuseMetrics, type EmotionMetrics } from '../../lib/emotion';
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
import { CameraView } from 'expo-camera';

// Set EXPO_PUBLIC_GEMINI_API_KEY in .env when the live engine is enabled.
// For the VC demo the engine is mocked, so the fallback is never used for real calls.
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "dummy-key-for-now";

interface Props {
  topic: Topic;
  lessonLength: LessonLength;
  active: boolean;
  onComplete: (r: any) => void;
}

export const TrinityCoachSession = ({ topic, lessonLength, active, onComplete }: Props) => {
  const { user } = useAuth();
  const gemini = useGeminiLive(GEMINI_API_KEY);
  const [phase, setPhase] = useState<TrinityPhase>("phase-1-setup");
  const [faceMetrics, setFaceMetrics] = useState<EmotionMetrics | null>(null);

  // We need refs to the camera and bridge for useFaceCapture
  const cameraRef = useRef<any>(null);
  const bridgeRef = useRef<any>(null);

  const fused = fuseMetrics(faceMetrics, null);

  useFaceCapture({
    cameraRef,
    bridgeRef,
    gated: true,
    enabled: active,
    intervalMs: 3000,
    onMetrics: setFaceMetrics,
  });

  const timed = isTimedPhase(phase);
  const timerDuration = phaseDurationSec(phase, lessonLength);

  const handleTimerEnd = useCallback(() => {
    // Phase logic goes here
    if (phase === "phase-2-convo-1") setPhase("phase-3-feedback-1");
    else if (phase === "phase-4-reversal") setPhase("phase-5-convo-2");
    else if (phase === "phase-5-convo-2") setPhase("phase-6-final");
  }, [phase]);

  const timer = useSessionTimer(timerDuration, timed, handleTimerEnd);

  useEffect(() => {
    if (active && user) {
      // Connect to Gemini
      const basePrompt = trinityPrompt("phase-1-setup", {
        topic,
        scenarioFromCoach: "",
        emotion: { confidence: 0, anxiety: 0, engagement: 0, smiling: 0 }
      });
      const finalPrompt = injectAutismGuardrails(basePrompt, user);
      gemini.connect(finalPrompt);
    } else {
      gemini.disconnect();
    }
  }, [active]);

  const onEndEarly = () => {
    gemini.disconnect();
    onComplete({});
  };

  if (!active) return null;

  const curOrder = PHASE_ORDER[phase];

  return (
    <View className="flex-1 bg-background py-6 px-4">
      {/* Progress Bar */}
      <View className="flex-row items-start mb-6">
        {TRINITY_PHASES.map((p) => {
          const isPast = PHASE_ORDER[p] < curOrder;
          const isActive = PHASE_ORDER[p] === curOrder;
          return (
            <View key={p} className="flex-1 mx-0.5">
              <View className={`h-1 w-full rounded-full mb-1 ${
                isPast ? "bg-primary" : isActive ? "bg-primary/60" : "bg-muted"
              }`} />
              <Text className={`text-[9px] font-medium text-center ${
                isActive ? "text-primary" : isPast ? "text-muted-foreground" : "text-muted-foreground/30"
              }`}>
                {PHASE_SHORT_LABEL[p]}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="flex-1 flex-col space-y-4">
        {/* Chat Panel */}
        <View className="flex-1 rounded-2xl border border-border bg-surface overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <View className="flex-row items-center">
              <Image 
                source={require('../../../assets/images/alex-avatar.jpg')}
                style={{ width: 36, height: 36, borderRadius: 18 }}
                contentFit="cover"
                className="mr-3"
              />
              <View>
                <Text className="text-sm font-semibold text-foreground">Trinity Coach</Text>
                <Text className="text-[11px] text-muted-foreground">{PHASE_LABEL[phase]}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              {timed && (
                <View className="rounded-full border border-border bg-muted px-3 py-1">
                  <Text className="text-sm font-semibold text-foreground">{timer.formatted}</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => (gemini.isMuted ? gemini.unmute() : gemini.mute())}
                className={`h-9 w-9 items-center justify-center rounded-full border ${
                  gemini.isMuted ? "border-destructive/60 bg-destructive/10" : "border-engagement/60 bg-engagement/10"
                }`}
              >
                {gemini.isMuted ? <MicOff size={16} color="#ef4444" /> : <Mic size={16} color="#22c55e" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={onEndEarly} className="flex-row items-center rounded-full border border-border px-3 py-1.5">
                <PhoneOff size={12} color="#a1a1aa" />
                <Text className="text-xs text-muted-foreground ml-1">End</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Transcript Log */}
          <ScrollView className="flex-1 px-4 py-4">
            {gemini.messages.map((m, i) => (
              <View key={i} className={`mb-3 ${m.type === "user_message" ? "items-end" : "items-start"}`}>
                <View className={`rounded-2xl px-4 py-2.5 max-w-[85%] ${
                  m.type === "user_message" ? "bg-primary rounded-br-sm" : "bg-surface-2 rounded-bl-sm"
                }`}>
                  <Text className={`text-sm ${m.type === "user_message" ? "text-primary-foreground" : "text-foreground"}`}>
                    {m.message.content}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Hint */}
          <View className="border-t border-border bg-surface-2 px-4 py-3">
            <Text className="text-[11px] text-muted-foreground">{PHASE_HINT[phase]}</Text>
          </View>
        </View>

        {/* Multimodal Panel */}
        <View className="h-72">
          <EmotionPanel
            active={active}
            metrics={fused}
            faceTop={faceMetrics?.primaryEmotion ? { name: faceMetrics.primaryEmotion, score: 100 } : null}
            voiceTop={null}
            evi={gemini.status.value}
          />
        </View>
      </View>
    </View>
  );
};
