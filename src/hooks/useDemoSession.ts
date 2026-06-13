// useDemoSession -- drop-in replacement for useGeminiLive when DEMO_MODE is active.
//
// Implements the exact same public interface so TrinityCoachSession can swap
// between the two with a single ternary. The real engine drops in later by
// flipping the EXPO_PUBLIC_DEMO_MODE flag to false.
//
// Behaviour:
//   connect()    -> streams DEMO_SCRIPT one entry at a time. Assistant lines are
//                   revealed word-by-word AND spoken aloud (expo-speech). The text
//                   is paced to the speech, and we only advance to the next entry
//                   once the current line has finished speaking -- so the voice
//                   never lags behind the transcript.
//   disconnect() -> cancels all timers and stops speech immediately
//   sendText / mute / unmute -> no-ops (demo never sends to Gemini)

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { DEMO_SCRIPT, type DemoSpeaker } from '../lib/mockBackend';
import type { GeminiLiveStatus, GeminiMessage } from './useGeminiLive';

// Distinct voice profiles so the coach, the role-play partner (Jordan) and the
// coach modelling the user ("self") don't all sound like the same robot.
// pitch/rate differences work on every device; a per-speaker `voice` id is
// layered on when the OS exposes higher-quality voices (see pickVoices).
interface VoiceProfile {
  pitch: number;
  rate: number;
  voice?: string;
}

const BASE_PROFILES: Record<DemoSpeaker, VoiceProfile> = {
  // Warm, measured narrator.
  coach: { pitch: 1.02, rate: 0.94 },
  // The other attendee -- lower, brisker, casual.
  partner: { pitch: 0.82, rate: 1.0 },
  // The coach demonstrating "you" -- brighter, a touch quicker.
  self: { pitch: 1.14, rate: 1.0 },
};

// Roughly how long one word takes to speak at rate 1.0 (~190 wpm). The visual
// word stream is paced to this so text and audio stay locked together.
const MS_PER_WORD_AT_RATE_1 = 300;
const MIN_MS_PER_WORD = 120;
const MAX_MS_PER_WORD = 600;

export function useDemoSession() {
  const [status, setStatus] = useState<{ value: GeminiLiveStatus }>({ value: 'disconnected' });
  const [messages, setMessages] = useState<GeminiMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const cancelledRef = useRef(false);
  const isMutedRef = useRef(false);
  const voiceProfilesRef = useRef<Record<DemoSpeaker, VoiceProfile>>(BASE_PROFILES);

  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
  }, []);

  // Try to assign three genuinely different (and, where possible, higher-quality)
  // system voices. Best-effort: falls back to pitch/rate alone if unavailable.
  const pickVoices = useCallback(async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      if (!voices?.length) return;
      const en = voices.filter(v => (v.language || '').toLowerCase().startsWith('en'));
      const pool = en.length ? en : voices;
      // Prefer enhanced/premium voices (much less robotic on iOS).
      const ranked = [...pool].sort((a, b) => qualityRank(b.quality) - qualityRank(a.quality));
      const ids = dedupe(ranked.map(v => v.identifier));
      if (!ids.length) return;
      const pick = (i: number) => ids[Math.min(i, ids.length - 1)];
      voiceProfilesRef.current = {
        coach: { ...BASE_PROFILES.coach, voice: pick(0) },
        partner: { ...BASE_PROFILES.partner, voice: pick(1) },
        self: { ...BASE_PROFILES.self, voice: pick(2) },
      };
    } catch {
      // Voice enumeration not supported -- pitch/rate differentiation still applies.
    }
  }, []);

  const connect = useCallback((_systemPrompt: string) => {
    // Hard reset: kill any timers/speech left over from a previous connect so we
    // never end up with two word-streams writing to the same transcript (the old
    // bug that leaked "undefined" into messages).
    clearAllTimers();
    Speech.stop();
    cancelledRef.current = false;
    setStatus({ value: 'connected' });
    setMessages([]);
    setLastUserMessage(null);
    setIsPlaying(false);

    void pickVoices();

    const scheduleNext = (index: number, delay: number) => {
      if (cancelledRef.current) return;
      const t = setTimeout(() => streamEntry(index + 1), delay);
      timeoutsRef.current.push(t);
    };

    const streamEntry = (index: number) => {
      if (cancelledRef.current || index >= DEMO_SCRIPT.length) return;
      const entry = DEMO_SCRIPT[index];

      // User lines appear instantly and are not spoken.
      if (entry.role === 'user') {
        setLastUserMessage(entry.content);
        setMessages(prev => [
          ...prev,
          { type: 'user_message', message: { role: 'user', content: entry.content } },
        ]);
        scheduleNext(index, entry.delayAfterMs ?? 1500);
        return;
      }

      // ── Assistant line: stream text + speak, advance only when speech is done.
      const profile = voiceProfilesRef.current[entry.speaker ?? 'coach'];
      const words = entry.content.split(' ').filter(Boolean);
      if (!words.length) {
        scheduleNext(index, entry.delayAfterMs ?? 1500);
        return;
      }

      const msPerWord = clamp(
        Math.round(MS_PER_WORD_AT_RATE_1 / (profile.rate || 1)),
        MIN_MS_PER_WORD,
        MAX_MS_PER_WORD,
      );

      // Start with an empty assistant bubble that only THIS entry appends to.
      setIsPlaying(true);
      setMessages(prev => [
        ...prev,
        { type: 'assistant_message', message: { role: 'assistant', content: '' } },
      ]);

      let wordIdx = 0;
      let textDone = false;
      let speechDone = false;
      let advanced = false;

      const maybeAdvance = () => {
        if (advanced || cancelledRef.current) return;
        if (textDone && speechDone) {
          advanced = true;
          setIsPlaying(false);
          scheduleNext(index, entry.delayAfterMs ?? 1500);
        }
      };

      // Capture the interval id locally so completion clears THIS interval, not
      // whatever happens to be current on a shared ref.
      const id = setInterval(() => {
        if (cancelledRef.current) {
          clearInterval(id);
          return;
        }
        const word = words[wordIdx];
        if (word !== undefined) {
          setMessages(prev => {
            if (!prev.length) return prev;
            const arr = [...prev];
            const last = arr[arr.length - 1];
            if (!last || last.type !== 'assistant_message') return prev;
            const next = last.message.content ? last.message.content + ' ' + word : word;
            arr[arr.length - 1] = { ...last, message: { ...last.message, content: next } };
            return arr;
          });
          wordIdx++;
        }
        if (wordIdx >= words.length) {
          clearInterval(id);
          textDone = true;
          maybeAdvance();
        }
      }, msPerWord);
      intervalsRef.current.push(id);

      if (isMutedRef.current) {
        // Muted: no audio, so completion is driven purely by the text stream.
        speechDone = true;
      } else {
        Speech.speak(entry.content, {
          pitch: profile.pitch,
          rate: profile.rate,
          ...(profile.voice ? { voice: profile.voice } : {}),
          onDone: () => {
            speechDone = true;
            maybeAdvance();
          },
          onError: () => {
            speechDone = true;
            maybeAdvance();
          },
        });
        // Safety net in case onDone never fires on a given platform.
        const fallback = setTimeout(() => {
          speechDone = true;
          maybeAdvance();
        }, msPerWord * words.length + 5000);
        timeoutsRef.current.push(fallback);
      }
    };

    const initial = setTimeout(() => streamEntry(0), 800);
    timeoutsRef.current.push(initial);
  }, [clearAllTimers, pickVoices]);

  const disconnect = useCallback(() => {
    cancelledRef.current = true;
    clearAllTimers();
    Speech.stop();
    setIsPlaying(false);
    setStatus({ value: 'disconnected' });
  }, [clearAllTimers]);

  // Stop everything if the component using the hook unmounts.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearAllTimers();
      Speech.stop();
    };
  }, [clearAllTimers]);

  const sendText = useCallback((_text: string) => {}, []);

  const mute = useCallback(() => {
    isMutedRef.current = true;
    setIsMuted(true);
    Speech.stop();
  }, []);

  const unmute = useCallback(() => {
    isMutedRef.current = false;
    setIsMuted(false);
  }, []);

  return {
    status,
    messages,
    isMuted,
    isPlaying,
    lastUserMessage,
    connect,
    disconnect,
    sendText,
    mute,
    unmute,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function qualityRank(quality: string | undefined): number {
  switch ((quality || '').toLowerCase()) {
    case 'premium':
      return 3;
    case 'enhanced':
      return 2;
    case 'default':
      return 1;
    default:
      return 0;
  }
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)));
}
