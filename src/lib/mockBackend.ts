export type UserPersona = 'b2c_user' | 'b2b_autism_user' | 'b2b_educator';

export interface UserProfile {
  id: string;
  persona: UserPersona;
  name: string;
  company?: string;
  autismProfile?: {
    sensoryProfile: 'seek' | 'avoid' | 'mixed';
    communicationStyle: 'glp' | 'analytical' | 'mixed';
    iepGoals: string[];
  };
}

// ---------------------------------------------------------------------------
// DEMO_MODE assets (see lib/utils.ts): a scripted 6-phase Trinity session that
// plays back through the real phase machine + timers, and a fake emotion
// timeline for the gauges. The coach lines include the exact sentinel phrases
// ("Whenever you're ready, go ahead." / "Now let me show you how I'd handle
// this." / "Your Golden Rule is this:") so phase transitions fire for real.
// ---------------------------------------------------------------------------

export interface DemoScriptLine {
  /** coach = out-of-character Alex · partner = scene counterpart · self = Alex playing the user's side · you = the user. */
  speaker: 'coach' | 'partner' | 'self' | 'you';
  text: string;
  /** Pause before this line starts (after the previous one finished). */
  preDelayMs: number;
}

/** Keyed by phase number 1–6 (parsed from the system prompt's "PHASE N" header). */
export const DEMO_SCRIPT: Record<number, DemoScriptLine[]> = {
  1: [
    {
      speaker: 'coach',
      preDelayMs: 400,
      text: "Welcome — let's set the scene. We train one rep at a time; that's how deliberate practice works. Today's rep: opening a conversation and keeping it alive.",
    },
    {
      speaker: 'coach',
      preDelayMs: 900,
      text: "Here's the scene. You're at your company's product off-site. Jordan from the design team — who you've never actually met — is standing alone by the coffee table. Their team just demoed the new onboarding flow this morning, and it landed well. Your goal is to open the conversation and keep it moving for one minute. I'll play Jordan; you play yourself. Whenever you're ready, go ahead.",
    },
  ],
  2: [
    { speaker: 'you', preDelayMs: 2600, text: "Hey — Jordan, right? I don't think we've actually met. I'm Alex." },
    { speaker: 'partner', preDelayMs: 1200, text: "Oh — hey. Yeah, Jordan. Design team." },
    { speaker: 'you', preDelayMs: 2400, text: 'I caught the onboarding demo this morning. That was your team?' },
    { speaker: 'partner', preDelayMs: 1300, text: 'It was, yeah. Six weeks of work for a four-minute demo.' },
    { speaker: 'you', preDelayMs: 2800, text: 'Four minutes felt smooth, though. What was the hardest part to get right?' },
    { speaker: 'partner', preDelayMs: 1400, text: 'Honestly? Convincing everyone to cut features. Everyone wants their thing in the flow.' },
    { speaker: 'you', preDelayMs: 2600, text: 'So you were the one saying no all week.' },
    { speaker: 'partner', preDelayMs: 1200, text: 'Pretty much. Someone has to.' },
    { speaker: 'you', preDelayMs: 3200, text: 'Well… it worked. Anyway, good coffee, huh?' },
    { speaker: 'partner', preDelayMs: 1400, text: "Ha — it's fine. Conference coffee. You know how it is." },
  ],
  3: [
    {
      speaker: 'coach',
      preDelayMs: 600,
      text: "Okay, let's freeze it there. Two things you did genuinely well: you opened with a name and a self-introduction — 'Jordan, right? I'm Alex' — clean, low-pressure opener. And your question about the hardest part was real curiosity, and Jordan opened right up on it.",
    },
    {
      speaker: 'coach',
      preDelayMs: 800,
      text: "One thing to change. When Jordan said 'someone has to', you had the door wide open — and you stepped back to the coffee. Next round, label it: try 'It seems like you ended up carrying that fight alone.' One label, then wait. Now let me show you how I'd handle this.",
    },
  ],
  4: [
    {
      speaker: 'self',
      preDelayMs: 800,
      text: "Now let's switch — I'll play your side, and you play Jordan. Hey — Jordan, right? I'm Alex. I've been meaning to say: that onboarding demo was the smoothest thing all morning.",
    },
    { speaker: 'you', preDelayMs: 2400, text: 'Oh — thanks. Six weeks of work for four minutes on stage.' },
    { speaker: 'self', preDelayMs: 1400, text: "Six weeks for four minutes. It seems like there's a story behind that." },
    { speaker: 'you', preDelayMs: 2600, text: 'Ha — mostly fighting about what to cut, honestly.' },
    { speaker: 'self', preDelayMs: 1400, text: 'Fighting about what to cut… sounds like you were the one holding the line.' },
    { speaker: 'you', preDelayMs: 2400, text: 'Pretty much, yeah. Someone has to.' },
    {
      speaker: 'self',
      preDelayMs: 1600,
      text: "It seems like you ended up carrying that fight alone. For what it's worth — it showed. The flow felt like one person's taste, in the best way.",
    },
    { speaker: 'you', preDelayMs: 2600, text: '…Thanks. That is exactly what it felt like, actually.' },
  ],
  5: [
    {
      speaker: 'coach',
      preDelayMs: 600,
      text: "Okay — back to how we started. You're you, I'm Jordan. Go for it.",
    },
    { speaker: 'you', preDelayMs: 7000, text: 'Hey Jordan — I never got to ask. The onboarding demo this morning, that was your team?' },
    { speaker: 'partner', preDelayMs: 2000, text: 'Oh, hey again. Yeah — six weeks of our lives.' },
    { speaker: 'you', preDelayMs: 7500, text: 'Six weeks of your lives… for four minutes on stage.' },
    { speaker: 'partner', preDelayMs: 2200, text: 'Right? Nobody sees the twelve versions we killed to get there.' },
    { speaker: 'you', preDelayMs: 8000, text: 'Twelve versions. It seems like you were the one who had to say no most of the time.' },
    { speaker: 'partner', preDelayMs: 2500, text: "…Yeah, actually. That's exactly how it went. Everyone wants their feature in the flow." },
    { speaker: 'you', preDelayMs: 8500, text: "That sounds like a lonely job. For what it's worth, the final cut felt really clean." },
    { speaker: 'partner', preDelayMs: 2200, text: "Thanks. Honestly — that's nice to hear. Most people just ask when the next version ships." },
    { speaker: 'you', preDelayMs: 8000, text: 'Ha. So… when does the next version ship?' },
    { speaker: 'partner', preDelayMs: 2000, text: 'Ha! Okay, you earned that one. March, if the roadmap survives.' },
    { speaker: 'you', preDelayMs: 8500, text: "March. I'll hold you to it. Good talking to you, Jordan — actually talking, this time." },
    { speaker: 'partner', preDelayMs: 2200, text: 'Likewise. Come find me at the next one of these.' },
  ],
  6: [
    {
      speaker: 'coach',
      preDelayMs: 700,
      text: "Here's what I saw across the whole session. Round one, you opened well — but when Jordan said 'someone has to', you moved past it to the coffee. Round two, you mirrored — 'six weeks of your lives' — and then landed the label: 'it seems like you were the one who had to say no.' Jordan's whole posture changed on that line.",
    },
    {
      speaker: 'coach',
      preDelayMs: 900,
      text: 'Biggest improvement: you stopped filling silences and let your questions breathe. In real life, that is the difference between an exchange and a connection.',
    },
    {
      speaker: 'coach',
      preDelayMs: 900,
      text: 'Homework: this week, when someone gives you a short answer, mirror their last three words and wait. Your Golden Rule is this: Curiosity opens the door; a label invites them through.',
    },
  ],
};

/** Emotion keyframes across the ~6-minute demo session (ms from session start). */
const DEMO_METRIC_KEYFRAMES: {
  atMs: number;
  confidence: number;
  anxiety: number;
  engagement: number;
  smiling: number;
}[] = [
  { atMs: 0, confidence: 42, anxiety: 48, engagement: 50, smiling: 18 },
  { atMs: 30_000, confidence: 40, anxiety: 58, engagement: 55, smiling: 15 }, // first attempt starts — nerves up
  { atMs: 75_000, confidence: 46, anxiety: 52, engagement: 62, smiling: 28 },
  { atMs: 120_000, confidence: 55, anxiety: 40, engagement: 68, smiling: 38 }, // feedback lands
  { atMs: 180_000, confidence: 62, anxiety: 32, engagement: 74, smiling: 46 }, // watching the demo
  { atMs: 240_000, confidence: 68, anxiety: 28, engagement: 80, smiling: 55 }, // second attempt — in the pocket
  { atMs: 330_000, confidence: 75, anxiety: 22, engagement: 84, smiling: 64 },
  { atMs: 420_000, confidence: 78, anxiety: 20, engagement: 85, smiling: 60 },
];

/** Interpolated demo metrics at a given elapsed time, with a gentle wobble so the gauges look alive. */
export function demoMetricsAt(elapsedMs: number): {
  confidence: number;
  anxiety: number;
  engagement: number;
  smiling: number;
  primaryEmotion: string;
  primaryEmotionScore: number;
} {
  const kf = DEMO_METRIC_KEYFRAMES;
  const t = Math.max(0, Math.min(elapsedMs, kf[kf.length - 1].atMs));
  let i = 0;
  while (i < kf.length - 2 && kf[i + 1].atMs <= t) i++;
  const a = kf[i];
  const b = kf[i + 1];
  const f = (t - a.atMs) / Math.max(1, b.atMs - a.atMs);
  const wobble = (phase: number) => Math.sin(elapsedMs / 4200 + phase) * 3;
  const mix = (ka: number, kb: number, phase: number) =>
    Math.round(Math.max(0, Math.min(100, ka + (kb - ka) * f + wobble(phase))));

  const metrics = {
    confidence: mix(a.confidence, b.confidence, 0),
    anxiety: mix(a.anxiety, b.anxiety, 2),
    engagement: mix(a.engagement, b.engagement, 4),
    smiling: mix(a.smiling, b.smiling, 6),
  };
  const primaryEmotion = metrics.smiling > 45 ? 'happy' : metrics.anxiety > 50 ? 'fearful' : 'neutral';
  return {
    ...metrics,
    primaryEmotion,
    primaryEmotionScore: Math.max(metrics.smiling, 100 - metrics.anxiety, 50),
  };
}

export const MOCK_USERS: Record<UserPersona, UserProfile> = {
  'b2c_user': {
    id: 'user_1',
    persona: 'b2c_user',
    name: 'Alex (B2C Pro)',
  },
  'b2b_autism_user': {
    id: 'user_2',
    persona: 'b2b_autism_user',
    name: 'Sam (Autism Module)',
    company: 'New Hope Clinic',
    autismProfile: {
      sensoryProfile: 'avoid',
      communicationStyle: 'glp',
      iepGoals: ['Initiate greetings', 'Request breaks calmly']
    }
  },
  'b2b_educator': {
    id: 'user_3',
    persona: 'b2b_educator',
    name: 'Dr. Sarah (Educator)',
    company: 'New Hope Clinic',
  }
};
