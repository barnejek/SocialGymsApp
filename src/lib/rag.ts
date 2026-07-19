/**
 * Client helpers for Corpus A RAG — classify Attempt-1 gaps, then retrieve
 * a grounded Technique Card before Phase 3 (and reuse through Phase 4/6).
 *
 * Failures are soft: sessions continue without grounded technique rather than
 * blocking the phase machine on a network blip.
 *
 * Platform note: env vars use EXPO_PUBLIC_* (mobile); logic mirrors web src/lib/rag.ts.
 */

import type { ChatMessage } from "./chat";
import type { RetrievedContext, TechniqueCard } from "./trinity";

const BASE = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export type AgeVariant = "adult" | "child";

export interface ClassifyGapResult {
  gapTags: string[];
}

export interface RetrieveContextResult extends RetrievedContext {
  techniqueCards?: TechniqueCard[];
  gapTags?: string[];
}

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  if (!BASE || !ANON) {
    console.warn("[rag] Supabase env missing — skipping", path);
    return null;
  }
  try {
    const resp = await fetch(`${BASE}/functions/v1/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON}`,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      console.warn(`[rag] ${path} failed:`, resp.status, await resp.text());
      return null;
    }
    return (await resp.json()) as T;
  } catch (e) {
    console.warn(`[rag] ${path} error:`, e);
    return null;
  }
}

export async function classifyGap(input: {
  subSkill: string;
  transcript: ChatMessage[] | string;
}): Promise<string[]> {
  const data = await postJson<ClassifyGapResult>("classify-gap", input);
  return data?.gapTags?.length ? data.gapTags : [];
}

export async function retrieveContext(input: {
  topicId: string;
  subSkill: string;
  gapTags?: string[];
  ageVariant?: AgeVariant;
  phase: string;
  userId?: string;
}): Promise<RetrieveContextResult | null> {
  return postJson<RetrieveContextResult>("retrieve-context", input);
}

/**
 * Phase 2→3 pipeline: classify gaps on Attempt 1, then retrieve the best card.
 * Returns a RetrievedContext suitable for PhaseContext.retrieved.
 */
export async function fetchGroundedTechnique(input: {
  topicId: string;
  subSkill: string;
  attempt1: ChatMessage[];
  ageVariant?: AgeVariant;
  phase?: string;
}): Promise<RetrievedContext> {
  const gapTags = await classifyGap({
    subSkill: input.subSkill,
    transcript: input.attempt1,
  });

  const retrieved = await retrieveContext({
    topicId: input.topicId,
    subSkill: input.subSkill,
    gapTags,
    ageVariant: input.ageVariant ?? "adult",
    phase: input.phase ?? "phase-3-feedback-1",
  });

  if (!retrieved) {
    return { gapTags };
  }

  return {
    techniqueCard: retrieved.techniqueCard ?? null,
    continuity: retrieved.continuity ?? null,
    citation: retrieved.citation ?? null,
    gapTags: retrieved.gapTags ?? gapTags,
  };
}
