---
name: demo-mode
description: Scaffold the DEMO_MODE scripted session flag for the Social Gyms pitch build. Implements pre-written transcript streaming, fake emotion-metrics timeline, and wires it behind the useGeminiLive interface.
---

Scaffold a DEMO_MODE feature for the Social Gyms pitch build.

Architecture rules:
- Add `DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true'` to `src/lib/utils.ts`
- The demo path must implement the same interface as `useGeminiLive` (startSession, stopSession, onTranscript, onMetrics) so the real engine drops in by flipping the flag
- Scripted transcript streams in word-by-word with ~80ms delay per word using RN `setInterval` (NOT `window.setInterval`)
- Emotion metrics timeline: an array of `{timestamp, engagement, comfort, openness}` interpolated to the gauges on a 200ms tick
- Session phases still use real timers from `useSessionTimer` — demo mode only fakes the Gemini WebSocket data
- Wire the flag check inside `TrinityCoachSession` before any native module calls

Files to touch: `src/hooks/useGeminiLive.ts`, `src/lib/mockBackend.ts` (add sample transcript), `src/app/(tabs)/train.tsx`
