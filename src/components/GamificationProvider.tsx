import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchGamificationState,
  toProgressMap,
  type GamificationState,
  type SkillProgress,
} from '../lib/gamification';

// ---------------------------------------------------------------------------
// Mobile-side state container for the Supabase gamification data (the web repo
// uses react-query instead — this is the deliberate per-platform difference).
// Bootstraps the anonymous Supabase identity on app start; screens re-render
// on refresh() after a session completes.
// ---------------------------------------------------------------------------

interface GamificationContextType {
  state: GamificationState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GamificationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      // fetchGamificationState calls ensureSignedIn() internally, so the very
      // first call doubles as the anonymous auth bootstrap.
      const s = await fetchGamificationState();
      setState(s);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your gym.');
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ state, loading, error, refresh }),
    [state, loading, error, refresh],
  );

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamification(): GamificationContextType {
  const ctx = useContext(GamificationContext);
  if (ctx === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return ctx;
}

/** Convenience selector: progress rows keyed by skill_id. */
export const progressMapOf = (
  state: GamificationState | null,
): Record<string, SkillProgress> => toProgressMap(state?.skillProgress ?? []);
