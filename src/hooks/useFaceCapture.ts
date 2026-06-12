import { useEffect, useRef } from "react";
import type { EmotionMetrics } from "@/lib/emotion";
import type { CameraView } from "expo-camera";

interface Options {
  cameraRef: React.RefObject<CameraView>;
  bridgeRef: React.RefObject<any>; // WebView ref
  gated: boolean;
  enabled: boolean;
  intervalMs?: number;
  onMetrics: (m: EmotionMetrics) => void;
}

export function useFaceCapture({ cameraRef, bridgeRef, gated, enabled, intervalMs = 3000, onMetrics }: Options) {
  const inFlight = useRef(false);

  const onMetricsRef = useRef(onMetrics);
  useEffect(() => { onMetricsRef.current = onMetrics; }, [onMetrics]);

  const gatedRef = useRef(gated);
  useEffect(() => { gatedRef.current = gated; }, [gated]);

  useEffect(() => {
    if (!enabled || !cameraRef.current || !bridgeRef.current) return;

    let cancelled = false;

    const tick = async () => {
      if (!gatedRef.current || inFlight.current) return;
      
      inFlight.current = true;
      try {
        if (cancelled) return;
        
        // Take a low-res snapshot from expo-camera
        const photo = await cameraRef.current?.takePictureAsync({
          quality: 0.1,
          base64: true,
          scale: 0.2, // shrink image for faster processing
        });

        if (photo?.base64 && bridgeRef.current) {
          // Send base64 to WebView bridge
          bridgeRef.current.postMessage(`data:image/jpeg;base64,${photo.base64}`);
        }
      } catch (e) {
        // Silent fail for camera frame drops
      } finally {
        inFlight.current = false;
      }
    };

    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, cameraRef, bridgeRef, intervalMs]);
}
