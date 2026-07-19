// Social Gyms gamification client library.
//
// SHARED FILE — keep byte-identical with mobile/src/lib/gamification.ts
// (enforced by `npm run check-drift`). The only per-platform difference lives
// in ./supabaseStorage (localStorage on web, AsyncStorage on mobile).
//
// HARD RULE: no reward math here beyond display helpers — the server
// (apply_session_rewards in Postgres) is the single source of truth. Clients
// only render server-returned reward payloads.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "../types/supabase";
import { authStorage, envSupabaseAnonKey, envSupabaseUrl } from "./supabaseStorage";

// Project coordinates come from the platform env (.env: VITE_SUPABASE_URL on
// web, EXPO_PUBLIC_SUPABASE_URL on mobile — resolved in ./supabaseStorage) and
// fall back to the hardcoded publishable values so an env mismatch can never
// point one platform at a different project. Safe to embed; RLS + EXECUTE
// grants are the security boundary, not this key.
export const SUPABASE_URL =
  envSupabaseUrl ?? "https://rzplvdxylixgptrjxqdc.supabase.co";
export const SUPABASE_ANON_KEY =
  envSupabaseAnonKey ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6cGx2ZHh5bGl4Z3B0cmp4cWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODMxMzAsImV4cCI6MjA5OTk1OTEzMH0.1TGFkDB2CIan3ZF8bWiZ4OcKsfxkkxP1kWxFMCOiJh8";

// ── Row aliases ──────────────────────────────────────────────────────────────

export type PathDef = Tables<"gam_paths">;
export type SkillDef = Tables<"gam_skills">;
export type QuestDef = Tables<"gam_quests">;
export type AchievementDef = Tables<"gam_achievements">;
export type Profile = Tables<"profiles">;
export type UserStats = Tables<"gam_user_stats">;
export type SkillProgress = Tables<"gam_skill_progress">;
export type UserQuest = Tables<"gam_user_quests">;
export type UserAchievement = Tables<"gam_user_achievements">;

// ── Reward payload (rendered verbatim by the reward sequence UIs) ────────────

export type Mastery = 0 | 1 | 2 | 3;
export type StreakEvent = "extended" | "frozen" | "reset" | "none";

export interface AxisScores {
  engagement: number;
  comfort: number;
  openness: number;
}

export interface XpBreakdownItem {
  reason: string;
  amount: number;
}

export interface RewardPayload {
  composite: number;
  scores: { attempt1: AxisScores; attempt2: AxisScores; best: AxisScores };
  xpAwarded: number;
  xpBreakdown: XpBreakdownItem[];
  totalXp: number;
  level: number;
  leveledUp: boolean;
  masteryBefore: Mastery;
  masteryAfter: Mastery;
  streak: number;
  streakEvent: StreakEvent;
  repsEarned: number;
  questsCompleted: string[];
  achievementsUnlocked: string[];
  challenge: boolean;
  sessionId: string;
}

export interface SessionFeedback {
  coachRead: string;
  didWell: string;
  tryNext: string;
  improvement: string;
}

export interface CompleteSessionInput {
  skillId: string;
  levelAttempted: number;
  topicLabel: string;
  northStar: string;
  scenario: string;
  attempt1: { role: "user" | "assistant"; content: string }[];
  attempt2: { role: "user" | "assistant"; content: string }[];
  presence?: AxisScores;
}

export interface CompleteSessionResult {
  feedback: SessionFeedback;
  rewards: RewardPayload;
}

// ── Gamification state (gam_get_state → one round trip) ──────────────────────

export interface RecentSession {
  id: string;
  skill_id: string;
  level_attempted: number;
  scores: { attempt1?: AxisScores; attempt2?: AxisScores };
  composite: number;
  xp_awarded: number;
  was_challenge: boolean;
  created_at: string;
}

export interface GamificationState {
  today: string;
  paths: PathDef[];
  skills: SkillDef[];
  quests: QuestDef[];
  achievements: AchievementDef[];
  profile: Profile | null;
  stats: UserStats | null;
  skillProgress: SkillProgress[];
  todayQuests: UserQuest[];
  userAchievements: UserAchievement[];
  recentSessions: RecentSession[];
  challengeUsedToday: boolean;
}

// ── Supabase client bootstrap (anonymous-first identity) ─────────────────────

let client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: authStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/**
 * Ensure there is a signed-in user (anonymous is fine — upgradeable later) and
 * that their profiles/gam_user_stats rows exist. Returns the user id.
 */
export async function ensureSignedIn(displayName?: string): Promise<string> {
  const supabase = getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  let userId = sessionData.session?.user?.id;

  if (!userId) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      console.error(
        "[gamification] supabase.auth.signInAnonymously() failed.",
        "If the message mentions 'anonymous_provider_disabled' / 'Anonymous sign-ins are disabled',",
        "enable Anonymous sign-ins in the Supabase dashboard (Authentication → Sign In / Providers).",
        { url: SUPABASE_URL, status: (error as { status?: number } | null)?.status, error },
      );
      throw new Error(`Anonymous sign-in failed: ${error?.message ?? "no user"}`);
    }
    userId = data.user.id;
  }

  const { error: rpcError } = await supabase.rpc("gam_ensure_profile", {
    p_display_name: displayName,
  });
  if (rpcError) {
    console.error(
      "[gamification] gam_ensure_profile RPC failed.",
      "A 42501/permission error means the EXECUTE grant or an RLS policy is missing;",
      "a 42883/does-not-exist error means the gamification migrations haven't been applied.",
      {
        url: SUPABASE_URL,
        message: rpcError.message,
        code: rpcError.code,
        details: rpcError.details,
        hint: rpcError.hint,
      },
    );
    throw new Error(`gam_ensure_profile failed: ${rpcError.message}`);
  }

  return userId;
}

/** Definitions + the user's progress, stats, today's quests, achievements — one round trip. */
export async function fetchGamificationState(): Promise<GamificationState> {
  await ensureSignedIn();
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("gam_get_state");
  if (error) {
    console.error(
      "[gamification] gam_get_state RPC failed.",
      "A 42501/permission error means the EXECUTE grant or an RLS policy is missing;",
      "a 42883/does-not-exist error means the gamification migrations haven't been applied.",
      {
        url: SUPABASE_URL,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
    );
    throw new Error(`gam_get_state failed: ${error.message}`);
  }
  return data as unknown as GamificationState;
}

/**
 * Complete a training session: the complete-session edge function grades both
 * attempts and applies all rewards server-side. The returned RewardPayload is
 * the ONLY thing reward UIs may render from.
 */
export async function completeSession(
  input: CompleteSessionInput,
): Promise<CompleteSessionResult> {
  await ensureSignedIn();
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke("complete-session", {
    body: input,
  });
  if (error) throw new Error(`complete-session failed: ${error.message}`);
  if (!data?.rewards) throw new Error("complete-session returned no rewards payload");
  return data as CompleteSessionResult;
}

// ── Romance path gate ────────────────────────────────────────────────────────

export const isRomanceUnlocked = (profile: Profile | null | undefined): boolean =>
  profile?.is_adult === true;

/** One-time self-attestation ("This path contains adult dating scenarios."). */
export async function setAdultAttestation(): Promise<void> {
  await ensureSignedIn();
  const supabase = getSupabase();
  const { error } = await supabase.rpc("gam_set_adult_attestation");
  if (error) throw new Error(`gam_set_adult_attestation failed: ${error.message}`);
}

// ── Pure display helpers (unit-tested; MUST mirror the Postgres functions) ───

/** Level curve: cumulative XP to REACH level n = round(100 * n^1.5). Fresh user = level 0. */
export function levelFromXp(totalXp: number): number {
  let level = 0;
  while (Math.round(100 * Math.pow(level + 1, 1.5)) <= totalXp) level += 1;
  return level;
}

/** XP still missing to reach the next level. */
export function xpToNextLevel(totalXp: number): number {
  const next = levelFromXp(totalXp) + 1;
  return Math.round(100 * Math.pow(next, 1.5)) - totalXp;
}

/** Composite C = round(0.4*Engagement + 0.35*Comfort + 0.25*Openness). */
export const compositeOf = (s: AxisScores): number =>
  Math.round(0.4 * s.engagement + 0.35 * s.comfort + 0.25 * s.openness);

export const masteryLabel = (mastery: number): "none" | "bronze" | "silver" | "gold" =>
  mastery >= 3 ? "gold" : mastery >= 2 ? "silver" : mastery >= 1 ? "bronze" : "none";

export type ProgressMap = Record<string, Pick<SkillProgress, "mastery">>;

export const toProgressMap = (rows: SkillProgress[]): Record<string, SkillProgress> =>
  Object.fromEntries(rows.map((r) => [r.skill_id, r]));

/**
 * Unlock rules (mirror of gam_is_skill_unlocked in Postgres):
 * every path's tier 1 is free from the start; tier N opens when any same-path
 * tier N-1 skill is Bronze+; mastery>0 = already unlocked. (Romance's adult
 * gate is enforced separately in canAttempt.)
 */
export function isSkillUnlocked(
  skill: Pick<SkillDef, "id" | "path_id" | "tier">,
  skills: Pick<SkillDef, "id" | "path_id" | "tier">[],
  progress: ProgressMap,
): boolean {
  if ((progress[skill.id]?.mastery ?? 0) > 0) return true;
  if (skill.tier === 1) return true;

  return skills.some(
    (s) =>
      s.path_id === skill.path_id &&
      s.tier === skill.tier - 1 &&
      (progress[s.id]?.mastery ?? 0) >= 1,
  );
}

export type AttemptStatus =
  | "unlocked" // train normally
  | "challenge" // locked, but today's challenge attempt is available
  | "challenge-used" // locked; challenge already spent today
  | "adult-required" // Romance path without attestation
  | "locked"; // unreachable today (shouldn't happen: challenge covers locked)

export interface CanAttemptContext {
  skills: Pick<SkillDef, "id" | "path_id" | "tier">[];
  paths: Pick<PathDef, "id" | "requires_adult">[];
  progress: ProgressMap;
  isAdult: boolean;
  challengeUsedToday: boolean;
}

/**
 * Unlock + challenge rules (Brilliant-style test-out): any locked skill can be
 * attempted once per day as a challenge; Gold-threshold on that attempt
 * unlocks it immediately with full mastery. Adult gate trumps everything.
 */
export function canAttempt(
  skill: Pick<SkillDef, "id" | "path_id" | "tier">,
  ctx: CanAttemptContext,
): AttemptStatus {
  const path = ctx.paths.find((p) => p.id === skill.path_id);
  if (path?.requires_adult && !ctx.isAdult) return "adult-required";
  if (isSkillUnlocked(skill, ctx.skills, ctx.progress)) return "unlocked";
  return ctx.challengeUsedToday ? "challenge-used" : "challenge";
}

/**
 * Presence Rating: per-axis rolling average over the last 10 sessions, using
 * each session's best attempt. The "competition with your past self".
 */
export function presenceRating(
  recentSessions: Pick<RecentSession, "scores">[],
): AxisScores | null {
  const best = recentSessions
    .map((s) => {
      const a1 = s.scores?.attempt1;
      const a2 = s.scores?.attempt2;
      if (a1 && a2) return compositeOf(a2) >= compositeOf(a1) ? a2 : a1;
      return a2 ?? a1 ?? null;
    })
    .filter((x): x is AxisScores => x !== null)
    .slice(0, 10);
  if (best.length === 0) return null;
  const avg = (pick: (s: AxisScores) => number) =>
    Math.round(best.reduce((sum, s) => sum + pick(s), 0) / best.length);
  return {
    engagement: avg((s) => s.engagement),
    comfort: avg((s) => s.comfort),
    openness: avg((s) => s.openness),
  };
}