// Platform-specific bits for the shared gamification lib.
// NOT a shared file — this is the ONE deliberate difference between repos:
//   web:    storage undefined → supabase-js falls back to window.localStorage,
//           env via import.meta.env.VITE_*
//   mobile: storage AsyncStorage, env via process.env.EXPO_PUBLIC_*
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupportedStorage } from "@supabase/supabase-js";

export const authStorage: SupportedStorage | undefined = AsyncStorage;

// Env-provided project coordinates. The shared lib falls back to the
// hardcoded publishable values when these are unset, so a missing .env can
// never silently point the two platforms at different projects.
export const envSupabaseUrl: string | undefined =
  process.env.EXPO_PUBLIC_SUPABASE_URL || undefined;
export const envSupabaseAnonKey: string | undefined =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  undefined;
