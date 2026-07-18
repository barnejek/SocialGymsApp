import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { EmotionMetrics } from '../lib/emotion';

export interface FaceTrackerBridgeHandle {
  postMessage: (data: string) => void;
}

interface FaceTrackerBridgeProps {
  onMetrics: (metrics: EmotionMetrics) => void;
  enabled: boolean;
}

const faceApiHtml = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://vladmandic.github.io/face-api/dist/face-api.js"></script>
  <style> body { margin: 0; padding: 0; background: transparent; } </style>
</head>
<body>
  <img id="image" style="display:none;" />
  <script>
    const MODEL_URL = "https://vladmandic.github.io/face-api/model/";
    let modelsReady = false;

    async function loadModels() {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      modelsReady = true;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
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
      img.src = data;
      img.onload = async () => {
        const det = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
        if (det) {
          const metrics = expressionsToMetrics(det.expressions);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'metrics', data: metrics }));
        }
      };
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
  function FaceTrackerBridge({ onMetrics, enabled }, ref) {
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
