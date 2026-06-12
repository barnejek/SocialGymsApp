// Maps Hume voice prosody scores → our 4 product metrics (Confidence, Anxiety, Engagement, Smiling).
// Same shape as face-derived metrics so they can be averaged.

export interface EmotionMetrics {
  confidence: number;   // 0..100
  anxiety: number;
  engagement: number;
  smiling: number;
  /** Top-1 raw emotion name for the small "primary" pill. */
  primaryEmotion?: string;
  primaryEmotionScore?: number;
}

const get = (scores: Record<string, number>, name: string) => scores[name] ?? 0;

export function prosodyToMetrics(rawScores: Record<string, number>): EmotionMetrics {
  const smiling = Math.min(1, get(rawScores, "Joy") * 0.6 + get(rawScores, "Amusement") * 0.25 + get(rawScores, "Contentment") * 0.2);

  const confPos =
    get(rawScores, "Pride") * 0.45 +
    get(rawScores, "Determination") * 0.3 +
    get(rawScores, "Concentration") * 0.2 +
    get(rawScores, "Interest") * 0.15;
  const confNeg =
    get(rawScores, "Doubt") * 0.5 +
    get(rawScores, "Embarrassment") * 0.35 +
    get(rawScores, "Awkwardness") * 0.4 +
    get(rawScores, "Confusion") * 0.25;
  const confidence = Math.max(0, Math.min(1, 0.45 + confPos - confNeg));

  const anxiety = Math.min(1,
    get(rawScores, "Anxiety") * 0.5 +
    get(rawScores, "Fear") * 0.25 +
    get(rawScores, "Distress") * 0.25 +
    get(rawScores, "Awkwardness") * 0.25,
  );

  const engPos =
    get(rawScores, "Interest") * 0.45 +
    get(rawScores, "Concentration") * 0.3 +
    get(rawScores, "Excitement") * 0.25;
  const engNeg = get(rawScores, "Boredom") * 0.4 + get(rawScores, "Tiredness") * 0.3;
  const engagement = Math.max(0, Math.min(1, 0.4 + engPos - engNeg));

  let topName = "";
  let topScore = 0;
  for (const [name, score] of Object.entries(rawScores)) {
    if (score > topScore) { topScore = score; topName = name; }
  }

  return {
    confidence: Math.round(confidence * 100),
    anxiety: Math.round(anxiety * 100),
    engagement: Math.round(engagement * 100),
    smiling: Math.round(smiling * 100),
    primaryEmotion: topName,
    primaryEmotionScore: Math.round(topScore * 100),
  };
}

/** Average two metric snapshots — used when fusing face + voice. */
export function fuseMetrics(face: EmotionMetrics | null, voice: EmotionMetrics | null): EmotionMetrics {
  if (face && !voice) return face;
  if (voice && !face) return voice;
  if (!face || !voice) return { confidence: 50, anxiety: 0, engagement: 50, smiling: 0 };
  const avg = (a: number, b: number) => Math.round((a + b) / 2);
  // Pick the higher-confidence primary emotion (whichever has the larger top score).
  const primary = (voice.primaryEmotionScore ?? 0) > (face.primaryEmotionScore ?? 0) ? voice : face;
  return {
    confidence: avg(face.confidence, voice.confidence),
    anxiety: avg(face.anxiety, voice.anxiety),
    engagement: avg(face.engagement, voice.engagement),
    smiling: avg(face.smiling, voice.smiling),
    primaryEmotion: primary.primaryEmotion,
    primaryEmotionScore: primary.primaryEmotionScore,
  };
}
