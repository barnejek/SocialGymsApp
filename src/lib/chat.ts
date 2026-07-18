// NOTE: "sonner" is a web-only toast library and is not installed in the
// mobile project. We log instead; swap in a native toast (e.g. burnt or
// react-native-toast-message) when this client goes live.
import { DEMO_MODE } from "./utils";

const toast = {
  error: (msg: string) => console.warn("[SocialGyms]", msg),
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const API_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://b2b-placeholder-url.supabase.co";
const SCORE_URL = `${API_URL}/functions/v1/score-conversation`;

export interface ScoreResult {
  attempt1: { engagement: number; comfort: number; openness: number };
  attempt2: { engagement: number; comfort: number; openness: number };
  coachRead: string;
  didWell: string;
  tryNext: string;
  improvement: string;
}

// DEMO_MODE scripted result — the before/after lift matches the demo
// transcript's story (see lib/mockBackend.ts).
const DEMO_SCORE: ScoreResult = {
  attempt1: { engagement: 58, comfort: 47, openness: 52 },
  attempt2: { engagement: 82, comfort: 71, openness: 78 },
  coachRead:
    "Round one you opened cleanly but retreated to small talk when Jordan cracked the door open. Round two you mirrored, labeled, and let the silence work — Jordan did the opening up for you.",
  didWell:
    "You used Jordan's name, asked a genuinely curious question, and in round two you landed a textbook label: 'it seems like you were the one who had to say no.'",
  tryNext:
    "When someone gives you a short answer, mirror their last three words and wait a full beat before adding anything.",
  improvement:
    "You stopped filling silences. Round one you rescued the pause with coffee talk; round two you held it, and the conversation deepened on its own.",
};

export async function scoreConversation(input: {
  topicLabel: string;
  northStar: string;
  scenario: string;
  attempt1: ChatMessage[];
  attempt2: ChatMessage[];
  /** Live multimodal read (0-100) from the camera — weighted lightly by the grader. */
  presence?: { engagement: number; comfort: number; openness: number };
}): Promise<ScoreResult | null> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 1200)); // believable grading beat
    return DEMO_SCORE;
  }
  try {
    const resp = await fetch(SCORE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(input),
    });
    if (!resp.ok) {
      if (resp.status === 429) toast.error("Coach is busy — try again in a moment.");
      else if (resp.status === 402) toast.error("AI credits exhausted.");
      else toast.error("Couldn't score your session.");
      return null;
    }
    return (await resp.json()) as ScoreResult;
  } catch {
    toast.error("Couldn't score your session.");
    return null;
  }
}
