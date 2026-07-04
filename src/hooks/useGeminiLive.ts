import { useCallback, useEffect, useRef, useState } from "react";
// import LiveAudioStream from "react-native-live-audio-stream";

export type GeminiLiveStatus = "disconnected" | "connecting" | "connected";

export interface GeminiMessage {
  type: "user_message" | "assistant_message";
  message: { role: string; content: string };
  // Optional speaker tag (coach / partner / self / you) so the transcript can
  // label who is talking. Set by the demo session; the live engine may leave it
  // undefined.
  speaker?: "coach" | "partner" | "self" | "you";
  // Optional per-line label override (e.g. "You · as Jordan" in the reversal).
  // Falls back to the speaker's default name when undefined.
  name?: string;
}

const WS_BASE =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

const MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025";
const MAX_RECONNECTS = 4;

function decodePcm16(b64: string): Int16Array {
  // We use the buffer package in React Native to parse base64
  const Buffer = require("buffer").Buffer;
  const bin = Buffer.from(b64, "base64");
  // Guard against odd-length payloads — Int16Array requires an even byte count.
  const evenLength = bin.length - (bin.length % 2);
  const pcm = new Int16Array(bin.buffer, bin.byteOffset, evenLength / 2);
  return pcm;
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

  const destroyedRef = useRef(false);
  const reconnectingRef = useRef(false);
  const currentTurnTranscriptRef = useRef("");

  const lastSystemPromptRef = useRef<string>("");
  const reconnectAttemptsRef = useRef(0);

  // --- AUDIO PLAYBACK (STUB FOR NATIVE) ---
  const scheduleAudio = useCallback((pcm: Int16Array) => {
    // In the web app, this used AudioContext.
    // In React Native, you need to pass `pcm` to a native module that accepts raw PCM buffers.
    // Example: NativeAudioPlayer.playPcmBuffer(pcm);
    
    // For now, we simulate playback state:
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 500);
  }, []);

  // --- WEBSOCKET ---
  const openWs = useCallback(
    (systemPrompt: string): Promise<WebSocket | null> =>
      new Promise((resolve) => {
        lastSystemPromptRef.current = systemPrompt;
        currentTurnTranscriptRef.current = "";
        
        const ws = new WebSocket(`${WS_BASE}?key=${apiKey}`);
        wsRef.current = ws;

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
                outputAudioTranscription: {},
                systemInstruction: { parts: [{ text: systemPrompt }] },
              },
            })
          );
          setStatus({ value: "connected" });
          resolve(ws);
        };

        ws.onmessage = (evt) => {
          try {
            // React Native WebSocket data is usually string, but could be Blob.
            const text = evt.data; 
            const data = JSON.parse(text);
            reconnectAttemptsRef.current = 0;

            const parts: unknown[] = data?.serverContent?.modelTurn?.parts ?? [];
            for (const part of parts as Record<string, unknown>[]) {
              const inlineData = part?.inlineData as Record<string, string> | undefined;
              if (inlineData?.mimeType?.startsWith("audio/pcm") && inlineData?.data) {
                scheduleAudio(decodePcm16(inlineData.data));
              }
              if (typeof part?.text === "string" && part.text) {
                setMessages((prev) => [
                  ...prev,
                  { type: "assistant_message", message: { role: "assistant", content: part.text as string } },
                ]);
              }
            }

            const outText: string = data?.serverContent?.outputTranscription?.text ?? "";
            if (outText) currentTurnTranscriptRef.current += outText;

            if (data?.serverContent?.turnComplete) {
              const full = currentTurnTranscriptRef.current.trim();
              currentTurnTranscriptRef.current = "";
              if (full) {
                setMessages((prev) => [
                  ...prev,
                  { type: "assistant_message", message: { role: "assistant", content: full } },
                ]);
              }
            }

            const inText: string = data?.serverContent?.inputTranscription?.text ?? "";
            if (inText) {
              setLastUserMessage(inText);
              setMessages((prev) => [
                ...prev,
                { type: "user_message", message: { role: "user", content: inText } },
              ]);
            }
          } catch (e) {
            // ignore malformed
          }
        };

        ws.onerror = () => {
          if (!reconnectingRef.current) setStatus({ value: "disconnected" });
          resolve(null);
        };

        ws.onclose = (evt) => {
          if (reconnectingRef.current || destroyedRef.current) return;
          if (evt.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECTS) {
            reconnectAttemptsRef.current += 1;
            setStatus({ value: "connecting" });
            // Simplified reconnect logic...
            return;
          }
          setStatus({ value: "disconnected" });
        };
      }),
    [apiKey, scheduleAudio]
  );

  // --- MICROPHONE CAPTURE (REACT NATIVE LIVE AUDIO STREAM) ---
  const setupMic = useCallback(async (ws: WebSocket) => {
    const options = {
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6, // VOICE_RECOGNITION on Android
      bufferSize: 2048
    };

    // LiveAudioStream.init(options);
    
    // LiveAudioStream.on('data', (data: string) => {
    //   // data is a base64 encoded string of PCM-16 audio
    //   if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return;
    //   
    //   ws.send(
    //     JSON.stringify({
    //       realtimeInput: {
    //         audio: {
    //           data: data,
    //           mimeType: "audio/pcm;rate=16000",
    //         },
    //       },
    //     })
    //   );
    // });

    // LiveAudioStream.start();
  }, []);

  const connect = useCallback(async (systemPrompt: string) => {
    destroyedRef.current = false;
    setStatus({ value: "connecting" });
    const ws = await openWs(systemPrompt);
    if (!ws) return;
    await setupMic(ws);
  }, [openWs, setupMic]);

  const disconnect = useCallback(() => {
    destroyedRef.current = true;
    wsRef.current?.close();
    // LiveAudioStream.stop();
    setStatus({ value: "disconnected" });
  }, []);

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ realtimeInput: { text } }));
  }, []);

  const mute = () => setIsMuted(true);
  const unmute = () => setIsMuted(false);

  return {
    status, messages, isMuted, isPlaying, lastUserMessage,
    connect, disconnect, sendText, mute, unmute
  };
}
