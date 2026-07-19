// Product emotion metrics derived from live face analysis (face-api.js).
// Voice prosody analysis is on the roadmap; the Hume-era mapping was removed.
//
// SHARED FILE — keep byte-identical with mobile/src/lib/emotion.ts
// (enforced by `npm run check-drift`).

export interface EmotionMetrics {
  confidence: number;   // 0..100
  anxiety: number;
  engagement: number;
  smiling: number;
  /** Top-1 raw emotion name for the small "primary" pill. */
  primaryEmotion?: string;
  primaryEmotionScore?: number;
}

/** Neutral baseline used before the first face frame arrives. */
export const NEUTRAL_METRICS: EmotionMetrics = {
  confidence: 50,
  anxiety: 0,
  engagement: 50,
  smiling: 0,
};

// ---------------------------------------------------------------------------
// Aggregation — turn a round's worth of 3-second frames into something the
// coach, the grader, and the results screen can actually reason about.
// A single last-frame snapshot is noise; averages + trend are signal.
// ---------------------------------------------------------------------------

/** The presence trio (0..100) shown to the grader and on the results screen. */
export interface PresenceRead {
  engagement: number;
  comfort: number;
  openness: number;
}

export function metricsToPresence(m: EmotionMetrics): PresenceRead {
  return { engagement: m.engagement, comfort: 100 - m.anxiety, openness: m.smiling };
}

/** Average a set of samples into one EmotionMetrics. Null when empty. */
export function averageMetrics(samples: EmotionMetrics[]): EmotionMetrics | null {
  if (samples.length === 0) return null;
  let confidence = 0, anxiety = 0, engagement = 0, smiling = 0;
  for (const s of samples) {
    confidence += s.confidence;
    anxiety += s.anxiety;
    engagement += s.engagement;
    smiling += s.smiling;
  }
  const n = samples.length;
  return {
    confidence: Math.round(confidence / n),
    anxiety: Math.round(anxiety / n),
    engagement: Math.round(engagement / n),
    smiling: Math.round(smiling / n),
  };
}

/**
 * Compare the first and second half of a round: did the trainee settle in
 * (anxiety fell) or tense up (anxiety rose)? Null when too few frames.
 */
export function comfortTrend(
  samples: EmotionMetrics[]
): "settling" | "tensing" | "steady" | null {
  if (samples.length < 4) return null;
  const half = Math.floor(samples.length / 2);
  const first = averageMetrics(samples.slice(0, half));
  const second = averageMetrics(samples.slice(half));
  if (!first || !second) return null;
  const d = second.anxiety - first.anxiety;
  if (d <= -8) return "settling";
  if (d >= 8) return "tensing";
  return "steady";
}

/**
 * One-line camera summary for prompt injection (fed to the coach alongside
 * the transcript — never read aloud verbatim). Null when no frames captured.
 */
export function describeCameraRead(label: string, samples: EmotionMetrics[]): string | null {
  const avg = averageMetrics(samples);
  if (!avg) return null;
  const trend = comfortTrend(samples);
  const trendNote =
    trend === "settling" ? " — they visibly settled in as the round went on"
    : trend === "tensing" ? " — they visibly tensed up as the round went on"
    : "";
  return `Camera read during ${label} (averaged over ${samples.length} frames): confidence ${avg.confidence}%, anxiety ${avg.anxiety}%, engagement ${avg.engagement}%, smiling ${avg.smiling}%${trendNote}.`;
}
