import { toast } from "sonner";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type TutorMode = "scenario" | "partner" | "feedback" | "masterclass" | "transition";

export interface StreamChatArgs {
  mode: TutorMode;
  topicLabel: string;
  scenarioSeed?: string;
  northStar?: string;
  scenario?: string;
  messages: ChatMessage[];
  attempt1Transcript?: ChatMessage[];
  onDelta: (chunk: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}

const API_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://b2b-placeholder-url.supabase.co";
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key";
const CHAT_URL = `${API_URL}/functions/v1/chat-with-alex`;
const SCORE_URL = `${API_URL}/functions/v1/score-conversation`;

export async function streamChatWithAlex(args: StreamChatArgs) {
  const {
    onDelta, onDone, signal,
    mode, topicLabel, scenarioSeed, northStar, scenario,
    messages, attempt1Transcript,
  } = args;

  let resp: Response;
  try {
    resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        mode, topicLabel, scenarioSeed, northStar, scenario,
        messages, attempt1Transcript,
      }),
      signal,
    });
  } catch {
    toast.error("Couldn't reach your coach right now. Check your connection.");
    onDone();
    return;
  }

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) toast.error("Slow down a touch — too many requests.");
    else if (resp.status === 402) toast.error("AI credits exhausted. Add funds to keep training.");
    else toast.error("Coach went quiet for a moment. Try again.");
    onDone();
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

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
