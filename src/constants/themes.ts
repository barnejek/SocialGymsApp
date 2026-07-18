// Per-persona theming — makes the product-line switch visually obvious within
// a second of logging in (mobile/ToDo.md §4.3):
//   b2c        → dark navy + warm orange energy (the global.css defaults)
//   autism     → light, low-stimulus sage/sky palette; calm clinical register
//   enterprise → neutral slate, restrained accent, HR-deck sober
//
// Implementation: NativeWind v4 `vars()` overrides the CSS variables that
// tailwind.config.js token classes (bg-background, text-foreground, …) read,
// so every screen built from tokens re-skins automatically. The raw hex
// values are for the places that can't take a className (tab bar options,
// lucide `color=`, Switch trackColor).

import { vars } from 'nativewind';
import type { UserPersona } from '../lib/mockBackend';
import { COLORS } from './colors';

export interface PersonaTheme {
  /** Style object to spread on the app root View. */
  vars: ReturnType<typeof vars>;
  /** Raw values for non-className call sites. */
  colors: {
    primary: string;
    background: string;
    surface: string;
    border: string;
    foreground: string;
    mutedForeground: string;
    tabBarActive: string;
    tabBarInactive: string;
  };
}

// B2C: the global.css defaults — punchy dark navy + brand orange. Empty vars
// keeps global.css as the single source of truth for this palette.
const b2c: PersonaTheme = {
  vars: vars({}),
  colors: {
    primary: COLORS.primary,
    background: COLORS.background,
    surface: COLORS.surface,
    border: COLORS.border,
    foreground: COLORS.foreground,
    mutedForeground: COLORS.mutedForeground,
    tabBarActive: COLORS.primary,
    tabBarInactive: COLORS.mutedForeground,
  },
};

// Autism mode: light, low-stimulus sage/sky. Soft contrast, no pure black or
// saturated alarm colors — a calm clinical tool, not a gamer UI.
const autism: PersonaTheme = {
  vars: vars({
    '--background': '150 25% 97%',
    '--surface': '150 22% 92%',
    '--surface-2': '150 18% 87%',
    '--foreground': '205 25% 22%',
    '--muted': '150 15% 88%',
    '--muted-foreground': '200 12% 42%',
    '--card': '150 22% 92%',
    '--card-foreground': '205 25% 22%',
    '--popover': '150 22% 92%',
    '--popover-foreground': '205 25% 22%',
    '--primary': '155 35% 40%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '200 30% 90%',
    '--secondary-foreground': '205 25% 22%',
    '--accent': '200 45% 55%',
    '--accent-foreground': '0 0% 100%',
    '--destructive': '0 45% 55%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '150 15% 82%',
    '--input': '150 15% 85%',
    '--ring': '155 35% 40%',
    '--engagement': '150 40% 42%',
    '--comfort': '35 60% 55%',
    '--openness': '205 50% 52%',
  }),
  colors: {
    primary: '#428a6a', //         sage — hsl(155 35% 40%)
    background: '#f4f9f6',
    surface: '#e6f0ea',
    border: '#cbd8d0',
    foreground: '#2a3a46',
    mutedForeground: '#5e7078',
    tabBarActive: '#428a6a',
    tabBarInactive: '#8aa096',
  },
};

// Enterprise: neutral slate surfaces, the brand orange kept as the single
// restrained accent. Denser, sober — screenshots well into an HR deck.
const enterprise: PersonaTheme = {
  vars: vars({
    '--background': '220 18% 10%',
    '--surface': '220 15% 14%',
    '--surface-2': '220 13% 18%',
    '--foreground': '220 15% 96%',
    '--muted': '220 12% 19%',
    '--muted-foreground': '220 10% 62%',
    '--card': '220 15% 14%',
    '--card-foreground': '220 15% 96%',
    '--popover': '220 15% 14%',
    '--popover-foreground': '220 15% 96%',
    '--primary': '30 92% 61%',
    '--primary-foreground': '220 18% 10%',
    '--secondary': '220 13% 18%',
    '--secondary-foreground': '220 15% 96%',
    '--accent': '30 92% 61%',
    '--accent-foreground': '220 18% 10%',
    '--border': '220 12% 22%',
    '--input': '220 12% 19%',
    '--ring': '30 92% 61%',
  }),
  colors: {
    primary: COLORS.primary,
    background: '#15181f',
    surface: '#1e222b',
    border: '#31363f',
    foreground: '#f2f4f7',
    mutedForeground: '#93999f',
    tabBarActive: COLORS.primary,
    tabBarInactive: '#93999f',
  },
};

const THEMES: Record<UserPersona, PersonaTheme> = {
  b2c_user: b2c,
  b2b_autism_user: autism,
  b2b_educator: enterprise,
};

export const personaTheme = (persona: UserPersona | undefined): PersonaTheme =>
  persona ? THEMES[persona] : b2c;
