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

import type { TrinityPhase } from './phases';
import type { ScoreResult } from './chat';

// Who is "speaking" a line. The golden rule, no exceptions:
//   COACH talking -> LEFT side, voice A.  speakers: 'coach' | 'partner' | 'self'
//   USER talking  -> RIGHT side, voice B, orange.  speaker: 'you'
//
// 'partner' = the COACH playing Jordan (left / voice A). Used ONLY in phases 2
// and 5. In phase 4 the USER plays Jordan, so those lines are tagged 'you'
// (right / orange / voice B), never 'partner'.
// 'self' = the COACH playing Alex in the phase-4 reversal (left / voice A).
// 'you'  = whatever character the trainee voices (Alex in 2 & 5, Jordan in 4).
export type DemoSpeaker = 'coach' | 'partner' | 'self' | 'you';

export interface DemoScriptEntry {
  /** Stable id for pre-rendered audio files (assets/audio/demo/{id}.mp3). */
  id: string;
  role: 'assistant' | 'user';
  content: string;
  // Which voice + side to use. See DemoSpeaker above.
  speaker?: DemoSpeaker;
  // Optional label override shown above the bubble (e.g. "You · as Jordan").
  name?: string;
  // Which of the six Trinity phases this line belongs to. Drives the progress
  // bar and the phase label as the script plays (the demo is script-driven).
  phase: TrinityPhase;
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
    id: 'line-01',
    role: 'assistant',
    speaker: 'coach',
    phase: 'phase-1-setup',
    content: "Welcome to your Trinity coaching session. Today we're working on one of the highest-leverage social skills: starting a genuine conversation with someone you've never met at a professional event. I'll play Jordan, a fellow attendee. In this first round, just try your natural approach. No pressure, no feedback yet. Whenever you're ready, go ahead.",
    delayAfterMs: 1400,
  },
  // Phase 2: First Attempt
  { id: 'line-02', role: 'user', speaker: 'you', phase: 'phase-2-convo-1', content: "Hi, I'm Alex. Nice to meet you.", delayAfterMs: 500 },
  { id: 'line-03', role: 'assistant', speaker: 'partner', phase: 'phase-2-convo-1', content: "Hey! Jordan. You here for the keynote?", delayAfterMs: 600 },
  { id: 'line-04', role: 'user', speaker: 'you', phase: 'phase-2-convo-1', content: "Yeah, I am.", delayAfterMs: 500 },
  { id: 'line-05', role: 'assistant', speaker: 'partner', phase: 'phase-2-convo-1', content: "Cool. What do you do?", delayAfterMs: 600 },
  { id: 'line-06', role: 'user', speaker: 'you', phase: 'phase-2-convo-1', content: "I'm a product manager at a tech startup.", delayAfterMs: 500 },
  { id: 'line-07', role: 'assistant', speaker: 'partner', phase: 'phase-2-convo-1', content: "Oh nice. Well, great meeting you.", delayAfterMs: 1800 },
  // Phase 3: Feedback
  {
    id: 'line-08',
    role: 'assistant',
    speaker: 'coach',
    phase: 'phase-3-feedback-1',
    content: "Good first attempt. You introduced yourself clearly, that's the foundation. But the conversation stalled because your answers were closed: short, with nothing for Jordan to grab onto. The research is clear: rapport builds fastest when you answer AND ask back. When Jordan asked what you do, try: Product at a startup, we build AI coaching tools. What brings you here today? That single pivot keeps the momentum alive. Now let me show you how I'd handle this.",
    delayAfterMs: 1600,
  },
  // Phase 4: Reversal. Roles swap: the COACH plays Alex (left / voice A, the
  // coach starts) and the USER plays Jordan (right / orange / voice B).
  { id: 'line-09', role: 'assistant', speaker: 'coach', phase: 'phase-4-reversal', content: "Now let's swap. I'll be you, Alex, and you play Jordan. Watch how I'd open it.", delayAfterMs: 800 },
  { id: 'line-10', role: 'assistant', speaker: 'self', phase: 'phase-4-reversal', content: "Hey Jordan, I'm Alex. What brought you out today?", delayAfterMs: 600 },
  { id: 'line-11', role: 'user', speaker: 'you', name: 'You · as Jordan', phase: 'phase-4-reversal', content: "Mostly staying on top of the space. You?", delayAfterMs: 600 },
  {
    id: 'line-12',
    role: 'assistant',
    speaker: 'self',
    phase: 'phase-4-reversal',
    content: "Same, and I'm curious about the AI tools panel specifically. We're building something adjacent at my company. Are you more on the tech side or operations?",
    delayAfterMs: 700,
  },
  { id: 'line-13', role: 'user', speaker: 'you', name: 'You · as Jordan', phase: 'phase-4-reversal', content: "Tech, yeah. That panel sounds interesting actually.", delayAfterMs: 1000 },
  {
    id: 'line-14',
    role: 'assistant',
    speaker: 'coach',
    phase: 'phase-4-reversal',
    content: "See the structure? I shared my stake before asking about Jordan. Two questions, one moment of vulnerability, and Jordan is now leaning in. Your turn.",
    delayAfterMs: 1600,
  },
  // Phase 5: Second Attempt
  { id: 'line-15', role: 'user', speaker: 'you', phase: 'phase-5-convo-2', content: "Hey Jordan! Alex. What brings you here today?", delayAfterMs: 500 },
  { id: 'line-16', role: 'assistant', speaker: 'partner', phase: 'phase-5-convo-2', content: "Networking mostly, trying to meet people building interesting things. You?", delayAfterMs: 600 },
  {
    id: 'line-17',
    role: 'user',
    speaker: 'you',
    phase: 'phase-5-convo-2',
    content: "I'm here for the AI tools panel. We're actually building something in that space. Are you on the tech side?",
    delayAfterMs: 500,
  },
  { id: 'line-18', role: 'assistant', speaker: 'partner', phase: 'phase-5-convo-2', content: "I am, yeah. What kind of tools are you building?", delayAfterMs: 600 },
  { id: 'line-19', role: 'user', speaker: 'you', phase: 'phase-5-convo-2', content: "Communication coaching, using AI to help people improve social skills.", delayAfterMs: 500 },
  { id: 'line-20', role: 'assistant', speaker: 'partner', phase: 'phase-5-convo-2', content: "Oh that's fascinating. Is it for individuals or teams?", delayAfterMs: 1600 },
  // Phase 6: Final Debrief
  {
    id: 'line-21',
    role: 'assistant',
    speaker: 'coach',
    phase: 'phase-6-final',
    content: "That's your Golden Rule for today: share a stake, then ask. When you give someone a window into what you care about before asking about them, you turn a transaction into a connection. Your scores climbed significantly in that second round, engagement, comfort, openness all up. Practice this with one real person this week. Same structure: context, then curiosity.",
    delayAfterMs: 1200,
  },
];

// Golden Rule + scoring shown on the results screen. In the live build these
// come from the scoring edge function; in the pitch demo they are fixed so the
// before/after story lands identically every run.
export const DEMO_GOLDEN_RULE = "Share a stake, then ask. Give someone a window into what you care about before asking about them -- it turns a transaction into a connection.";

export const DEMO_SCORE_RESULT: ScoreResult = {
  attempt1: { engagement: 38, comfort: 44, openness: 36 },
  attempt2: { engagement: 74, comfort: 80, openness: 69 },
  coachRead:
    "You walked in introducing yourself cleanly -- that's a real strength. The first round stalled because your answers closed the loop instead of opening it. The second round was a different conversation entirely: you led with a stake, then handed Jordan a question, and the energy flipped.",
  didWell:
    "Clear, warm self-introduction. By the second attempt you were sharing context before asking, and your questions were specific rather than generic.",
  tryNext:
    "Carry the 'stake, then ask' move into a real conversation this week. One small disclosure about why you're there is usually enough to unlock the other person.",
  improvement:
    "Engagement and openness nearly doubled between attempts, and your comfort climbed as the closed, one-word answers gave way to genuine back-and-forth.",
};

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
