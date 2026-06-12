// Six-phase, timer-driven session structure for Social Gyms.
//
// The lesson is driven by the clock, not by the model deciding when to stop:
//   1. setup       — coach sets the scene + the task (no timer; advances when the coach finishes briefing)
//   2. convo-1     — you talk, coach plays the other person. ZERO feedback. Timed.
//   3. feedback-1  — coach stops and gives concrete feedback (no timer; advances when done)
//   4. reversal    — coach plays YOUR side to demo, you play the other person. ZERO feedback. Timed.
//   5. convo-2     — back to the original roles, run it again. ZERO feedback. Timed.
//   6. final       — coach debriefs and compares before vs after (no timer)
//
// Lesson length is a single multiplier applied to every timed phase:
//   5 min  → 1×  (60s + 60s + 120s = 4 min talking, + briefings ≈ 5 min)
//   10 min → 2×
//   15 min → 3×

export type TrinityPhase =
  | "phase-1-setup"
  | "phase-2-convo-1"
  | "phase-3-feedback-1"
  | "phase-4-reversal"
  | "phase-5-convo-2"
  | "phase-6-final"
  | "scoring";

/** Ordered list of the five user-facing phases (scoring is internal). */
export const TRINITY_PHASES: TrinityPhase[] = [
  "phase-1-setup",
  "phase-2-convo-1",
  "phase-3-feedback-1",
  "phase-4-reversal",
  "phase-5-convo-2",
  "phase-6-final",
];

export const PHASE_ORDER: Record<TrinityPhase, number> = {
  "phase-1-setup": 0,
  "phase-2-convo-1": 1,
  "phase-3-feedback-1": 2,
  "phase-4-reversal": 3,
  "phase-5-convo-2": 4,
  "phase-6-final": 5,
  scoring: 6,
};

/** Very short label used under the progress-bar segments. */
export const PHASE_SHORT_LABEL: Record<TrinityPhase, string> = {
  "phase-1-setup": "Setup",
  "phase-2-convo-1": "First try",
  "phase-3-feedback-1": "Feedback",
  "phase-4-reversal": "Demo",
  "phase-5-convo-2": "Try again",
  "phase-6-final": "Debrief",
  scoring: "Done",
};

export const PHASE_LABEL: Record<TrinityPhase, string> = {
  "phase-1-setup": "Phase 1 · The setup",
  "phase-2-convo-1": "Phase 2 · First attempt",
  "phase-3-feedback-1": "Phase 3 · Feedback",
  "phase-4-reversal": "Phase 4 · Coach demonstrates",
  "phase-5-convo-2": "Phase 5 · Try it again",
  "phase-6-final": "Phase 6 · Final debrief",
  scoring: "Scoring your session",
};

/** One-line hint shown under the transcript per phase. */
export const PHASE_HINT: Record<TrinityPhase, string> = {
  "phase-1-setup": "Your coach is setting the scene. When they finish, just start talking.",
  "phase-2-convo-1": "You're in character. Talk naturally — no feedback yet, the clock is running.",
  "phase-3-feedback-1": "Coach is breaking down what you just did. Just listen.",
  "phase-4-reversal": "Roles swapped — the coach plays you to show one way. You play the other person.",
  "phase-5-convo-2": "Back to the original roles. Run it again and apply what you saw.",
  "phase-6-final": "Final debrief — your before-and-after and your Golden Rule.",
  scoring: "Scoring your session…",
};

// ── Lesson length ────────────────────────────────────────────────────────────

export type LessonLength = 5 | 10 | 15;
export const LESSON_LENGTHS: LessonLength[] = [5, 10, 15];
export const DEFAULT_LESSON_LENGTH: LessonLength = 5;

/** 5→1×, 10→2×, 15→3×. */
export const lessonMultiplier = (len: LessonLength): number => len / 5;

// Base (1×) durations in seconds for the three timed phases.
const BASE_DURATION_SEC: Partial<Record<TrinityPhase, number>> = {
  "phase-2-convo-1": 60,
  "phase-4-reversal": 60,
  "phase-5-convo-2": 120,
};

/** Returns the timed duration for a phase at the given lesson length, or 0 if untimed. */
export const phaseDurationSec = (phase: TrinityPhase, len: LessonLength): number => {
  const base = BASE_DURATION_SEC[phase] ?? 0;
  return base * lessonMultiplier(len);
};

/** Which phases run against the clock. */
export const isTimedPhase = (phase: TrinityPhase): boolean =>
  phase === "phase-2-convo-1" || phase === "phase-4-reversal" || phase === "phase-5-convo-2";
