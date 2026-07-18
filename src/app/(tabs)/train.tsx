import React, { useState, useEffect } from 'react';
import { ScrollView, View, BackHandler, TouchableOpacity, Text } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import { useNavigation } from 'expo-router';
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

const TAB_BAR_STYLE = {
  backgroundColor: '#0f172a',
  borderTopColor: '#1e293b',
} as const;

export default function Index() {
  const [stage, setStage] = useState<Stage>("setup");
  const [topicId, setTopicId] = useState<TopicId | null>(null);
  const [lessonLength, setLessonLength] = useState<LessonLength>(DEFAULT_LESSON_LENGTH);
  const [result, setResult] = useState<SessionResult | null>(null);
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraGranted = cameraPermission?.granted === true;

  // Hide the tab bar during session/results so the footer CTA isn't blocked.
  useEffect(() => {
    const tabNav = navigation.getParent();
    if (!tabNav) return;
    tabNav.setOptions({
      tabBarStyle: stage === 'setup' ? TAB_BAR_STYLE : { display: 'none' },
    });
    return () => {
      tabNav.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [stage, navigation]);

  // Resolve camera + mic permissions up front on the pre-session setup screen
  // so TrinityCoachSession / EmotionPanel mount already granted.
  useEffect(() => {
    if (stage !== 'setup') return;
    if (!cameraPermission) return; // still loading — resolves quickly
    if (!cameraPermission.granted && cameraPermission.canAskAgain) {
      void requestCameraPermission();
    }
    void requestRecordingPermissionsAsync();
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
            cameraGranted={cameraGranted}
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
