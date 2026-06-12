import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FaceTrackerBridge } from '../FaceTrackerBridge';
import { useAuth } from '../../components/AuthProvider';
import type { EmotionMetrics } from '../../lib/emotion';

interface EmotionPanelProps {
  active: boolean;
  metrics: EmotionMetrics;
  faceTop: { name: string; score: number } | null;
  voiceTop: { name: string; score: number } | null;
  evi: string;
}

export const EmotionPanel = ({ active, metrics, faceTop, voiceTop, evi }: EmotionPanelProps) => {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-surface rounded-2xl p-6">
        <Text className="text-foreground text-center mb-4">We need your permission to show the camera</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface rounded-2xl overflow-hidden border border-border">
      {/* Camera View */}
      <View className="flex-1 bg-black relative">
        {active ? (
          <CameraView 
            ref={cameraRef}
            style={StyleSheet.absoluteFill} 
            facing="front" 
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground">Camera inactive</Text>
          </View>
        )}
        
        {/* Hidden WebView Bridge for Face API */}
        <FaceTrackerBridge 
          enabled={active}
          onMetrics={(m: any) => {
            // Note: In the full app, these metrics feed back into the parent state.
            // For this simplified port, the parent handles the state and passes it down via props.
          }}
        />
      </View>

      {/* Metrics UI */}
      <View className="h-48 bg-surface-2 p-4">
        <Text className="text-sm font-semibold text-foreground mb-4">Real-time Presence</Text>
        
        <View className="flex-row items-center justify-between py-1 border-b border-border">
          <Text className="text-sm text-muted-foreground">Eye Contact</Text>
          <Text className="text-sm font-medium text-foreground">
            {user?.persona === 'b2b_autism_user' ? 'Not Required' : `${metrics.engagement}%`}
          </Text>
        </View>

        <View className="flex-row justify-between mb-4">
          <View className="flex-1 mr-2">
            <Text className="text-[10px] uppercase text-muted-foreground mb-1">Engagement</Text>
            <View className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <View className="h-full bg-engagement" style={{ width: `${metrics.engagement}%` }} />
            </View>
          </View>
          
          <View className="flex-1 mx-1">
            <Text className="text-[10px] uppercase text-muted-foreground mb-1">Comfort</Text>
            <View className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <View className="h-full bg-comfort" style={{ width: `${100 - metrics.anxiety}%` }} />
            </View>
          </View>

          <View className="flex-1 ml-2">
            <Text className="text-[10px] uppercase text-muted-foreground mb-1">Openness</Text>
            <View className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <View className="h-full bg-openness" style={{ width: `${metrics.smiling}%` }} />
            </View>
          </View>
        </View>

        <View className="mt-2">
          <Text className="text-xs text-muted-foreground">
            Dominant Emotion: <Text className="font-semibold text-foreground capitalize">{faceTop?.name || 'Neutral'}</Text>
          </Text>
          <Text className="text-xs text-muted-foreground">
            Coach Status: <Text className="font-semibold text-foreground">{evi}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};
