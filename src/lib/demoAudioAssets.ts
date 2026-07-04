/**
 * Pre-rendered demo audio assets for pitch-quality playback.
 *
 * Convention: one MP3 per DEMO_SCRIPT entry at assets/audio/demo/{id}.mp3
 * (e.g. assets/audio/demo/line-01.mp3).
 *
 * To enable:
 *   1. Generate MP3s offline (ElevenLabs, OpenAI TTS, etc.)
 *   2. Drop them into assets/audio/demo/
 *   3. Uncomment/add require() entries below
 *   4. Set HAS_RENDERED_AUDIO = true
 */
export const HAS_RENDERED_AUDIO = false;

export const DEMO_AUDIO_BY_ID: Partial<Record<string, number>> = {
  // 'line-01': require('../../assets/audio/demo/line-01.mp3'),
  // 'line-02': require('../../assets/audio/demo/line-02.mp3'),
  // ... one entry per DEMO_SCRIPT id
};

export function getDemoAudioSource(id: string): number | undefined {
  if (!HAS_RENDERED_AUDIO) return undefined;
  return DEMO_AUDIO_BY_ID[id];
}

export function hasDemoAudio(id: string): boolean {
  return getDemoAudioSource(id) !== undefined;
}
