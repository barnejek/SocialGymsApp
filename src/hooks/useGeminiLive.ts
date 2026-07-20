/**
 * useGeminiLive — Gemini Live (BidiGenerateContent) for React Native.
 *
 * Mirrors the web hook's session/reconnect/transcript behaviour.
 * Native I/O: react-native-live-audio-stream (mic) + react-native-audio-api (playback).
 * Requires a dev client (`npx expo run:android` / `run:ios`), not Expo Go.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { AudioContext, AudioManager, type AudioBufferQueueSourceNode } from "react-native-audio-api";
import { Buffer } from "buffer";

// Native module — unavailable in Expo Go / web. Soft-require so Metro can still bundle.
let LiveAudioStream: {
  init: (opts: Record<string, unknown>) => void;
  on: (event: "data", cb: (data: string) => void) => void;
  start: () => void;
  stop: () => void;
} | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LiveAudioStream = require("react-native-live-audio-stream").default;
} catch {
  LiveAudioStream = null;
}

export type GeminiLiveStatus = "disconnected" | "connecting" | "connected";

export interface GeminiMessage {
  type: "user_message" | "assistant_message";
  message: { role: string; content: string };
  speaker?: "coach" | "partner" | "self" | "you";
  name?: string;
}

const WS_BASE =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

const MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025";
const MAX_RECONNECTS = 4;
const PLAYBACK_SAMPLE_RATE = 24000;

function decodePcm16ToFloat32(b64: string): Float32Array {
  const bin = Buffer.from(b64, "base64");
  // Byte-wise decode: Buffer.from() often returns a view at an ODD byteOffset
  // into a shared pool, and `new Int16Array(buffer, oddOffset, …)` throws a
  // RangeError — which the ws message try/catch would swallow, silently
  // dropping audio frames.
  const samples = (bin.length - (bin.length % 2)) / 2;
  const f32 = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    let v = bin[2 * i] | (bin[2 * i + 1] << 8);
    if (v >= 0x8000) v -= 0x10000;
    f32[i] = v / 32768;
  }
  return f32;
}

export function useGeminiLive(apiKey: string) {
  const [status, setStatus] = useState<{ value: GeminiLiveStatus }>({ value: "disconnected" });
  const [messages, setMessages] = useState<GeminiMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const isMutedRef = useRef(false);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Mic frames always target the current open socket (retargeted on phase reconnect).
  const wsTargetRef = useRef<WebSocket | null>(null);
  const micStartedRef = useRef(false);

  const playCtxRef = useRef<AudioContext | null>(null);
  const queueRef = useRef<AudioBufferQueueSourceNode | null>(null);
  const scheduleEndRef = useRef(0); // AudioContext seconds
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const destroyedRef = useRef(false);
  const reconnectingRef = useRef(false);
  const currentTurnTranscriptRef = useRef("");
  const currentUserTranscriptRef = useRef("");

  const lastSystemPromptRef = useRef("");
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectRef = useRef<() => void>(() => {});

  // ── Playback (PCM-16 @ 24 kHz → AudioBufferQueueSourceNode) ────────────────

  const ensurePlayback = useCallback(() => {
    let ctx = playCtxRef.current;
    if (!ctx || ctx.state === "closed") {
      ctx = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE });
      scheduleEndRef.current = 0;
      const queue = ctx.createBufferQueueSource();
      queue.connect(ctx.destination);
      // react-native-audio-api 0.13.x declares
      // `start(when = 0, offset = -1)` and then throws RangeError when
      // `offset < 0` — so the zero-arg call ALWAYS throws. Pass (0, 0)
      // explicitly. Refs are assigned only after start() succeeds, otherwise a
      // live-but-unstarted context would be cached and every later frame would
      // hit `enqueueBuffer of null` forever.
      try {
        queue.start(0, 0);
      } catch (e) {
        void ctx.close(); // don't leak a context per audio frame if start fails
        throw e;
      }
      playCtxRef.current = ctx;
      queueRef.current = queue;
    }
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const queue = queueRef.current;
    if (!queue) throw new Error("playback queue unavailable");
    return { ctx, queue };
  }, []);

  const scheduleAudio = useCallback(
    (f32: Float32Array) => {
      try {
        const { ctx, queue } = ensurePlayback();
        const buf = ctx.createBuffer(1, f32.length, PLAYBACK_SAMPLE_RATE);
        buf.getChannelData(0).set(f32);
        queue.enqueueBuffer(buf);

        const now = ctx.currentTime;
        const duration = f32.length / PLAYBACK_SAMPLE_RATE;
        const fresh = scheduleEndRef.current <= now;
        const startAt = fresh ? now + 0.09 : Math.max(now + 0.01, scheduleEndRef.current);
        scheduleEndRef.current = startAt + duration;

        setIsPlaying(true);
        if (playTimerRef.current) clearTimeout(playTimerRef.current);
        const msUntilEnd = (scheduleEndRef.current - now) * 1000;
        playTimerRef.current = setTimeout(() => setIsPlaying(false), msUntilEnd + 150);
      } catch (e) {
        console.warn("[useGeminiLive] playback failed", e);
      }
    },
    [ensurePlayback]
  );

  /**
   * Drop every buffer the coach hasn't spoken yet. Gemini sends
   * `serverContent.interrupted` when it decides the user barged in; without
   * this the already-queued audio keeps playing over the new turn, which the
   * mic then re-feeds to the VAD — the interruption loop feeding itself.
   */
  const flushPlayback = useCallback(() => {
    try {
      queueRef.current?.clearBuffers();
    } catch {
      // queue may not exist yet — nothing to flush
    }
    scheduleEndRef.current = 0;
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    setIsPlaying(false);
  }, []);

  // ── WebSocket ──────────────────────────────────────────────────────────────

  const openWs = useCallback(
    (systemPrompt: string): Promise<WebSocket | null> =>
      new Promise((resolve) => {
        lastSystemPromptRef.current = systemPrompt;
        currentTurnTranscriptRef.current = "";
        currentUserTranscriptRef.current = "";

        const ws = new WebSocket(`${WS_BASE}?key=${apiKey}`);
        // Gemini wraps its JSON in BINARY WebSocket frames. Without this, RN
        // delivers them as Blob objects; the old `String(evt.data)` coercion
        // produced "[object Blob]", JSON.parse threw, and EVERY server message
        // (setupComplete, audio, transcripts) was silently dropped — a session
        // with a running timer but a mute, textless coach.
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;
        wsTargetRef.current = ws;

        // Resolve once: on the server's setupComplete ack when it sends one,
        // otherwise on a short fallback timer (some v1beta native-audio models
        // never ack). Waiting prevents mic frames racing the setup config.
        let settled = false;
        const settle = (value: WebSocket | null) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              setup: {
                model: MODEL,
                generationConfig: {
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
                  },
                  thinkingConfig: { thinkingBudget: 0 },
                },
                realtimeInputConfig: {
                  automaticActivityDetection: {
                    startOfSpeechSensitivity: "START_SENSITIVITY_HIGH",
                    endOfSpeechSensitivity: "END_SENSITIVITY_HIGH",
                    silenceDurationMs: 500,
                  },
                },
                outputAudioTranscription: {},
                inputAudioTranscription: {},
                systemInstruction: { parts: [{ text: systemPrompt }] },
              },
            })
          );
          setStatus({ value: "connected" });
          setTimeout(() => settle(ws), 800);
        };

        ws.onmessage = (evt) => {
          try {
            const text =
              typeof evt.data === "string"
                ? evt.data
                : Buffer.from(evt.data as ArrayBuffer).toString("utf8");
            const data = JSON.parse(text);
            reconnectAttemptsRef.current = 0;
            // Explicit setup ack → safe to start streaming mic audio now.
            if (data?.setupComplete) settle(ws);

            if (data?.serverContent?.interrupted) {
              flushPlayback();
              currentTurnTranscriptRef.current = "";
            }

            const parts: unknown[] = data?.serverContent?.modelTurn?.parts ?? [];
            for (const part of parts as Record<string, unknown>[]) {
              const inlineData = part?.inlineData as Record<string, string> | undefined;
              if (inlineData?.mimeType?.startsWith("audio/pcm") && inlineData?.data) {
                scheduleAudio(decodePcm16ToFloat32(inlineData.data));
              }
              if (typeof part?.text === "string" && part.text) {
                setMessages((prev) => [
                  ...prev,
                  { type: "assistant_message", message: { role: "assistant", content: part.text as string } },
                ]);
              }
            }

            const flushUserTranscript = () => {
              const t = currentUserTranscriptRef.current.trim();
              currentUserTranscriptRef.current = "";
              if (t) {
                setMessages((prev) => [
                  ...prev,
                  { type: "user_message", message: { role: "user", content: t } },
                ]);
              }
            };

            const inText: string = data?.serverContent?.inputTranscription?.text ?? "";
            if (inText) {
              currentUserTranscriptRef.current += inText;
              setLastUserMessage(currentUserTranscriptRef.current);
            }

            const outText: string = data?.serverContent?.outputTranscription?.text ?? "";
            if (outText) {
              flushUserTranscript();
              currentTurnTranscriptRef.current += outText;
            }

            if (data?.serverContent?.turnComplete) {
              flushUserTranscript();
              const full = currentTurnTranscriptRef.current.trim();
              currentTurnTranscriptRef.current = "";
              if (full) {
                setMessages((prev) => [
                  ...prev,
                  { type: "assistant_message", message: { role: "assistant", content: full } },
                ]);
              }
            }
          } catch {
            // ignore malformed frames
          }
        };

        ws.onerror = () => {
          if (!reconnectingRef.current) setStatus({ value: "disconnected" });
          settle(null);
        };

        ws.onclose = (evt) => {
          if (reconnectingRef.current || destroyedRef.current) return;

          if (evt.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECTS) {
            const attempt = reconnectAttemptsRef.current + 1;
            const delay = Math.min(400 * 2 ** reconnectAttemptsRef.current, 4000);
            console.warn(
              `[useGeminiLive] socket closed (code ${evt.code}); reconnecting — attempt ${attempt}/${MAX_RECONNECTS} in ${delay}ms`
            );
            setStatus({ value: "connecting" });
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = setTimeout(() => reconnectRef.current(), delay);
            return;
          }

          setStatus({ value: "disconnected" });
        };
      }),
    [apiKey, scheduleAudio, flushPlayback]
  );

  // ── Microphone ─────────────────────────────────────────────────────────────

  const setupMic = useCallback(async (_ws: WebSocket) => {
    if (!LiveAudioStream) {
      console.warn(
        "[useGeminiLive] react-native-live-audio-stream unavailable — use a dev client (expo run:android / run:ios)."
      );
      return;
    }
    if (micStartedRef.current) return;

    // ECHO CANCELLATION — without it the mic hears the coach through the
    // speaker, Gemini's VAD scores that as the user talking, and the coach
    // barges in on itself and restarts its turn, forever. The web hook gets
    // this free via getUserMedia({ echoCancellation: true }); native has to ask
    // for it explicitly, per platform.
    if (Platform.OS === "ios") {
      // `voiceChat` mode puts AVAudioSession on the VPIO (voice-processing)
      // path, which is what actually enables AEC + noise suppression on iOS.
      AudioManager.setAudioSessionOptions({
        iosCategory: "playAndRecord",
        iosMode: "voiceChat",
        iosOptions: ["defaultToSpeaker", "allowBluetoothHFP"],
      });
    }

    LiveAudioStream.init({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      // 7 = VOICE_COMMUNICATION. Was 6 (VOICE_RECOGNITION), which on Android
      // deliberately BYPASSES the hardware AEC/NS/AGC chain — great for
      // dictation into a held phone, catastrophic for a speakerphone duplex
      // call like this one. 7 is Android's echo-cancelled capture path.
      audioSource: 7,
      bufferSize: 2048,
    });

    LiveAudioStream.on("data", (data: string) => {
      const target = wsTargetRef.current;
      if (isMutedRef.current || !target || target.readyState !== WebSocket.OPEN) return;
      target.send(
        JSON.stringify({
          realtimeInput: {
            audio: {
              data,
              mimeType: "audio/pcm;rate=16000",
            },
          },
        })
      );
    });

    LiveAudioStream.start();
    micStartedRef.current = true;
  }, []);

  const retargetMic = useCallback((ws: WebSocket) => {
    wsTargetRef.current = ws;
  }, []);

  // ── Silent recovery after unexpected drop ──────────────────────────────────

  const reconnect = useCallback(async () => {
    if (destroyedRef.current) return;
    reconnectAttemptsRef.current += 1;
    reconnectingRef.current = true;
    const ws = await openWs(lastSystemPromptRef.current);
    reconnectingRef.current = false;
    if (!ws) {
      setStatus({ value: "disconnected" });
      return;
    }
    if (micStartedRef.current) retargetMic(ws);
    else await setupMic(ws);
  }, [openWs, retargetMic, setupMic]);

  useEffect(() => {
    reconnectRef.current = reconnect;
  }, [reconnect]);

  // ── Public API ─────────────────────────────────────────────────────────────

  const connect = useCallback(
    async (systemPrompt: string) => {
      destroyedRef.current = false;
      reconnectAttemptsRef.current = 0;
      setStatus({ value: "connecting" });
      setMessages([]);
      scheduleEndRef.current = 0;

      const ws = await openWs(systemPrompt);
      // Throw instead of returning silently so the session UI can surface the
      // failure (engine error banner) rather than showing a dead coach.
      if (!ws) throw new Error("Gemini Live connection failed");
      await setupMic(ws);
    },
    [openWs, setupMic]
  );

  const disconnect = useCallback(() => {
    destroyedRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectAttemptsRef.current = 0;

    if (micStartedRef.current && LiveAudioStream) {
      try {
        LiveAudioStream.stop();
      } catch {
        // ignore
      }
      micStartedRef.current = false;
    }

    wsTargetRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;

    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    try {
      queueRef.current?.clearBuffers();
      queueRef.current?.stop();
    } catch {
      // ignore
    }
    queueRef.current = null;
    try {
      void playCtxRef.current?.close();
    } catch {
      // ignore
    }
    playCtxRef.current = null;
    scheduleEndRef.current = 0;

    setStatus({ value: "disconnected" });
    setIsPlaying(false);
  }, []);

  /** Reconnect with a new system prompt (phase transitions). Mic stays open. */
  const updateSystemPrompt = useCallback(
    async (systemPrompt: string) => {
      if (destroyedRef.current) return;
      reconnectingRef.current = true;
      reconnectAttemptsRef.current = 0;

      wsRef.current?.close();
      wsRef.current = null;

      const ws = await openWs(systemPrompt);
      reconnectingRef.current = false;

      if (!ws) return;
      retargetMic(ws);
    },
    [openWs, retargetMic]
  );

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ realtimeInput: { text } }));
  }, []);

  /**
   * Inject silent context (live camera reads). Uses clientContent with
   * turnComplete:false so the text lands in the model's context WITHOUT
   * triggering a spoken response — the coach adapts on its next natural turn.
   */
  const sendContext = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: "user", parts: [{ text }] }],
          turnComplete: false,
        },
      })
    );
  }, []);

  const mute = useCallback(() => setIsMuted(true), []);
  const unmute = useCallback(() => setIsMuted(false), []);

  return {
    status,
    messages,
    isMuted,
    isPlaying,
    lastUserMessage,
    connect,
    disconnect,
    updateSystemPrompt,
    sendText,
    sendContext,
    mute,
    unmute,
  };
}
