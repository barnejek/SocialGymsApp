// Single source of raw color values for places that can't use Tailwind token
// classes (lucide `color=`, tabBar options, Switch trackColor, gradients…).
// These mirror the CSS variables in src/global.css — change both together.
// Persona-specific palettes live in ./themes.ts.

export const COLORS = {
  primary: '#F5A340', //           --primary  hsl(30 92% 61%) — the brand orange
  primaryForeground: '#0e1424', // --primary-foreground
  background: '#0e1424', //        --background
  surface: '#151b2e', //           --surface
  surface2: '#1e2438', //          --surface-2
  border: '#262d44', //            --border
  muted: '#232941', //             --muted
  foreground: '#fafafa', //        --foreground
  mutedForeground: '#9aa3ba', //   --muted-foreground
  destructive: '#df3d3d', //       --destructive
  engagement: '#4ECB71', //        --engagement
  comfort: '#F5A340', //           --comfort
  openness: '#3B9EF5', //          --openness
  white: '#ffffff',
} as const;
