// Social Gyms training topics. Each topic is a *theme*; the AI tutor invents
// a concrete scenario at session start.

export type TopicId =
  | "meeting-new-people"
  | "difficult-conversations"
  | "speaking-up"
  | "small-talk"
  | "playground-rules"
  | "loud-noises"
  | "routine-change"
  | "de-escalation"
  | "constructive-feedback"
  | "iep-meeting";

export interface Topic {
  id: TopicId;
  label: string;
  shortLabel: string;
  description: string;
  tag: string;
  icon: string;
  persona: 'b2c_user' | 'b2b_autism_user' | 'b2b_educator';
  /** Used by the tutor to invent a fresh micro-scenario for this topic. */
  scenarioSeed: string;
  /** What "good" looks like — fed to the coach prompt for grading. */
  northStar: string;
  /** The ONE observable behavior trained this session (deliberate practice). */
  subSkill: string;
}

export const topics: Topic[] = [
  {
    id: "meeting-new-people",
    label: "Meeting new people",
    shortLabel: "Meeting new people",
    description: "Cold intros, parties, mixers, conferences — those first 60 seconds.",
    tag: "Confidence builder",
    icon: "users",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a casual situation where the user has to initiate contact with someone they've never met (e.g. at a conference coffee break, at a friend-of-a-friend's birthday, in line at a bookstore event). Make it specific and grounded.",
    northStar:
      "Warm opener, genuine curiosity about the other person, comfortable self-disclosure, lets the conversation breathe.",
    subSkill:
      "the warm opener — start the conversation and ask one genuine curiosity question about the other person.",
  },
  {
    id: "difficult-conversations",
    label: "Handling difficult conversations",
    shortLabel: "Difficult conversations",
    description: "Disagreement, hard feedback, conflict, pushback — without bulldozing or freezing.",
    tag: "High value",
    icon: "flame",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a low-stakes-but-uncomfortable situation where the user must address a real tension (e.g. a roommate who keeps leaving dishes, a coworker missing deadlines, a friend who cancelled last minute again). Be specific.",
    northStar:
      "Describes the specific behavior factually without blame, expresses its impact in one sentence, makes one clear request, and listens before defending — behavior separated from person, path forward proposed.",
    subSkill:
      "naming the issue without blame — describe the facts, state the impact, make one clear request.",
  },
  {
    id: "speaking-up",
    label: "Speaking up in groups",
    shortLabel: "Speaking up in groups",
    description: "Standups, meetings, group dinners — voicing an idea without freezing.",
    tag: "Career impact",
    icon: "megaphone",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a group setting where the user has a chance to contribute (e.g. a team retro where they have a process idea, a dinner where they want to redirect the topic, a workshop where they want to challenge an assumption).",
    northStar:
      "Clear point in 1-2 sentences, confident framing, invites others in, doesn't trail off.",
    subSkill:
      "landing one clear point — state it in two sentences, stop, then invite someone in.",
  },
  {
    id: "small-talk",
    label: "Small talk & everyday chat",
    shortLabel: "Small talk",
    description: "Cafés, queues, elevators, neighbors, taxis — the daily reps.",
    tag: "Beginner friendly",
    icon: "coffee",
    persona: "b2c_user",
    scenarioSeed:
      "Invent an everyday micro-situation where small talk would naturally happen (e.g. waiting for coffee, in an elevator, in a long supermarket queue, at a dog park).",
    northStar:
      "Light opener, picks up on context, asks an easy question, lets it land warmly without forcing depth.",
    subSkill:
      "the context opener — notice something real around you, ask one easy question, let it land.",
  },
  // AUTISM TOPICS
  {
    id: "playground-rules",
    label: "Joining a Game",
    shortLabel: "Playground",
    description: "Learning how to politely ask to join other kids playing.",
    tag: "Social Basics",
    icon: "users",
    persona: "b2b_autism_user",
    scenarioSeed: "You are a child playing with blocks. Another child comes up and wants to join. Practice letting them play.",
    northStar: "Says 'yes' or shares a toy. Uses literal language.",
    subSkill: "sharing the play — saying 'yes, you can play' or offering a toy.",
  },
  {
    id: "loud-noises",
    label: "Loud Noises",
    shortLabel: "Sensory",
    description: "Practicing how to ask for a break when overwhelmed.",
    tag: "Sensory Coping",
    icon: "megaphone",
    persona: "b2b_autism_user",
    scenarioSeed: "The classroom gets very loud. Practice asking the teacher for your noise-cancelling headphones or a break.",
    northStar: "Clearly states 'I need a break' or 'Too loud'. Does not need eye contact.",
    subSkill: "asking for a break — saying 'It's too loud, I need a break.'",
  },
  {
    id: "routine-change",
    label: "Change in Routine",
    shortLabel: "Flexibility",
    description: "Dealing with a substitute teacher or changed schedule.",
    tag: "Flexibility",
    icon: "coffee",
    persona: "b2b_autism_user",
    scenarioSeed: "Your regular teacher is absent. A substitute is here. Practice saying hello and asking what the schedule is.",
    northStar: "Asks a clarifying question. Remains calm.",
    subSkill: "asking what happens next — one calm clarifying question.",
  },
  // ENTERPRISE TOPICS
  {
    id: "de-escalation",
    label: "De-escalating Angry Clients",
    shortLabel: "Conflict",
    description: "Calming down an upset customer or parent.",
    tag: "Crisis Management",
    icon: "flame",
    persona: "b2b_educator",
    scenarioSeed: "An angry parent is upset about their child's grade. Practice validating their feelings without conceding policy.",
    northStar: "Validates emotion, stays calm, offers a clear next step.",
    subSkill: "the validating label — name the client's emotion before any policy talk ('It sounds like you're frustrated…').",
  },
  {
    id: "constructive-feedback",
    label: "Constructive Feedback",
    shortLabel: "Feedback",
    description: "Giving hard feedback to an underperforming employee.",
    tag: "Leadership",
    icon: "users",
    persona: "b2b_educator",
    scenarioSeed: "A junior teacher is constantly late. Practice giving them direct but supportive feedback.",
    northStar: "Specific examples, focuses on behavior not character, clear expectations.",
    subSkill: "SBI delivery — one specific example, its impact, one clear expectation.",
  },
  {
    id: "iep-meeting",
    label: "IEP Disagreements",
    shortLabel: "IEP Meeting",
    description: "Navigating disagreements with parents regarding goals.",
    tag: "Parent Comm",
    icon: "coffee",
    persona: "b2b_educator",
    scenarioSeed: "A parent wants an unrealistic goal for their child. Practice redirecting to a measurable, achievable goal.",
    northStar: "Empathy first, grounds conversation in data, collaborative language.",
    subSkill: "the empathic redirect — acknowledge the parent's goal, then anchor to one measurable alternative.",
  }
];

export const getTopic = (id: TopicId) => topics.find((t) => t.id === id)!;
