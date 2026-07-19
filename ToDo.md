# Social Gyms Mobile — ToDo & Improvement Plan

> Context: this app is the **showcase build for the MIT EPGM VC pitch (July 2026)**.
> Backend stays mocked (no Supabase). The live voice/video engine stays commented out.
> Priorities below are tagged: 🔴 do before pitch · 🟡 strong nice-to-have · 🟢 post-pitch roadmap.

---

## 1a-bis. Fixed in the live-engine debug pass (2026-07-19, evening)

- **THE "no voice, no text" bug**: Gemini Live sends its JSON wrapped in **binary** WebSocket frames. RN delivered them as Blobs and the hook's `String(evt.data)` coercion produced `"[object Blob]"` → `JSON.parse` threw → every server message (setupComplete, audio, transcripts) was silently dropped, while timers and phase caps kept the UI moving. Fixed: `ws.binaryType = "arraybuffer"` + `Buffer` decode in `useGeminiLive` (the web hook already handled Blob frames — this was the missing port).
- **PCM decode alignment**: `Buffer.from(base64)` can return a view at an odd `byteOffset`; constructing `Int16Array` on it throws a RangeError that the ws try/catch swallowed (dropped audio frames). Rewritten as an alignment-safe byte-wise decode.
- **Stale session on re-entry**: tab screens stay mounted in expo-router, so leaving mid-session and coming back showed the old conversation. `train.tsx` now resets to the picker on the navigation `blur` event, which unmounts `TrinityCoachSession` → disconnects Gemini, stops mic/camera, clears gym deep-link params.
- **Silent connection failures surfaced**: `connect()` now throws when the socket never opens, and the session screen watches `gemini.status` — a mid-session drop (incl. server setup rejections after the 800 ms fallback resolve) shows the error banner instead of a dead coach.
- **Web repo (same pass)**: `disconnect()` now hard-stops all scheduled audio buffer sources — previously the coach kept talking for seconds after leaving the session because queued audio on the shared AudioContext was never stopped.

## 1a. Fixed in the full-stack audit pass (2026-07-19)

- **DEMO_MODE fully removed (post-pitch)**: scripted engine in `useGeminiLive`, fake metrics timeline in `useFaceCapture`, `DEMO_SCRIPT`/`demoMetricsAt` in `mockBackend.ts`, `DEMO_SCORE` in `chat.ts`, the `EXPO_PUBLIC_DEMO_MODE` flag and all UI branches. The app now always runs the live engine (dev client required — `npx expo run:android` / `run:ios`, NOT Expo Go).
- **Env/config**: removed the `'dummy-key-for-now'` Gemini fallback; a missing `EXPO_PUBLIC_GEMINI_API_KEY` (or a failed connect) now shows a visible error banner in the session screen. `.env` now carries the real client-side Gemini key (same as web's `VITE_GEMINI_API_KEY`).
- **Env naming**: `chat.ts` / `supabaseStorage.ts` now accept `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` *or* `_ANON_KEY` (matching `rag.ts` and the web repo); killed the `b2b-placeholder-url` fallback — missing env now fails loudly.
- **Child metric hiding (the §3 ✅ that wasn't)**: `EmotionPanel` now takes `phase`; numeric gauges are force-hidden during rehearsal rounds (web parity, Clark & Wells) and hidden *entirely* for the `b2b_autism_user` persona — the child sees a friendly line instead.
- **"Openness" mislabel**: the panel showed `confidence` as Openness while scoring uses `smiling` as openness. Rows now match the web panel: Confidence / Engagement / Smiling / Anxiety.
- **Face bridge**: detection tuned to `inputSize: 224, scoreThreshold: 0.3` (web parity, ~3–4× less compute); CDN load failures/timeouts now post an `error` message → "Face tracking unavailable" overlay instead of silently dead gauges. Bundling face-api + models as local assets remains the real fix (§2).
- **`takePictureAsync`**: removed the invalid `scale` option (it was silently ignored); real downscaling still to do via `pictureSize`.
- **Setup handshake**: `useGeminiLive` (both repos) now waits for `setupComplete` (800 ms fallback) before mic streaming starts.
- **Supabase**: `score-conversation` (and likely `retrieve-context`) return 500 — the `GEMINI_API_KEY` secret is not set on project `rzplvdxylixgptrjxqdc`. Set it via dashboard → Edge Functions → Secrets, or `supabase secrets set`.

## 1. Fixed in this pass (changelog)

- Removed dead Expo template code that shipped a demo "Explore" route inside the pitch app (`explore.tsx`, `themed-*`, `app-tabs*`, `animated-icon*`, `collapsible`, `external-link`, `hint-row`, `web-badge`, `use-theme`, `use-color-scheme*`, `constants/theme.ts`).
- `lib/utils.ts` / `lib/chat.ts` imported web-only packages (`clsx`, `tailwind-merge`, `sonner`) that are **not installed** — would crash Metro the moment anything imported them. Rewritten dependency-free.
- `useSessionTimer` used `window.setInterval` (web idiom) → plain `setInterval`.
- History tab was visible to **all** personas, contradicting the architecture doc → now `href: null`, reached via the Dashboard "Workouts" card only.
- Dashboard greeted "Hi, Alex!" regardless of user and loaded the avatar from `i.pravatar.cc` (network dependency = demo risk) → now `user.name` + bundled `alex-avatar.jpg`.
- Autism home hardcoded Sam's name and IEP goals → now reads `user.autismProfile.iepGoals` from the mock backend (single source of truth).
- Profile screen now pre-fills from the logged-in user.
- Gemini API key moved to `process.env.EXPO_PUBLIC_GEMINI_API_KEY` (safe fallback kept).
- `decodePcm16` could throw on odd-length audio payloads → guarded.
- Removed dead `SKILLS` const, unused `handleStart`, stray `any` types in `train.tsx`.
- `tsc --noEmit` passes clean.

---

## 2. The Engine (voice + video) — how to incorporate it properly 🔴

This is the crucial feature. Current state and the path I recommend:

### Why it fights `npx expo start`
`react-native-live-audio-stream` and raw PCM playback are native modules — they can never run in Expo Go. The fix is **not** to abandon Expo:

1. **Use a dev client**: `npx expo run:android` once, then `npx expo start --dev-client` gives you the exact same workflow with native modules enabled. Keep Expo Go compatibility by feature-flagging the engine (see Demo Mode below).
2. **Audio playback**: replace the `scheduleAudio` stub with `react-native-audio-api` (a native port of the Web Audio API). Its `AudioContext`/buffer-source model is nearly identical to the web app's playback code, so `useGeminiLive` can stay structurally shared between platforms.
3. **Face tracking**: the WebView bridge works, but it downloads `face-api.js` + models from `vladmandic.github.io` at runtime — a conference-WiFi time bomb. Either bundle the JS/models as local assets into the HTML, or (🟢) migrate to `react-native-vision-camera` frame processors + MLKit face detection (no WebView, no network, ~10× faster).

### Wiring gaps to fix when un-commenting (these exist today)
- **Broken ref plumbing**: `TrinityCoachSession` creates `cameraRef`/`bridgeRef` and hands them to `useFaceCapture`, but the actual `<CameraView>` and `<FaceTrackerBridge>` are rendered inside `EmotionPanel` with *different* refs, and EmotionPanel's `onMetrics` callback is a no-op. Lift the camera + bridge up into `TrinityCoachSession` (EmotionPanel becomes pure presentation), or pass the refs down as props.
- **`useFaceCapture` never re-arms**: its effect early-returns when `cameraRef.current` is null at mount, and refs aren't reactive — it will never start once the camera mounts. Gate on a `cameraReady` state flag set by `CameraView.onCameraReady`.
- **Phase machine is half-built**: only timer-driven transitions exist (2→3, 4→5, 5→6). Missing: 1→2 and 3→4 (the prompts already force the coach to say the exact trigger phrases — "Whenever you're ready, go ahead." / "Now let me show you how I'd handle this." — listen for them in `outputTranscription`), and 6→`onComplete`. Without these, a real session stalls in Phase 1 forever.
- **No per-phase reconnect**: the web app reconnects Gemini with a fresh `systemInstruction` + injected transcript history at every phase change. Mobile connects once with the Phase-1 prompt and never updates. Port the reconnect-on-phase-change logic.
- **Reconnect on drop is stubbed** ("Simplified reconnect logic..." comment) — it counts attempts but never reopens the socket.
- **Setup ack**: `resolve(ws)` fires on `onopen`; properly wait for `BidiGenerateContentSetupComplete` before streaming mic audio.
- **Mic permission** is never requested (camera permission is). Add it to the pre-session flow.
- `prosodyToMetrics` in `lib/emotion.ts` is Hume-EVI vocabulary left over from the web app; Gemini Live provides no prosody scores. Remove it or relabel honestly ("voice analysis: roadmap").

### ✅ Demo Mode (the single highest-value item for the pitch)
Add a `DEMO_MODE` flag that plays back a **scripted session**: a pre-written transcript that streams in word-by-word, a fake emotion-metrics timeline animating the gauges, timers running for real. The pitch then never depends on WiFi, mic permissions, API quota, or Gemini latency — and every run is flawlessly identical. Wire it behind the same `useGeminiLive` interface so the real engine drops in later without UI changes.

---

## 3. Logic & personalization — per screen

### Login (`(auth)/login.tsx`)
- 🟡 Frame it as what it really is in the pitch: a **product-line switcher**. Retitle "Select a persona to demo" → "Three products. One engine." with one-line value prop per card (B2C: "$19/mo consumer", Autism: "clinic-licensed", Enterprise: "per-seat SaaS") — lets the VC see the business model on screen 1.
- 🟢 Persist last persona (AsyncStorage) and skip login on relaunch.

### B2C Dashboard (`dashboard.tsx`)
- ✅ ~~Streak logic is fake~~ — replaced by real Supabase stats (streak, level + XP ring, Reps, daily quests, Presence rings) in the gamification build (July 2026). Fake `currentStats`/`recordSessionComplete` deleted from `lib/gamification.ts`.
- 🟡 "3 scenarios recommended for you" is static — pick 3 topics the user hasn't trained recently and deep-link each one into `train` with the topic pre-selected (real personalization, cheap to mock).
- 🟡 Presence Score should visibly react to the just-finished session (the `recordSessionComplete` rolling average already does this — surface a "+2 since yesterday" delta chip).
- 🟢 *(Public-speaking coach hat)* add micro-metrics that practitioners actually track: filler-word count, words-per-minute, average pause length. Even mocked, these make the product credible to anyone who has done speech coaching.
- 🟢 *(Social-media hat)* a **shareable recap card** — score + streak + Golden Rule on a branded gradient, "Share" via `expo-sharing`. This is the organic-growth slide of the pitch made tangible.

### Autism Home (`autism-home.tsx`) — *carer portal*
- 🔴 Clarify **who the user is**. Sam is the child; this screen is for the carer. Greet the carer, show Sam as "Today's learner: Sam". Add a `carerName` + child relationship to `mockBackend`. (As pitched to clinics, the carer/clinician is the buyer — the screen should reflect that.)
- 🟡 Goal progress is hardcoded percentages; derive from a mock session log so finishing a demo session moves the bar.
- 🟡 *(Autism-consultant hat)* the portal copy promises "calm 0.8x pace" — `trinity.ts` never sets a speaking-rate instruction. Add it to the guardrails so claim and prompt match.
- 🟡 Add a **visual schedule** ("First → Then" board: First "Joining a Game", Then "Sticker!") — this is NDBI-standard practice and instantly recognizable to clinician buyers.
- 🟢 Sensory check-in before sessions (3 large emoji-faces: "How is Sam feeling?") which adjusts the guardrail prompt (already supported by `sensoryProfile`).

### Autism training flow (`AutismScenarioPicker`, session)
- ✅ *(Consultant hat)* during sessions, **hide numeric metrics from the child view**. Percentages and "Anxiety: 62%" on screen are clinically inappropriate and will alarm clinician evaluators. Child sees a friendly companion + star rewards; the quantitative panel belongs in the carer portal/enterprise tracker after the fact.
- 🟡 The picker ignores `length`/`onLengthChange` (props passed, never rendered) — children's sessions also shouldn't default to adult durations. Offer "Short / Long" with visual icons; default shorter than 5 min.
- 🟡 Replace abstract lucide icons (megaphone = "Sensory"?) with concrete picture cues (photos/illustrations of a playground, headphones, a classroom). Concrete > symbolic is the rule for this population.
- 🟢 More micro-scenarios in `topics.ts`: turn-taking, losing a game gracefully, asking for help, ordering food. Add `ageBand` and `difficulty` fields.
- 🟢 Trinity prompts are adult-flavored (Carnegie/Cialdini/Voss). Add a **child prompt variant**: shorter sentences, declarative language ("I see you waited for your turn!"), no influence-psychology framing — NDBI/SCERTS vocabulary instead. Keep the 6-phase clock; rename phases child-side ("Watch me try!" instead of "Role reversal").

### Enterprise Portal (`enterprise.tsx`)
- 🟡 The mock data tells a confused story: "New Hope Clinic" (a clinic) shows 2,401 corporate users and Q3 module rollouts. Split the mock into two orgs — a corporate one (e.g. "Meridian Insurance, 2,401 seats") for the HR view and New Hope Clinic for the Special-Ed view — and pick by toggle. VCs notice inconsistent demo data.
- 🟡 Hardcoded single student "Sam" → `students[]` array in `mockBackend` with 3–4 entries and a working selector. Shows the multi-tenant story.
- 🟡 *(HR hat)* add the metrics HR buyers actually report upward: completion rate, % improvement after 4 sessions, top-3 skill gaps by department, and an "Assign module to team" CTA (can be a dead button — it signals the workflow). Mention SCORM/LMS export in the roadmap, not the UI.
- 🟢 *(HR hat)* one line of trust copy: "Individual session data is anonymized; managers see aggregates only." Psychological safety is the #1 objection to this product category in HR procurement.

### Train flow (`train.tsx` + results)
- 🔴 The **results screen is the payoff** and currently says only "Training Complete!". Show: attempt-1 vs attempt-2 bars for Engagement/Comfort/Openness (mock `ScoreResult` already defines this shape in `lib/chat.ts`), the Golden Rule as a quote card, and a "Share" / "Go again" pair. This is the before/after moment the whole pitch hangs on.
- 🟡 Persona-aware results: child → stars + "You did it!"; enterprise → competency language; B2C → score + streak + share.
- 🟡 `EnterpriseScenarioPicker` also ignores the lesson-length props — render the selector (recommended duration per module is a nice touch).
- 🟢 `gamification.ts` is a mutable module singleton; move into a React context (or Zustand) so the dashboard re-renders when a session finishes.

### History (`history.tsx`)
- 🟡 Push a real entry from `recordSessionComplete` into the (in-memory) history list so a live demo session shows up at the top, then the static mock entries below. "What you just did is already in your history" lands well.

### Skills tree (`skills.tsx`)
- ✅ ~~Tree is fully hardcoded~~ — rebuilt as the data-driven Gym (July 2026): 4 paths from `gam_paths`/`gam_skills`, tier unlock + daily challenge rules, mastery medal rings, Romance 18+ attestation, tap-to-train with the mastery-appropriate difficulty modifier.

### Cross-cutting
- 🟡 "Eye Contact" in `EmotionPanel` displays the *engagement* score — mislabeled (and we don't track gaze). Rename to "Attention" or compute nothing and mark it roadmap.
- 🟢 `getTopic()` uses a non-null assertion; return `undefined`-safe lookup before topics become user-generated.

---

## 4. Visual design suggestions (separate, as requested)

### 4.1 One brand, not two 🔴
The design system (`global.css`) defines **primary = warm orange** (`hsl(30 92% 61%)` ≈ `#F5A340`, matching the logo), but most screens hardcode **blue** (`#2563eb`, `#3b82f6`) plus raw slate hexes (`#0f172a`, `#1e293b`, `#334155`) copied from web defaults — tab bar, segmented control, all three pickers, autism tiles, login icons. Right now the app reads as two different products stitched together.

- Replace every hardcoded hex with token classes (`bg-primary`, `bg-surface`, `border-border`) or a single `src/constants/colors.ts` exported for places that need raw values (lucide `color=`, `tabBarActiveTintColor`).
- Decide the accent once — recommendation: the **orange**, it's distinctive in a sea of blue AI apps and matches the wordmark.

### 4.2 App shell
- 🔴 Splash screen is bright blue `#208AEF` and the Android adaptive-icon background is pale `#E6F4FE` — both clash with the dark-navy app (`#0e1424`). Align splash + icon background to the navy and the glow logo. First impression on the demo device matters.
- 🟡 Load a brand font with `expo-font` (Manrope or Inter — geometric, friendly, free). System font reads as prototype.

### 4.3 Per-persona theming 🟡
Make the persona switch *visually obvious* within one second — it demonstrates platform breadth without a single slide:
- **B2C**: current dark navy + orange energy, punchy.
- **Autism mode**: light, low-stimulus theme — soft sage/sky palette, larger type, bigger touch targets, `useReducedMotion`-style restraint (no spring animations, no confetti, nothing sudden), rounded everything. A dark "gamer" UI is the wrong register for a calm clinical tool.
- **Enterprise**: neutral slate, restrained single accent, denser layout. Should feel like something an HR director screenshots into a deck.

### 4.4 Session screen (TrinityCoachSession)
- Timer as a **ring around the coach avatar** instead of a pill — reads at a glance mid-conversation.
- The 6-segment progress bar uses 9px labels that will truncate; show dots + only the current phase label.
- Animated speaking indicator (pulsing ring when `isPlaying`) so it's obvious when the coach talks vs listens.
- Camera preview: mirror it, round the corners, add a subtle face-position guide. Hide the raw metrics panel for the autism persona (see §3).
- The coach avatar is `alex-avatar.jpg` (a photo) while the brand is an abstract glow-logo — pick one coach identity ("Alex" with consistent illustrated avatar) and use it in header, transcript bubbles, and results.

### 4.5 Results & gamification moments
- Before/after delta bars with a count-up animation — the single most persuasive visual in the product.
- Confetti (`react-native-reanimated`) on completion for B2C/enterprise; gentle star-burst for the child mode.
- Streak flame should animate when it increments.

### 4.6 Pickers
- Enterprise carousel: add `snapToInterval` + `decelerationRate="fast"`, card shadow, and a peeking next card to signal swipeability.
- Autism grid: selected state currently changes color only — add a checkmark + slight scale so it isn't color-dependent (colorblind-safe, and many autistic kids are colorblind too).
- B2C list: the selected check is orange on a blue border (the §4.1 problem in miniature).

### 4.7 Accessibility pass 🟡
- `accessibilityLabel` on all icon-only buttons (mute, end call, settings, back).
- Contrast-check `muted-foreground` (65% lightness) on `background` — borderline for small text.
- Respect system font scaling (`allowFontScaling` is on by default — verify layouts don't break at 1.3×).
- Standardize on `gap-*` (the codebase mixes `space-y-*` and `gap-*`, sometimes doubled on the same element).

---

## 5. Suggested order of attack before the pitch

1. Demo Mode for the Trinity session (§2) — de-risks the entire pitch.
2. Results screen with before/after bars (§3 Train).
3. Brand color unification + splash fix (§4.1, §4.2).
4. Autism-mode child-view metric hiding + carer reframing (§3) — your differentiator with clinical buyers.
5. Enterprise mock-data story cleanup (§3).
6. Per-persona theming (§4.3) if time allows.
