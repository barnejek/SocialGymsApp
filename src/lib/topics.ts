// Social Gyms training topics. Each topic is a *theme*; the AI tutor invents
// a concrete scenario at session start.
//
// SHARED FILE — keep byte-identical with mobile/src/lib/topics.ts
// (enforced by `npm run check-drift`). The full superset lives in BOTH repos;
// each surface filters what it shows (persona, coreTopics, gym skill tree).
// TopicIds for gamification skills match gam_skills.topic_id in Supabase.

export type TopicId =
  // original b2c core
  | "meeting-new-people"
  | "difficult-conversations"
  | "speaking-up"
  | "small-talk"
  // foundations (gym)
  | "active-listening"
  | "telling-a-good-story"
  | "deepening-a-friendship"
  // career (gym)
  | "interview-presence"
  | "office-politics"
  | "salary-negotiation"
  | "leading-a-tense-meeting"
  // charisma (gym)
  | "owning-the-room"
  | "humor-and-banter"
  | "pitching-an-idea"
  | "hostile-qa"
  | "the-toast"
  // romance (gym, adults only — gated by profile.is_adult)
  | "warm-approach"
  | "flirting-banter"
  | "asking-someone-out"
  | "first-date-conversation"
  | "reading-signals"
  | "rejection-resilience"
  | "what-are-we"
  // autism persona
  | "playground-rules"
  | "loud-noises"
  | "routine-change"
  // educator persona (also mapped to career gym skills)
  | "de-escalation"
  | "constructive-feedback"
  | "iep-meeting"
  // free-text
  | "custom";

export interface Topic {
  id: TopicId;
  label: string;
  shortLabel: string;
  description: string;
  tag: string;
  icon: string;
  persona: "b2c_user" | "b2b_autism_user" | "b2b_educator";
  /** Used by the tutor to invent a fresh micro-scenario for this topic. */
  scenarioSeed: string;
  /** What "good" looks like — fed to the coach prompt for grading. */
  northStar: string;
  /** The ONE observable behavior trained this session (deliberate practice). */
  subSkill: string;
}

export const topics: Topic[] = [
  // ── Original b2c core ──────────────────────────────────────────────────────
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

  // ── Foundations path (gym) ─────────────────────────────────────────────────
  {
    id: "active-listening",
    label: "Active listening",
    shortLabel: "Active listening",
    description: "Making people feel heard — reflecting, labeling, and not rushing to fix.",
    tag: "Connection",
    icon: "ear",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a situation where someone wants to tell the user about something that matters to them (e.g. a friend venting about a rough week at work, a colleague excited about a new project, a family member describing a worry). The user's job is to listen, not to fix.",
    northStar:
      "Reflects back what was said before adding anything, labels the speaker's feeling once, asks one follow-up that goes deeper instead of changing the subject, resists giving advice until asked.",
    subSkill:
      "the reflect-then-deepen loop — mirror their last few words or label the feeling, then ask one question that goes one layer deeper.",
  },
  {
    id: "telling-a-good-story",
    label: "Telling a good story",
    shortLabel: "Storytelling",
    description: "Holding attention for 30 seconds — hook, detail, landing, done.",
    tag: "Charm",
    icon: "book",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a relaxed setting where a short personal story would naturally be welcome (e.g. dinner with new friends where someone asks how the trip was, a lunch break where a colleague asks about the weekend, a party where someone asks how you two met).",
    northStar:
      "Opens with a hook instead of background, keeps it under a minute, includes one concrete sensory detail, lands a point or punchline, hands the floor back.",
    subSkill:
      "the 30-second arc — hook first, one vivid detail, land the ending, stop.",
  },
  {
    id: "deepening-a-friendship",
    label: "Deepening a friendship",
    shortLabel: "Deeper friendship",
    description: "Turning an acquaintance into a friend — past small talk, into real talk.",
    tag: "Connection",
    icon: "users",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a moment where an acquaintance could become a real friend (e.g. a gym buddy suggests grabbing coffee after, a coworker you like mentions weekend plans, a neighbor lingers to chat). The user should move past surface talk and open up a little.",
    northStar:
      "Shares something genuinely personal at matching depth, asks a question that invites the same, makes a concrete plan or follow-up, tolerates the small vulnerability without deflecting into jokes.",
    subSkill:
      "matched self-disclosure — share one real thing about yourself, then ask a question that invites theirs.",
  },

  // ── Career & Influence path (gym) ──────────────────────────────────────────
  {
    id: "interview-presence",
    label: "Interview presence",
    shortLabel: "Interviews",
    description: "The 'tell me about yourself' moment — concrete, confident, unhedged.",
    tag: "Career impact",
    icon: "briefcase",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a realistic job-interview moment where presence matters more than the resume (e.g. the 'tell me about yourself' opener, a 'why should we hire you?' curveball, a panel member who seems unconvinced). Keep it to one interviewer and one pivotal exchange.",
    northStar:
      "Answers in structured, concrete sentences with one specific example, owns strengths without hedging or bragging, pauses instead of rambling, asks one sharp question back.",
    subSkill:
      "the confident answer — one claim, one concrete example, then stop talking.",
  },
  {
    id: "office-politics",
    label: "Office politics",
    shortLabel: "Office politics",
    description: "Credit, turf, alliances — navigating interests without losing yourself.",
    tag: "Career impact",
    icon: "briefcase",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a workplace situation with competing interests but no villain (e.g. a peer taking credit for shared work in front of the boss, being pulled into two managers' turf war, deciding whether to back a colleague's unpopular proposal). Ambiguity is the point — make both sides reasonable.",
    northStar:
      "Names their own interest openly without badmouthing anyone, asks calibrated questions to map what others want, builds an ally instead of a grievance, commits to one concrete next step.",
    subSkill:
      "the open move — state what you want plainly, then ask a calibrated question about what they want.",
  },
  {
    id: "salary-negotiation",
    label: "Salary negotiation",
    shortLabel: "Salary talk",
    description: "Naming the number without apologizing — and holding the silence after.",
    tag: "High value",
    icon: "briefcase",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a compensation conversation (e.g. a raise request after a strong year, a job-offer negotiation where the number is 15% low, a promotion that added duties but no pay). Give the other side a real budget constraint so the pushback is genuine.",
    northStar:
      "States the number first without apologizing, anchors it to specific delivered value, stays silent after the ask, treats pushback as a problem to solve together rather than a rejection.",
    subSkill:
      "the unapologetic ask — name your number, tie it to one concrete result, then hold the silence.",
  },
  {
    id: "leading-a-tense-meeting",
    label: "Leading a tense meeting",
    shortLabel: "Tense meetings",
    description: "Chairing the room when tempers are already up — naming it, steering it.",
    tag: "Leadership",
    icon: "briefcase",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a meeting the user must run where tension is already in the room (e.g. a post-mortem after a public failure, a headcount decision two leads both claim, a deadline slip that needs owning in front of the team). The user chairs; others have strong feelings.",
    northStar:
      "Names the tension out loud instead of ignoring it, sets one clear goal for the meeting, gives heated voices a bounded space then redirects, closes with an explicit decision and owner.",
    subSkill:
      "naming the room — say the tension everyone feels in one calm sentence, then state what the meeting must decide.",
  },

  // ── Charisma & Stage path (gym) ────────────────────────────────────────────
  {
    id: "owning-the-room",
    label: "Owning the room",
    shortLabel: "Owning the room",
    description: "Small-group presence — walking in and setting the tone, warmly.",
    tag: "Presence",
    icon: "mic",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a small-group moment where the user can take warm command (e.g. kicking off a workshop for six strangers, introducing themselves to a new team, hosting friends-of-friends at their own dinner). Small stakes, all eyes on them.",
    northStar:
      "Opens with energy and a clear first line, addresses individuals rather than the floor, uses names, sets the tone for the group instead of waiting for permission.",
    subSkill:
      "the first ten seconds — walk in, one strong opening line, address one person by name.",
  },
  {
    id: "humor-and-banter",
    label: "Humor & banter",
    shortLabel: "Banter",
    description: "Landing the joke, taking the joke — playful without punching down.",
    tag: "Charm",
    icon: "mic",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a playful low-stakes exchange where banter would land well (e.g. a coworker teasing about your legendary coffee intake, a friendly regular at the gym, a game night with light trash talk). The other person is witty and gives as good as they get.",
    northStar:
      "Plays along instead of deflecting, teases warmly without punching down, takes a joke at their own expense gracefully, knows when to land it and move on.",
    subSkill:
      "the return volley — take the tease with a grin and send one back that's playful, never sharp.",
  },
  {
    id: "pitching-an-idea",
    label: "Pitching an idea in 2 minutes",
    shortLabel: "The pitch",
    description: "Problem, idea, proof, ask — inside two minutes, to a busy skeptic.",
    tag: "High value",
    icon: "mic",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a two-minute pitch moment (e.g. catching a director between meetings with a process fix, pitching a side project to a potential collaborator, convincing the team to try a new tool at standup). The listener is busy and mildly skeptical.",
    northStar:
      "Leads with the problem in one sentence, gives the idea in the next, backs it with one number or example, asks for one specific small commitment, done inside two minutes.",
    subSkill:
      "problem-idea-proof-ask — four beats, two minutes, one clear request at the end.",
  },
  {
    id: "hostile-qa",
    label: "Hostile Q&A",
    shortLabel: "Hostile Q&A",
    description: "Sharp questions with accusations inside — staying warm under fire.",
    tag: "Composure",
    icon: "mic",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a Q&A moment that turns sharp (e.g. defending a project decision to a pointed skeptic, a community-meeting question with an accusation inside it, a stakeholder demanding to know who approved this). The questioner is aggressive but not irrational.",
    northStar:
      "Lets the question finish without interrupting, acknowledges the legitimate core before answering, answers the question actually asked in two sentences, stays warm-voiced under pressure, never gets defensive or sarcastic.",
    subSkill:
      "acknowledge-then-answer — name the fair concern inside the hostile question, then answer just that in two sentences.",
  },
  {
    id: "the-toast",
    label: "The toast / public speech",
    shortLabel: "The toast",
    description: "90 seconds, a listening room, one person who matters — no trailing off.",
    tag: "Stage",
    icon: "mic",
    persona: "b2c_user",
    scenarioSeed:
      "Invent an occasion where the user must give a short speech to a group (e.g. a best friend's birthday toast, a colleague's send-off, a wedding table speech). Give them 60-90 seconds, a listening room, and one person who matters most.",
    northStar:
      "Opens with a specific story not a generality, speaks to the honoree directly at least once, keeps it under 90 seconds, ends on one clean emotional line and raises the glass — no trailing off.",
    subSkill:
      "the story-to-sentiment arc — one specific story about them, then one honest sentence about what they mean to you.",
  },

  // ── Romance & Dating path (gym; adults only — profile.is_adult gate) ───────
  // Tone guardrails (SPEC): authenticity and mutual interest, consent-forward,
  // zero pickup-artist manipulation framing. The AI partner is sometimes
  // genuinely uninterested — training the graceful exit IS the skill, and
  // scoring rewards respecting disinterest, never "persisting".
  {
    id: "warm-approach",
    label: "The warm approach",
    shortLabel: "Warm approach",
    description: "Starting a conversation with someone attractive — honest, situational, pressure-free.",
    tag: "Dating",
    icon: "heart",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a natural, public, low-pressure situation where the user notices someone they find attractive and could plausibly start a conversation (e.g. a bookstore café, a mutual friend's party, a run-club after-drinks). IMPORTANT: in roughly half of the rounds, play someone who is polite but genuinely not interested — short answers, closed body language — because accurately reading that and exiting warmly is part of the skill being trained. Disinterest is never a test to overcome; when you play uninterested, stay uninterested.",
    northStar:
      "Opens with something situational and honest rather than a line, reads the response accurately, escalates only on clear interest, and exits warmly and without resentment at the first sign of disinterest — a graceful exit scores as highly as a great conversation.",
    subSkill:
      "the honest opener plus the read — start with something true about the moment, then match their actual level of interest.",
  },
  {
    id: "flirting-banter",
    label: "Flirting & playful banter",
    shortLabel: "Flirting",
    description: "Warm, mutual, playful — escalating only as fast as it's reciprocated.",
    tag: "Dating",
    icon: "heart",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a flirty-but-respectful exchange with someone who already shows friendly interest (e.g. a second conversation at a party that's going well, coffee after a dating-app match, a friend-of-a-friend at a picnic who keeps finding reasons to talk to you). Keep it warm and mutual; if the user turns crude or scripted, respond as a real person would — by cooling off.",
    northStar:
      "Playful teasing that invites teasing back, compliments that are specific rather than about looks alone, comfortable with pauses, escalates warmth only as it's reciprocated, stays fully respectful throughout.",
    subSkill:
      "the playful escalation — tease lightly, let them volley back, and let the warmth build only as fast as they match it.",
  },
  {
    id: "asking-someone-out",
    label: "Asking someone out",
    shortLabel: "The ask",
    description: "One direct invitation with a real plan — and grace with any answer.",
    tag: "Dating",
    icon: "heart",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a moment where asking someone out is plausible and earned (e.g. the third good conversation with someone at the climbing gym, the end of a great first meeting through friends). Vary the outcome across rounds: sometimes a yes, sometimes a hedge like 'I'm pretty busy lately', sometimes a kind no — the user is training the ask AND the response to whatever comes back.",
    northStar:
      "Asks directly with a concrete plan (what, when) instead of hint-dropping, keeps it light, takes a yes without over-celebrating, and takes a no or a hedge with genuine grace — no bargaining, no visible deflation dumped on the other person.",
    subSkill:
      "the clear ask — one direct invitation with a concrete plan, then full grace with whatever comes back.",
  },
  {
    id: "first-date-conversation",
    label: "First date conversation",
    shortLabel: "First date",
    description: "Twenty minutes in — balancing sharing and asking, surviving the lull.",
    tag: "Dating",
    icon: "heart",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a first-date setting mid-conversation (e.g. drinks at a quiet bar twenty minutes in, a walk after coffee). Play a real person with their own stories, some nerves, and topics they light up about. Include at least one lull the user must navigate.",
    northStar:
      "Balances asking and sharing roughly evenly, follows up on what the other person lights up about, handles a lull without panicking, offers real self-disclosure rather than a highlight reel, makes the other person feel interesting.",
    subSkill:
      "the lull rescue — when the conversation dips, pick up an earlier thread they cared about and go one level deeper.",
  },
  {
    id: "reading-signals",
    label: "Reading signals & respecting a no",
    shortLabel: "Reading signals",
    description: "Reading interest honestly — checking in, and honoring the answer completely.",
    tag: "Dating",
    icon: "heart",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a scenario with genuinely ambiguous-then-clarifying signals (e.g. someone friendly at a party who is warm but keeps steering to neutral topics, a date who is engaged but mentions being really busy lately). CRITICAL: in most rounds the underlying truth is polite disinterest — the skill being trained is reading it accurately and exiting with warmth. Respond honestly when the user checks in; never reward pushing past a signal.",
    northStar:
      "Notices and correctly weighs verbal and contextual cues, checks in directly instead of assuming, accepts a no or a fade immediately and warmly, leaves the other person feeling respected — persistence after a no is a failing behavior, not a strategy.",
    subSkill:
      "the check-in and the graceful exit — ask one honest check-in question, then honor the answer completely.",
  },
  {
    id: "rejection-resilience",
    label: "Rejection resilience",
    shortLabel: "After the no",
    description: "What happens after the no — dignity intact, relationship preserved.",
    tag: "Confidence builder",
    icon: "heart",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a scenario where the user has just been turned down and the interaction isn't quite over (e.g. a no to a date ask from someone in their friend group they'll keep seeing, a 'let's stay friends' conversation, running into someone who never called back). The other person is kind but firm. Train what happens AFTER the no.",
    northStar:
      "Takes the no at face value the first time, responds with warmth and zero guilt-tripping, keeps their own dignity intact without self-deprecating spirals, preserves the relationship or exits cleanly — and doesn't relitigate.",
    subSkill:
      "the dignified response — one warm sentence accepting the no, zero attempts to reopen it.",
  },
  {
    id: "what-are-we",
    label: 'The "what are we" conversation',
    shortLabel: "What are we",
    description: "Defining the relationship — wanting out loud, and hearing the real answer.",
    tag: "High value",
    icon: "heart",
    persona: "b2c_user",
    scenarioSeed:
      "Invent a define-the-relationship moment a few weeks into dating someone (e.g. after one of you mentioned meeting friends, after a great weekend together, after noticing the apps are still installed). Vary what the other person wants across rounds: the same thing, less, or they genuinely don't know yet. Play their uncertainty honestly.",
    northStar:
      "Raises the topic plainly without an ambush or ultimatum, says what they actually want first instead of fishing, listens to the real answer without steering it, and can hold a mismatch — hearing 'I'm not there yet' without collapsing or pretending it's fine when it isn't.",
    subSkill:
      "wanting out loud — say what you want in one honest sentence before asking what they want.",
  },

  // ── Autism persona topics ──────────────────────────────────────────────────
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

  // ── Educator persona topics (de-escalation + constructive-feedback also
  //    power the Career gym skills on both platforms) ─────────────────────────
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
  },
];

export const getTopic = (id: TopicId) => {
  const topic = topics.find((t) => t.id === id);
  if (!topic) throw new Error(`getTopic: unknown topic id "${id}"`);
  return topic;
};

/** The four topics shown on the classic (pre-gym) topic pickers. */
export const CORE_TOPIC_IDS: TopicId[] = [
  "meeting-new-people",
  "difficult-conversations",
  "speaking-up",
  "small-talk",
];

export const coreTopics = topics.filter((t) => CORE_TOPIC_IDS.includes(t.id));

// ── Difficulty modifiers (gamification masteries) ────────────────────────────
// Written once, applied to ALL topics: appended to every phase system prompt at
// session start when the user replays a skill at Silver/Gold difficulty.
// Silver attempt = the persona is distracted; Gold attempt = skeptical/cold.

export type DifficultyLevel = "base" | "silver" | "gold";

export const difficultyModifiers: Record<Exclude<DifficultyLevel, "base">, string> = {
  silver: `
# DIFFICULTY MODIFIER — SILVER ATTEMPT (persona hardening; never mention or hint at this)
In your IN CHARACTER rounds, play the counterpart slightly distracted: shorter openings, occasional glances at your phone or the room, no conversational gifts. The user must carry a bit more of the interaction. Stay realistic and never hostile — just less generous than usual.`,
  gold: `
# DIFFICULTY MODIFIER — GOLD ATTEMPT (persona hardening; never mention or hint at this)
In your IN CHARACTER rounds, play the counterpart skeptical and cold at the start: closed answers, mild objections, zero conversational gifts. The user must earn every inch and carry the interaction alone. Warm up ONLY if they genuinely demonstrate today's sub-skill — never for free. Stay civil throughout: cold, not cruel.`,
};

/** Append the mastery-appropriate hardening snippet to a phase system prompt. */
export const applyDifficulty = (systemPrompt: string, level: DifficultyLevel): string =>
  level === "base" ? systemPrompt : `${systemPrompt}\n${difficultyModifiers[level]}`;

/** Which difficulty the NEXT attempt on a skill should use, given current mastery (0-3). */
export const difficultyForMastery = (mastery: number): DifficultyLevel =>
  mastery >= 2 ? "gold" : mastery >= 1 ? "silver" : "base";

// ── Custom scenario ──────────────────────────────────────────────────────────
// The user describes the exact situation they want to practice; the coach uses
// it verbatim instead of inventing one. Built at session start from free text.

export const CUSTOM_TOPIC_ID: TopicId = "custom";

export const makeCustomTopic = (scenario: string): Topic => ({
  id: "custom",
  label: "Your own scenario",
  shortLabel: "Your own scenario",
  description: "A situation you described yourself.",
  tag: "Custom",
  icon: "pencil",
  persona: "b2c_user",
  scenarioSeed:
    `THE USER HAS ALREADY WRITTEN THE EXACT SCENARIO THEY WANT TO PRACTICE — do NOT invent a different one. ` +
    `Their scenario, verbatim: "${scenario.trim()}". ` +
    `Use it as-is; only add the minimal concrete detail (where it happens, who the other person is) if the user left it out.`,
  northStar:
    "Handles the situation they described with clarity and warmth: states what they want in plain words, listens, and responds to what they actually hear.",
  subSkill:
    "handling the exact situation you described — say what you need clearly, then listen and respond to what you hear.",
});
