// NOTE: "sonner" is a web-only toast library and is not installed in the
// mobile project. We log instead; swap in a native toast (e.g. burnt or
// react-native-toast-message) when this client goes live.
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

export async function scoreConversation(input: {
  topicLabel: string;
  northStar: string;
  scenario: string;
  attempt1: ChatMessage[];
  attempt2: ChatMessage[];
  /** Live multimodal read (0-100) from the camera — weighted lightly by the grader. */
  presence?: { engagement: number; comfort: number; openness: number };
}): Promise<ScoreResult | null> {
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
