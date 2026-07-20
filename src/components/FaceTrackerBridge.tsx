import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { EmotionMetrics } from '../lib/emotion';
import {
  FACE_API_SOURCE,
  TINY_FACE_DETECTOR_WEIGHT_SPECS,
  TINY_FACE_DETECTOR_WEIGHTS_B64,
  FACE_EXPRESSION_WEIGHT_SPECS,
  FACE_EXPRESSION_WEIGHTS_B64,
} from '../generated/faceApiAssets';

export interface FaceTrackerBridgeHandle {
  postMessage: (data: string) => void;
}

interface FaceTrackerBridgeProps {
  onMetrics: (metrics: EmotionMetrics) => void;
  enabled: boolean;
  /** Fired when face-api or its bundled models fail to initialize (timeout / broken bundle). */
  onError?: () => void;
}

// Everything the WebView needs is inlined below — the face-api.js script AND
// the model weights (src/generated/faceApiAssets.ts, built by
// scripts/generate-faceapi-assets.cjs). Face tracking therefore works fully
// offline: the old runtime dependency on vladmandic.github.io (script + model
// fetch — the "conference-WiFi time bomb", ToDo-stack P1) is gone.
const faceApiHtml = `
<!DOCTYPE html>
<html>
<head>
  <style> body { margin: 0; padding: 0; background: transparent; } </style>
</head>
<body>
  <img id="image" style="display:none;" />
  <script>${FACE_API_SOURCE}</script>
  <script>
    const MODELS = {
      tiny: { specs: ${JSON.stringify(TINY_FACE_DETECTOR_WEIGHT_SPECS)}, b64: ${JSON.stringify(TINY_FACE_DETECTOR_WEIGHTS_B64)} },
      expression: { specs: ${JSON.stringify(FACE_EXPRESSION_WEIGHT_SPECS)}, b64: ${JSON.stringify(FACE_EXPRESSION_WEIGHTS_B64)} },
    };
    let modelsReady = false;

    // Assets are bundled — a failure here means a broken build, not a network
    // outage. Still fail LOUDLY so the session UI can react.
    const LOAD_TIMEOUT_MS = 10000;
    function reportError() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error' }));
    }
    setTimeout(() => { if (!modelsReady) reportError(); }, LOAD_TIMEOUT_MS);

    function b64ToBuffer(b64) {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes.buffer;
    }

    function loadModels() {
      try {
        if (typeof faceapi === 'undefined') { reportError(); return; }
        // decodeWeights handles the uint8-quantized specs these models ship with.
        faceapi.nets.tinyFaceDetector.loadFromWeightMap(
          faceapi.tf.io.decodeWeights(b64ToBuffer(MODELS.tiny.b64), MODELS.tiny.specs)
        );
        faceapi.nets.faceExpressionNet.loadFromWeightMap(
          faceapi.tf.io.decodeWeights(b64ToBuffer(MODELS.expression.b64), MODELS.expression.specs)
        );
        modelsReady = true;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      } catch (e) {
        reportError();
      }
    }
    loadModels();

    function expressionsToMetrics(expr) {
      const { happy, sad, fearful, disgusted, angry, surprised, neutral } = expr;
      const smiling = Math.round(Math.min(1, happy * 1.4 + (1 - neutral) * 0.15) * 100);
      const anxiety = Math.round(Math.min(1, fearful * 0.45 + disgusted * 0.25 + angry * 0.2 + sad * 0.1) * 100);
      const engagement = Math.round(Math.max(0, Math.min(1, surprised * 0.35 + happy * 0.35 + (1 - neutral) * 0.3 - sad * 0.15)) * 100);
      const confidence = Math.round(Math.max(0, Math.min(1, 0.5 + happy * 0.3 + neutral * 0.1 - fearful * 0.4 - angry * 0.25)) * 100);

      const sorted = Object.entries(expr).sort((a, b) => b[1] - a[1]);
      const [topName, topScore] = sorted[0];

      return {
        confidence, anxiety, engagement, smiling,
        primaryEmotion: topName,
        primaryEmotionScore: Math.round(topScore * 100),
      };
    }

    async function onFrame(data) {
      if (!modelsReady) return;
      if (typeof data !== 'string' || !data.startsWith('data:image')) return;
      const img = document.getElementById('image');
      // Attach the handler BEFORE setting src — a cached data-URL can fire
      // 'load' synchronously, which would silently drop the frame otherwise.
      img.onload = async () => {
        // inputSize 224 (default 416) ≈ 3–4× less compute per detection — the
        // same tuning the web hook uses; the WebView runs on weaker hardware.
        const det = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })).withFaceExpressions();
        if (det) {
          const metrics = expressionsToMetrics(det.expressions);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'metrics', data: metrics }));
        }
      };
      // Assigning src is what actually triggers the decode + onload above.
      // Omitting it meant onload never fired, no detection ever ran, and the
      // presence panel sat on NEUTRAL_METRICS for the whole session.
      img.src = data;
    }

    // Android RN WebView
    document.addEventListener('message', (event) => { onFrame(event.data); });
    // iOS RN WebView
    window.addEventListener('message', (event) => { onFrame(event.data); });
  </script>
</body>
</html>
`;

export const FaceTrackerBridge = forwardRef<FaceTrackerBridgeHandle, FaceTrackerBridgeProps>(
  function FaceTrackerBridge({ onMetrics, enabled, onError }, ref) {
    const webViewRef = useRef<WebView>(null);
    const [isReady, setIsReady] = useState(false);

    useImperativeHandle(ref, () => ({
      postMessage: (data: string) => {
        if (!isReady) return;
        webViewRef.current?.postMessage(data);
      },
    }), [isReady]);

    if (!enabled) return null;

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: faceApiHtml }}
          javaScriptEnabled
          originWhitelist={['*']}
          onMessage={(event) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data);
              if (msg.type === 'ready') setIsReady(true);
              if (msg.type === 'error') onError?.();
              if (msg.type === 'metrics' && onMetrics) {
                onMetrics(msg.data);
              }
            } catch {
              // ignore malformed bridge messages
            }
          }}
          style={styles.webview}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  webview: {
    width: 0,
    height: 0,
  },
});
