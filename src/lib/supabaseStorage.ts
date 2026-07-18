// Platform-specific auth-session storage for the shared gamification lib.
// NOT a shared file — this is the ONE deliberate difference between repos:
//   web:    undefined → supabase-js falls back to window.localStorage
//   mobile: AsyncStorage (@react-native-async-storage/async-storage)
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupportedStorage } from "@supabase/supabase-js";

export const authStorage: SupportedStorage | undefined = AsyncStorage;
