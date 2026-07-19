import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { EmotionMetrics } from "@/lib/emotion";
import type { CameraView } from "expo-camera";
import type { FaceTrackerBridgeHandle } from "../components/FaceTrackerBridge";

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

  useEffect(() => {
    if (!enabled || !cameraReady) return;
    if (!cameraRef.current || !bridgeRef.current) return;

    let cancelled = false;

    const tick = async () => {
      if (!gatedRef.current || inFlight.current) return;

      inFlight.current = true;
      try {
        if (cancelled) return;

        // Downscaling happens at the source: EmotionPanel sets `pictureSize`
        // on <CameraView> to the smallest supported size (~320-640 px) once
        // the camera is ready. quality 0.1 keeps the JPEG payload small.
        const photo = await cameraRef.current?.takePictureAsync({
          quality: 0.1,
          base64: true,
          // Silent, invisible capture: this fires every ~3s during a session —
          // without these flags Android plays the shutter sound and the
          // preview "flashes" on every frame grab.
          shutterSound: false,
          skipProcessing: true,
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
