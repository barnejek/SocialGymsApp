import React, { useState, useEffect } from 'react';
import { ScrollView, View, BackHandler, TouchableOpacity, Text } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { useAuth } from '../../components/AuthProvider';
import { recordSessionComplete } from '../../lib/gamification';
import { ScenarioPicker } from '../../components/social-gyms/ScenarioPicker';
import { AutismScenarioPicker } from '../../components/social-gyms/AutismScenarioPicker';
import { EnterpriseScenarioPicker } from '../../components/social-gyms/EnterpriseScenarioPicker';
import { Results, type SessionResult } from '../../components/social-gyms/Results';
import { SafeAreaView } from 'react-native-safe-area-context';
import { topics, type TopicId } from '../../lib/topics';
import { DEFAULT_LESSON_LENGTH, type LessonLength } from '../../lib/phases';
import { TrinityCoachSession } from '../../components/social-gyms/TrinityCoachSession';

type Stage = "setup" | "session" | "results";

export default function Index() {
  const [stage, setStage] = useState<Stage>("setup");
  const [topicId, setTopicId] = useState<TopicId | null>(null);
  const [lessonLength, setLessonLength] = useState<LessonLength>(DEFAULT_LESSON_LENGTH);
  const [result, setResult] = useState<SessionResult | null>(null);
  const { user, logout } = useAuth();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Resolve camera permission up front, on the pre-session setup screen, so
  // that by the time TrinityCoachSession / EmotionPanel mounts the permission
  // is already granted and the live feed shows immediately with no gate screen
  // mid-take. This is a general fix (all personas), not demo-only.
  useEffect(() => {
    if (stage !== 'setup') return;
    if (!cameraPermission) return; // still loading — resolves quickly
    if (!cameraPermission.granted && cameraPermission.canAskAgain) {
      void requestCameraPermission();
    }
  }, [stage, cameraPermission, requestCameraPermission]);

  const handleContinue = () => {
    if (!topicId) return;
    setStage("session");
  };

  useEffect(() => {
    const backAction = () => {
      if (stage === 'setup') return false; // Let router handle going back to Home
      setStage('setup');
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [stage]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* ── Setup: scrollable picker ──────────────────────────────────────── */}
      {stage === "setup" && (
        <ScrollView className="flex-1">
          <View className="flex-1 relative pt-4">
            <TouchableOpacity
              onPress={logout}
              className="absolute top-2 right-6 z-10 px-4 py-2 bg-surface rounded-full border border-border"
            >
              <Text className="text-xs text-foreground font-medium">Switch Persona</Text>
            </TouchableOpacity>

            {user?.persona === 'b2c_user' && (
              <ScenarioPicker
                selected={topicId}
                onSelect={setTopicId}
                length={lessonLength}
                onLengthChange={setLessonLength}
                onContinue={handleContinue}
              />
            )}
            {user?.persona === 'b2b_autism_user' && (
              <AutismScenarioPicker
                selected={topicId}
                onSelect={setTopicId}
                length={lessonLength}
                onLengthChange={setLessonLength}
                onContinue={handleContinue}
              />
            )}
            {user?.persona === 'b2b_educator' && (
              <EnterpriseScenarioPicker
                selected={topicId}
                onSelect={setTopicId}
                length={lessonLength}
                onLengthChange={setLessonLength}
                onContinue={handleContinue}
              />
            )}
          </View>
        </ScrollView>
      )}

      {/* ── Session: fixed full-height, NOT inside a ScrollView so the progress
           bar + avatar header stay pinned and the transcript scrolls internally. */}
      {stage === "session" && topicId && (
        <View className="flex-1">
          <TrinityCoachSession
            topic={topics.find((t) => t.id === topicId)!}
            lessonLength={lessonLength}
            active={stage === "session"}
            onComplete={(r) => {
              recordSessionComplete(Math.round((r.scoring.attempt2.engagement + r.scoring.attempt2.comfort + r.scoring.attempt2.openness) / 3));
              setResult(r);
              setStage("results");
            }}
          />
        </View>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {stage === "results" && result && (
        <Results result={result} onTryAnother={() => { setResult(null); setStage("setup"); }} />
      )}
    </SafeAreaView>
  );
}
