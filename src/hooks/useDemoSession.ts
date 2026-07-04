// useDemoSession -- drop-in replacement for useGeminiLive when DEMO_MODE is active.
//
// Implements the same public interface as useGeminiLive (plus three demo-only
// extras: currentPhase, currentSpeaker and isComplete) so TrinityCoachSession
// can swap between the two with a single ternary.
//
// Behaviour:
//   connect()    -> streams DEMO_SCRIPT one entry at a time. EVERY line is
//                   revealed word-by-word AND spoken aloud so the screen plays
//                   back as a real two-way conversation.
//   disconnect() -> cancels all timers and stops speech immediately
//   sendText / mute / unmute -> no-ops (demo never sends to Gemini)

import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { DEMO_SCRIPT, type DemoSpeaker } from '../lib/mockBackend';
import { getDemoAudioSource, hasDemoAudio } from '../lib/demoAudioAssets';
import type { TrinityPhase } from '../lib/phases';
import type { GeminiLiveStatus, GeminiMessage } from './useGeminiLive';

interface VoiceProfile {
  pitch: number;
  rate: number;
  voice?: string;
}

const COACH_VOICE: VoiceProfile = { pitch: 1.0, rate: 1.05 };
const STUDENT_VOICE: VoiceProfile = { pitch: 1.12, rate: 1.38 };
const BASE_PROFILES: Record<DemoSpeaker, VoiceProfile> = {
  coach: COACH_VOICE,
  partner: COACH_VOICE,
  self: COACH_VOICE,
  you: STUDENT_VOICE,
};

const MS_PER_WORD_AT_RATE_1 = 140;
const MIN_MS_PER_WORD = 60;
const MAX_MS_PER_WORD = 300;

export function useDemoSession() {
  const [status, setStatus] = useState<{ value: GeminiLiveStatus }>({ value: 'disconnected' });
  const [messages, setMessages] = useState<GeminiMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<TrinityPhase>('phase-1-setup');
  const [currentSpeaker, setCurrentSpeaker] = useState<DemoSpeaker | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const cancelledRef = useRef(false);
  const isMutedRef = useRef(false);
  const voiceProfilesRef = useRef<Record<DemoSpeaker, VoiceProfile>>(BASE_PROFILES);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
  }, []);

  const stopAudioPlayer = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.remove();
      audioPlayerRef.current = null;
    }
  }, []);

  const warnIfLowQuality = useCallback((label: string, quality: string | undefined) => {
    const q = (quality || '').toLowerCase();
    if (q === 'premium' || q === 'enhanced') return;
    if (__DEV__) {
      console.warn(
        `[useDemoSession] No enhanced/premium ${label} voice found (got "${quality ?? 'unknown'}"). ` +
          'Install a high-quality voice in system settings before recording.',
      );
    }
  }, []);

  const pickVoices = useCallback(async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      if (!voices?.length) return;
      const en = voices.filter(v => (v.language || '').toLowerCase().startsWith('en'));
      const pool = en.length ? en : voices;
      const ranked = [...pool].sort((a, b) => qualityRank(b.quality) - qualityRank(a.quality));
      const ids = dedupe(ranked.map(v => v.identifier));
      if (!ids.length) return;
      const pick = (i: number) => ids[Math.min(i, ids.length - 1)];
      const coachVoice = ranked.find(v => v.identifier === pick(0));
      const studentVoice = ranked.find(v => v.identifier === pick(1));
      warnIfLowQuality('coach', coachVoice?.quality);
      warnIfLowQuality('student', studentVoice?.quality);
      const coachVoiceId = pick(0);
      const studentVoiceId = pick(1);
      voiceProfilesRef.current = {
        coach: { ...BASE_PROFILES.coach, voice: coachVoiceId },
        partner: { ...BASE_PROFILES.partner, voice: coachVoiceId },
        self: { ...BASE_PROFILES.self, voice: coachVoiceId },
        you: { ...BASE_PROFILES.you, voice: studentVoiceId },
      };
    } catch {
      // Voice enumeration not supported -- pitch/rate differentiation still applies.
    }
  }, [warnIfLowQuality]);

  const connect = useCallback((_systemPrompt: string) => {
    clearAllTimers();
    Speech.stop();
    stopAudioPlayer();
    cancelledRef.current = false;
    setStatus({ value: 'connected' });
    setMessages([]);
    setLastUserMessage(null);
    setIsPlaying(false);
    setCurrentSpeaker(null);
    setCurrentPhase('phase-1-setup');
    setIsComplete(false);

    void pickVoices();
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

    const scheduleNext = (index: number, delay: number) => {
      if (cancelledRef.current) return;
      const t = setTimeout(() => streamEntry(index + 1), delay);
      timeoutsRef.current.push(t);
    };

    const finish = () => {
      if (cancelledRef.current) return;
      setIsPlaying(false);
      setCurrentSpeaker(null);
      setIsComplete(true);
    };

    const streamEntry = (index: number) => {
      if (cancelledRef.current) return;
      if (index >= DEMO_SCRIPT.length) {
        finish();
        return;
      }
      const entry = DEMO_SCRIPT[index];

      setCurrentPhase(entry.phase);

      const speaker: DemoSpeaker = entry.speaker ?? (entry.role === 'user' ? 'you' : 'coach');
      if (entry.role === 'user') setLastUserMessage(entry.content);

      const profile = voiceProfilesRef.current[speaker];
      const words = entry.content.split(/\s+/).filter(Boolean);
      if (!words.length) {
        scheduleNext(index, entry.delayAfterMs ?? 1200);
        return;
      }

      setIsPlaying(true);
      setCurrentSpeaker(speaker);
      setMessages(prev => [
        ...prev,
        {
          type: entry.role === 'user' ? 'user_message' : 'assistant_message',
          message: { role: entry.role, content: '' },
          speaker,
          name: entry.name,
        },
      ]);

      let revealed = '';

      const appendWord = (word: string) => {
        revealed = revealed ? revealed + ' ' + word : word;
        const snapshot = revealed;
        setMessages(prev => {
          if (!prev.length) return prev;
          const arr = [...prev];
          const last = arr[arr.length - 1];
          arr[arr.length - 1] = { ...last, message: { ...last.message, content: snapshot } };
          return arr;
        });
      };

      // Idempotency guard: an entry can be "finished" by several racing
      // signals (Speech onDone, the rendered-audio listener, the safety-net
      // fallback timer, or the muted path). Without this guard, both onDone
      // AND the fallback fire finishEntry -> scheduleNext runs twice -> two
      // parallel streamEntry chains, each of which doubles again, so the same
      // lines get re-appended and re-spoken indefinitely. Advance EXACTLY once.
      let entrySettled = false;
      let entryFallbackId: ReturnType<typeof setTimeout> | null = null;

      const finishEntry = () => {
        if (entrySettled || cancelledRef.current) return;
        entrySettled = true;
        if (entryFallbackId) {
          clearTimeout(entryFallbackId);
          entryFallbackId = null;
        }
        setIsPlaying(false);
        scheduleNext(index, entry.delayAfterMs ?? 1200);
      };

      const startWordReveal = (durationMs: number) => {
        let wordIdx = 0;
        const msPerWord = clamp(
          Math.round(durationMs / Math.max(1, words.length)),
          MIN_MS_PER_WORD,
          MAX_MS_PER_WORD,
        );
        const revealId = setInterval(() => {
          if (cancelledRef.current) {
            clearInterval(revealId);
            return;
          }
          const w = words[wordIdx];
          if (w !== undefined) {
            appendWord(w);
            wordIdx++;
          }
          if (wordIdx >= words.length) clearInterval(revealId);
        }, msPerWord);
        intervalsRef.current.push(revealId);
      };

      const estimatedSpeechMs = (rate: number) =>
        Math.round((words.length * MS_PER_WORD_AT_RATE_1) / (rate || 1));

      const playWithSpeech = () => {
        const durationMs = estimatedSpeechMs(profile.rate);
        startWordReveal(durationMs);

        if (isMutedRef.current) {
          const t = setTimeout(finishEntry, durationMs + 150);
          timeoutsRef.current.push(t);
          return;
        }

        Speech.speak(entry.content, {
          pitch: profile.pitch,
          rate: profile.rate,
          ...(profile.voice ? { voice: profile.voice } : {}),
          onDone: finishEntry,
          onError: finishEntry,
        });
        // Safety net only — cancelled by finishEntry when onDone fires first.
        entryFallbackId = setTimeout(finishEntry, durationMs + 8000);
        timeoutsRef.current.push(entryFallbackId);
      };

      const playWithRenderedAudio = async () => {
        const asset = getDemoAudioSource(entry.id);
        if (!asset) {
          playWithSpeech();
          return;
        }

        stopAudioPlayer();
        const player = createAudioPlayer(asset);
        audioPlayerRef.current = player;

        const durationMs = await waitForAudioDuration(player, estimatedSpeechMs(profile.rate));
        startWordReveal(durationMs);

        if (isMutedRef.current) {
          const t = setTimeout(() => {
            stopAudioPlayer();
            finishEntry();
          }, durationMs + 100);
          timeoutsRef.current.push(t);
          return;
        }

        let finished = false;
        const done = () => {
          if (finished || cancelledRef.current) return;
          finished = true;
          stopAudioPlayer();
          finishEntry();
        };

        const sub = player.addListener('playbackStatusUpdate', status => {
          if (status.didJustFinish) {
            sub.remove();
            done();
          }
        });

        player.play();
        const fallback = setTimeout(() => {
          sub.remove();
          done();
        }, durationMs + 2000);
        timeoutsRef.current.push(fallback);
      };

      if (hasDemoAudio(entry.id)) {
        void playWithRenderedAudio();
      } else {
        playWithSpeech();
      }
    };

    const initial = setTimeout(() => streamEntry(0), 700);
    timeoutsRef.current.push(initial);
  }, [clearAllTimers, pickVoices, stopAudioPlayer]);

  const disconnect = useCallback(() => {
    cancelledRef.current = true;
    clearAllTimers();
    Speech.stop();
    stopAudioPlayer();
    setIsPlaying(false);
    setCurrentSpeaker(null);
    setStatus({ value: 'disconnected' });
  }, [clearAllTimers, stopAudioPlayer]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearAllTimers();
      Speech.stop();
      stopAudioPlayer();
    };
  }, [clearAllTimers, stopAudioPlayer]);

  const sendText = useCallback((_text: string) => {}, []);

  const mute = useCallback(() => {
    isMutedRef.current = true;
    setIsMuted(true);
    Speech.stop();
    audioPlayerRef.current?.pause();
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
    currentPhase,
    currentSpeaker,
    isComplete,
    connect,
    disconnect,
    sendText,
    mute,
    unmute,
  };
}

function waitForAudioDuration(player: AudioPlayer, fallbackMs: number): Promise<number> {
  if (player.duration > 0) {
    return Promise.resolve(player.duration * 1000);
  }

  return new Promise(resolve => {
    let settled = false;
    const finish = (ms: number) => {
      if (settled) return;
      settled = true;
      sub.remove();
      resolve(ms);
    };

    const sub = player.addListener('playbackStatusUpdate', status => {
      if (status.isLoaded && status.duration > 0) {
        finish(status.duration * 1000);
      }
    });

    setTimeout(() => finish(fallbackMs), 4000);
  });
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
