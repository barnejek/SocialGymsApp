import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { EmotionMetrics } from "@/lib/emotion";
import type { CameraView } from "expo-camera";
import type { FaceTrackerBridgeHandle } from "../components/FaceTrackerBridge";
import { DEMO_MODE } from "../lib/utils";
import { demoMetricsAt } from "../lib/mockBackend";

interface Options {
  cameraRef: RefObject<CameraView | null>;
  bridgeRef: RefObject<FaceTrackerBridgeHandle | null>;
  gated: boolean;
  enabled: boolean;
  /** Set true from CameraView.onCameraReady — refs aren't reactive, so this re-arms capture. */
  cameraReady: boolean;
  intervalMs?: number;
  onMetrics: (m: EmotionMetrics) => void;
}

export function useFaceCapture({
  cameraRef,
  bridgeRef,
  gated,
  enabled,
  cameraReady,
  intervalMs = 3000,
  onMetrics,
}: Options) {
  const inFlight = useRef(false);

  const onMetricsRef = useRef(onMetrics);
  useEffect(() => { onMetricsRef.current = onMetrics; }, [onMetrics]);

  const gatedRef = useRef(gated);
  useEffect(() => { gatedRef.current = gated; }, [gated]);

  // DEMO_MODE: no camera, no WebView bridge — animate the scripted emotion
  // timeline instead so the gauges tell the session's story deterministically.
  useEffect(() => {
    if (!DEMO_MODE || !enabled) return;
    const start = Date.now();
    const id = setInterval(() => {
      if (!gatedRef.current) return;
      onMetricsRef.current(demoMetricsAt(Date.now() - start));
    }, 1000);
    return () => clearInterval(id);
  }, [enabled]);

  useEffect(() => {
    if (DEMO_MODE) return;
    if (!enabled || !cameraReady) return;
    if (!cameraRef.current || !bridgeRef.current) return;

    let cancelled = false;

    const tick = async () => {
      if (!gatedRef.current || inFlight.current) return;

      inFlight.current = true;
      try {
        if (cancelled) return;

        const photo = await cameraRef.current?.takePictureAsync({
          quality: 0.1,
          base64: true,
          scale: 0.2,
        });

        if (photo?.base64 && bridgeRef.current) {
          bridgeRef.current.postMessage(`data:image/jpeg;base64,${photo.base64}`);
        }
      } catch {
        // Silent fail for camera frame drops
      } finally {
        inFlight.current = false;
      }
    };

    const id = setInterval(tick, intervalMs);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, cameraReady, cameraRef, bridgeRef, intervalMs]);
}
