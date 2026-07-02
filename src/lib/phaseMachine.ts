// Pure decision logic for the 6-phase Trinity session.
// No React, no refs, no side effects — unit-testable, and shareable with the
// mobile app when its engine is wired up.
//
// SHARED FILE — keep byte-identical with mobile/src/lib/phaseMachine.ts
// (enforced by `npm run check-drift`).

import type { LessonLength, TrinityPhase } from "./phases";

// ── Kickoff strings that trigger the coach's first turn in a phase ──────────

export const KICKOFF_FEEDBACK =
  "The round is over. Give your concrete feedback now, then stop.";
export const KICKOFF_REVERSAL =
  "Announce the role swap in one short line, then immediately open the scene yourself — you are playing the user's side, so you make the first move.";
export const KICKOFF_CONVO2 =
  "Reset the roles in one short line, then wait for me to speak.";
export const KICKOFF_FINAL =
  "The session is over. Give the final debrief, the homework, and the Golden Rule now.";
export const KICKOFF_WRAP_EARLY =
  "Wrap up early — give the final debrief and Golden Rule now.";

export interface PhaseAdvance {
  next: TrinityPhase;
  kickoff?: string;
}

// ── Sentinel detection (English-only session — enforced in the prompt) ──────

/** Phase 1 → 2: the coach closes the setup with "Whenever you're ready, go ahead." */
export const detectSetupComplete = (text: string): boolean => {
  const lc = text.toLowerCase().replace(/[‘’]/g, "'");
  return (
    lc.includes("go ahead") ||
    lc.includes("whenever you") ||
    lc.includes("when you're ready")
  );
};

/** Phase 3 → 4: the coach ends feedback with "Now let me show you how I'd handle this." */
export const detectFeedbackComplete = (text: string): boolean => {
  const lc = text.toLowerCase();
  return (
    lc.includes("show you how") ||
    lc.includes("let me show") ||
    lc.includes("let me demonstrate")
  );
};

/** Phase 6 end: the coach says "Your Golden Rule is this: …" (always its last line). */
export const detectGoldenRule = (text: string): boolean =>
  text.toUpperCase().includes("GOLDEN RULE");

/**
 * Pull the Golden Rule sentence out of the debrief text, for the Results card.
 * Returns everything after the "golden rule is (this)?:" marker, trimmed of
 * surrounding quotes/whitespace, or null if the marker isn't present.
 */
export const extractGoldenRule = (text: string): string | null => {
  const m = text.match(/golden rule is(?: this)?\s*[:,]\s*(.+)/i);
  if (!m) return null;
  const rule = m[1].trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").trim();
  return rule.length > 0 ? rule : null;
};

/** Sentinel-driven advance for the untimed, coach-led phases. */
export const advanceOnTranscript = (
  phase: TrinityPhase,
  text: string
): PhaseAdvance | null => {
  if (phase === "phase-1-setup" && detectSetupComplete(text)) {
    return { next: "phase-2-convo-1" };
  }
  if (phase === "phase-3-feedback-1" && detectFeedbackComplete(text)) {
    return { next: "phase-4-reversal", kickoff: KICKOFF_REVERSAL };
  }
  return null;
};

// ── Timer-driven transitions (the timed, in-character rounds) ────────────────

export const advanceOnTimerEnd = (phase: TrinityPhase): PhaseAdvance | null => {
  switch (phase) {
    case "phase-2-convo-1":
      return { next: "phase-3-feedback-1", kickoff: KICKOFF_FEEDBACK };
    case "phase-4-reversal":
      return { next: "phase-5-convo-2", kickoff: KICKOFF_CONVO2 };
    case "phase-5-convo-2":
      return { next: "phase-6-final", kickoff: KICKOFF_FINAL };
    default:
      return null;
  }
};

// ── Hard time-caps for the untimed phases ────────────────────────────────────
// Reliability guarantee: even if a sentinel is never detected, the session
// advances on schedule. Durations scale with lesson length (5→1×, 10→2×, 15→3×).

const BASE_CAP_MS: Partial<Record<TrinityPhase, number>> = {
  "phase-1-setup": 25_000,
  "phase-3-feedback-1": 35_000,
};

/** Force-finish window for the final debrief (fixed, does not scale). */
export const FINAL_DEBRIEF_CAP_MS = 75_000;

/** Cap for an untimed phase at the given lesson length, or null if uncapped. */
export const untimedPhaseCapMs = (
  phase: TrinityPhase,
  len: LessonLength
): number | null => {
  const base = BASE_CAP_MS[phase];
  if (base == null) return null;
  return Math.round(base * (len / 5));
};

/** Where a time-capped phase advances to when its cap fires. */
export const advanceOnCap = (phase: TrinityPhase): PhaseAdvance | null => {
  switch (phase) {
    case "phase-1-setup":
      return { next: "phase-2-convo-1" };
    case "phase-3-feedback-1":
      return { next: "phase-4-reversal", kickoff: KICKOFF_REVERSAL };
    default:
      return null;
  }
};
