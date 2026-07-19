# Social Gyms Mobile — pointer stub

**All project context lives in `../CLAUDE.md`** (the parent folder — a separate git repo). Read it first; the backlogs are `../ToDo-stack.md` and `../ToDo-concept.md`. Do not create new .md docs here.

If you only have this repo checked out, the non-negotiables are:

1. **Web + mobile parity is the default** — any change here must also land in the web repo in the same session, unless Bart scopes otherwise. Shared files (`lib/trinity.ts`, `phases.ts`, `emotion.ts`, `phaseMachine.ts`, `topics.ts`, `gamification.ts`, `types/supabase.ts`) must stay byte-identical (web repo: `npm run check-drift`).
2. **Gemini Live sends JSON in binary WebSocket frames** — `useGeminiLive` uses `ws.binaryType = "arraybuffer"` + `Buffer` decode. Never regress to string coercion.
3. **expo-router tab screens stay mounted** — `train.tsx` resets on the navigation `blur` event; that unmount tears down Gemini/mic/camera. Never rely on unmount alone.
4. **Dev client required** (`npx expo run:android` / `run:ios`), not Expo Go. Expo SDK 56 — read https://docs.expo.dev/versions/v56.0.0/ before writing Expo code.
5. No DOM here: React Native primitives + NativeWind only. Persona backend is mocked (`mockBackend.ts`); gamification is real Supabase.
