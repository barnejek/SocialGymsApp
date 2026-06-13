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

// ── Demo Mode ────────────────────────────────────────────────────────────────

// Who is "speaking" an assistant line. Drives a distinct TTS voice so the
// coach's narration sounds different from the role-play partner (Jordan) and
// from the coach modelling the user ("self"). User lines aren't spoken.
export type DemoSpeaker = 'coach' | 'partner' | 'self';

export interface DemoScriptEntry {
  role: 'assistant' | 'user';
  content: string;
  // Which voice to use for assistant lines. Defaults to 'coach'.
  speaker?: DemoSpeaker;
  // How long to wait (ms) after this message before streaming the next one.
  delayAfterMs?: number;
}

export interface DemoMetricsKeyframe {
  timeMs: number;
  // All values 0-100.
  engagement: number;
  confidence: number;
  anxiety: number;
  smiling: number;
}

// Scripted Trinity session for "Networking at an industry event".
// Mirrors the 6-phase structure: Setup -> Convo 1 -> Feedback -> Reversal -> Convo 2 -> Final.
// Assistant messages stream word-by-word at ~80 ms/word; user lines appear instantly.
export const DEMO_SCRIPT: DemoScriptEntry[] = [
  // Phase 1: Setup
  {
    role: 'assistant',
    speaker: 'coach',
    content: "Welcome to your Trinity coaching session. Today we're working on one of the highest-leverage social skills: starting a genuine conversation with someone you've never met at a professional event. I'll play Jordan, a fellow attendee. In this first round, just try your natural approach. No pressure, no feedback yet. Whenever you're ready, go ahead.",
    delayAfterMs: 2500,
  },
  // Phase 2: First Attempt
  { role: 'user', content: "Hi, I'm Alex. Nice to meet you.", delayAfterMs: 700 },
  { role: 'assistant', speaker: 'partner', content: "Hey! Jordan. You here for the keynote?", delayAfterMs: 1000 },
  { role: 'user', content: "Yeah, I am.", delayAfterMs: 700 },
  { role: 'assistant', speaker: 'partner', content: "Cool. What do you do?", delayAfterMs: 900 },
  { role: 'user', content: "I'm a product manager at a tech startup.", delayAfterMs: 800 },
  { role: 'assistant', speaker: 'partner', content: "Oh nice. Well, great meeting you.", delayAfterMs: 3500 },
  // Phase 3: Feedback
  {
    role: 'assistant',
    speaker: 'coach',
    content: "Good first attempt. You introduced yourself clearly, that's the foundation. But the conversation stalled because your answers were closed: short, with nothing for Jordan to grab onto. The research is clear: rapport builds fastest when you answer AND ask back. When Jordan asked what you do, try: 'Product at a startup, we build AI coaching tools. What brings you here today?' That single pivot keeps the momentum alive. Ready to see what it looks like? Now let me show you how I'd handle this.",
    delayAfterMs: 3500,
  },
  // Phase 4: Reversal
  { role: 'assistant', speaker: 'coach', content: "Watch me model this. I'll play you.", delayAfterMs: 1200 },
  { role: 'assistant', speaker: 'self', content: "Hey Jordan, I'm Alex. What brought you out today?", delayAfterMs: 1000 },
  { role: 'assistant', speaker: 'partner', content: "Mostly staying on top of the space. You?", delayAfterMs: 900 },
  {
    role: 'assistant',
    speaker: 'self',
    content: "Same, and I'm curious about the AI tools panel specifically. We're building something adjacent at my company. Are you more on the tech side or operations?",
    delayAfterMs: 1200,
  },
  { role: 'assistant', speaker: 'partner', content: "Tech, yeah. That panel sounds interesting actually.", delayAfterMs: 1800 },
  {
    role: 'assistant',
    speaker: 'coach',
    content: "See the structure? I shared my stake before asking about Jordan. Two questions, one moment of vulnerability, and Jordan is now leaning in. Your turn.",
    delayAfterMs: 3000,
  },
  // Phase 5: Second Attempt
  { role: 'user', content: "Hey Jordan! Alex. What brings you here today?", delayAfterMs: 700 },
  { role: 'assistant', speaker: 'partner', content: "Networking mostly, trying to meet people building interesting things. You?", delayAfterMs: 1000 },
  {
    role: 'user',
    content: "I'm here for the AI tools panel. We're actually building something in that space. Are you on the tech side?",
    delayAfterMs: 700,
  },
  { role: 'assistant', speaker: 'partner', content: "I am, yeah. What kind of tools are you building?", delayAfterMs: 900 },
  { role: 'user', content: "Communication coaching, using AI to help people improve social skills.", delayAfterMs: 700 },
  { role: 'assistant', speaker: 'partner', content: "Oh that's fascinating. Is it for individuals or teams?", delayAfterMs: 3000 },
  // Phase 6: Final Debrief
  {
    role: 'assistant',
    speaker: 'coach',
    content: "That's your Golden Rule for today: share a stake, then ask. When you give someone a window into what you care about before asking about them, you turn a transaction into a connection. Your scores climbed significantly in that second round, engagement, comfort, openness all up. Practice this with one real person this week. Same structure: context, then curiosity.",
    delayAfterMs: 2000,
  },
];

// Emotion-metric keyframes for the demo session.
// Interpolated every 200 ms to drive the EmotionPanel gauges.
// Designed to show clear before/after improvement across Convo 1 -> Convo 2.
export const DEMO_EMOTION_TIMELINE: DemoMetricsKeyframe[] = [
  { timeMs: 0,      engagement: 28, confidence: 34, anxiety: 52, smiling: 20 },
  { timeMs: 25000,  engagement: 38, confidence: 37, anxiety: 47, smiling: 25 },
  { timeMs: 70000,  engagement: 42, confidence: 39, anxiety: 44, smiling: 28 },
  { timeMs: 105000, engagement: 38, confidence: 42, anxiety: 40, smiling: 30 },
  { timeMs: 160000, engagement: 54, confidence: 52, anxiety: 34, smiling: 38 },
  { timeMs: 200000, engagement: 66, confidence: 62, anxiety: 27, smiling: 48 },
  { timeMs: 260000, engagement: 74, confidence: 69, anxiety: 20, smiling: 58 },
  { timeMs: 330000, engagement: 76, confidence: 72, anxiety: 18, smiling: 62 },
];

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
