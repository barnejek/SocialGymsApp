import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { EmotionMetrics } from '../lib/emotion';

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

    document.addEventListener("message", async (event) => {
      if (!modelsReady) return;
      const data = event.data;
      if (data.startsWith('data:image')) {
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
    });
  </script>
</body>
</html>
`;

export function FaceTrackerBridge({ onMetrics, enabled }: FaceTrackerBridgeProps) {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);

  // We expose a ref to send base64 images from the camera to the WebView
  useEffect(() => {
    // In actual implementation, you will use expo-camera to take snapshots (e.g. at 3fps) 
    // and pass the base64 string to this WebView using:
    // webViewRef.current?.postMessage('data:image/jpeg;base64,' + base64String);
  }, []);

  if (!enabled) return null;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: faceApiHtml }}
        javaScriptEnabled={true}
        onMessage={(event) => {
          const msg = JSON.parse(event.nativeEvent.data);
          if (msg.type === 'ready') setIsReady(true);
          if (msg.type === 'metrics' && onMetrics) {
            onMetrics(msg.data);
          }
        }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 0,
    height: 0,
    opacity: 0, // completely hidden
  },
  webview: {
    width: 0,
    height: 0,
  }
});
