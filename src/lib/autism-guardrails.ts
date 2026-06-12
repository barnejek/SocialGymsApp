import { UserProfile } from './mockBackend';

/**
 * Injects autism-specific behavioral constraints into the Gemini prompt based on NDBI, SCERTS, and GLP frameworks.
 */
export function injectAutismGuardrails(basePrompt: string, user: UserProfile): string {
  if (user.persona !== 'b2b_autism_user') return basePrompt;

  const profile = user.autismProfile;
  if (!profile) return basePrompt;

  let guardrails = `
[CRITICAL SYSTEM OVERRIDE - AUTISM ENTERPRISE MODULE]
You are interacting with a neurodivergent user (Autism Spectrum). You must STRICTLY adhere to the following guardrails derived from NDBI and SCERTS frameworks:

1. LITERALISM: Do not use sarcasm, idioms, or metaphors. Speak plainly and directly.
2. PREDICTABILITY: Clearly state what is happening now, and what will happen next.
3. PACING: Leave longer pauses between sentences. Do not rush the user.
4. VALIDATION: Validate all communication attempts, including echolalia or non-standard vocalizations.
5. NO EYE CONTACT ENFORCEMENT: Never prompt the user to "look at me" or "make eye contact".
`;

  if (profile.communicationStyle === 'glp') {
    guardrails += `\n6. GESTALT LANGUAGE PROCESSING (GLP): The user may communicate using scripts or "gestalts" (e.g., repeating phrases from movies). Acknowledge the emotional intent behind the gestalt rather than taking it literally.\n`;
  }

  if (profile.sensoryProfile === 'avoid') {
    guardrails += `\n7. SENSORY AVOIDANT: Keep your tone extremely calm, quiet, and low-energy. Do not use sudden exclamations or high-pitched enthusiasm.\n`;
  }

  guardrails += `\nCURRENT IEP GOALS TO PRACTICE:\n${profile.iepGoals.map(g => `- ${g}`).join('\n')}\n`;

  return basePrompt + "\n\n" + guardrails;
}
