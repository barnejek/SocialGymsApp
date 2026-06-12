import { useEffect, useRef, useState } from "react";

export function useSessionTimer(durationSec: number, running: boolean, onEnd: () => void) {
  const [remaining, setRemaining] = useState(durationSec);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    if (!running) return;
    setRemaining(durationSec);
    const start = Date.now();
    // Plain setInterval — `window.*` is a web idiom; in React Native the
    // global timer functions are the portable choice.
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const left = Math.max(0, durationSec - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onEndRef.current();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [running, durationSec]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  return {
    remaining,
    formatted: `${mm}:${ss.toString().padStart(2, "0")}`,
  };
}
