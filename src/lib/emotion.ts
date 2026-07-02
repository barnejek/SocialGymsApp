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
