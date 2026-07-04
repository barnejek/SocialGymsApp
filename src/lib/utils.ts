/** Set EXPO_PUBLIC_DEMO_MODE=true in .env to run a fully scripted pitch demo. No WiFi or Gemini quota needed. */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

type ClassValue = string | number | null | undefined | false | ClassValue[];

// Lightweight className combiner for NativeWind.
// (The web app uses clsx + tailwind-merge; on mobile we avoid the extra
// dependencies. NativeWind resolves duplicate utilities last-wins.)
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat(Infinity as 1)
    .filter((v): v is string | number => v === 0 || Boolean(v))
    .join(' ');
}
