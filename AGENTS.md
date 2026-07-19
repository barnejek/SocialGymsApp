# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Project context

- Read `MOBILE_APP_ARCHITECTURE.md` for the three-persona architecture and routing.
- Read `ToDo.md` for the current improvement plan, known engine wiring gaps, and visual direction.
- Post-pitch status (July 2026): the MIT EPGM pitch is done. DEMO_MODE has been fully removed — the live voice/video engine is the only path and requires a dev client (`npx expo run:android` / `run:ios`, not Expo Go). Persona backend is still mocked (`mockBackend.ts`); gamification uses real Supabase.

# Rules that mirror the root repo's CLAUDE.md

- **Web + mobile parity is the default.** Any change made here must also be made in the web repo (the parent folder — a separate git repository) in the same session, and vice versa, unless Bart explicitly scopes the request to one platform.
- **Gemini Live socket:** the server sends JSON in **binary** WebSocket frames. `useGeminiLive` sets `ws.binaryType = "arraybuffer"` and decodes with `Buffer` — string-coercing `evt.data` silently drops every server message (mute, textless coach). Don't regress this.
- **Session lifecycle:** expo-router tab screens stay mounted. `train.tsx` resets to the picker on the navigation `blur` event — that unmount is what disconnects Gemini and stops mic/camera. Never rely on screen unmount alone for teardown.
