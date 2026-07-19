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
