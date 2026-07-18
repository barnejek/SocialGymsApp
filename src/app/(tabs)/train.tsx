import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, View, BackHandler, TouchableOpacity, Text } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Swords } from 'lucide-react-native';
import { useAuth } from '../../components/AuthProvider';
import { useGamification, progressMapOf } from '../../components/GamificationProvider';
import { completeSession } from '../../lib/gamification';
import { ScenarioPicker } from '../../components/social-gyms/ScenarioPicker';
import { AutismScenarioPicker } from '../../components/social-gyms/AutismScenarioPicker';
import { EnterpriseScenarioPicker } from '../../components/social-gyms/EnterpriseScenarioPicker';
import { Results, type SessionResult } from '../../components/social-gyms/Results';
import { GymSessionComplete } from '../../components/gym/GymSessionComplete';
import { ChildCelebration } from '../../components/gym/ChildCelebration';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  topics,
  difficultyForMastery,
  type DifficultyLevel,
  type TopicId,
} from '../../lib/topics';
import { DEFAULT_LESSON_LENGTH, type LessonLength } from '../../lib/phases';
import { TrinityCoachSession } from '../../components/social-gyms/TrinityCoachSession';

type Stage = "setup" | "session" | "results";

const TAB_BAR_STYLE = {
  backgroundColor: '#0f172a',
  borderTopColor: '#1e293b',
} as const;

/** Gamification context for the session being played (which skill, at what difficulty). */
interface GymContext {
  skillId: string;
  difficulty: DifficultyLevel;
  levelAttempted: number;
  challenge: boolean;
}

const DIFFICULTY_WORD: Record<DifficultyLevel, string> = {
  base: 'Training',
  silver: 'Silver attempt',
  gold: 'Gold attempt',
};

export default function Index() {
  const [stage, setStage] = useState<Stage>("setup");
  const [topicId, setTopicId] = useState<TopicId | null>(null);
  const [lessonLength, setLessonLength] = useState<LessonLength>(DEFAULT_LESSON_LENGTH);
  const [result, setResult] = useState<SessionResult | null>(null);
  const { user, logout } = useAuth();
  const { state, refresh } = useGamification();
  const navigation = useNavigation();
  const router = useRouter();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraGranted = cameraPermission?.granted === true;

  // ── Gym launch (skill tree node → train with topic + difficulty preselected) ─
  const params = useLocalSearchParams<{
    skill?: string;
    topic?: string;
    difficulty?: string;
    level?: string;
    challenge?: string;
  }>();

  const gymLaunch = useMemo<(GymContext & { topicId: TopicId }) | null>(() => {
    const skillId = typeof params.skill === 'string' ? params.skill : null;
    const topic = typeof params.topic === 'string' ? (params.topic as TopicId) : null;
    if (!skillId || !topic || !topics.some((t) => t.id === topic)) return null;
    const d = params.difficulty;
    const difficulty: DifficultyLevel = d === 'silver' || d === 'gold' ? d : 'base';
    const levelAttempted = Math.max(1, Math.min(3, Number(params.level) || 1));
    return { skillId, topicId: topic, difficulty, levelAttempted, challenge: params.challenge === '1' };
  }, [params.skill, params.topic, params.difficulty, params.level, params.challenge]);

  // Preselect the topic when arriving from the skill tree.
  useEffect(() => {
    if (gymLaunch) setTopicId(gymLaunch.topicId);
  }, [gymLaunch]);

  const clearGymParams = () => {
    if (gymLaunch) {
      router.setParams({
        skill: undefined,
        topic: undefined,
        difficulty: undefined,
        level: undefined,
        challenge: undefined,
      } as never);
    }
  };

  // Resolve the gamification context for the CURRENT selection: an explicit gym
  // launch wins; otherwise b2c picker topics map to their gym skill so ordinary
  // sessions still earn XP/streak/quests.
  const gymCtx = useMemo<GymContext | null>(() => {
    if (!topicId) return null;
    if (gymLaunch && gymLaunch.topicId === topicId) return gymLaunch;
    if (!state) return null;
    const skill = state.skills.find((s) => s.topic_id === topicId);
    if (!skill) return null;
    const mastery = progressMapOf(state)[skill.id]?.mastery ?? 0;
    return {
      skillId: skill.id,
      difficulty: difficultyForMastery(mastery),
      levelAttempted: Math.min(3, mastery + 1),
      challenge: false,
    };
  }, [topicId, gymLaunch, state]);

  const isChild = user?.persona === 'b2b_autism_user';
  // b2c sessions with a mapped skill are graded once server-side via
  // complete-session; the child persona never sees numeric scores at all.
  const gamified = user?.persona === 'b2c_user' && gymCtx !== null;
  const skipScoring = gamified || isChild;

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

  const backToSetup = () => {
    setResult(null);
    clearGymParams();
    setStage('setup');
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

  const handleComplete = (r: SessionResult) => {
    setResult(r);
    setStage('results');

    // Autism persona: the reward machinery records silently for the carer
    // portal — the child only ever sees the star screen.
    if (isChild && gymCtx) {
      completeSession({
        skillId: gymCtx.skillId,
        levelAttempted: gymCtx.levelAttempted,
        topicLabel: r.topic.label,
        northStar: r.topic.northStar,
        scenario: r.scenario,
        attempt1: r.attempt1,
        attempt2: r.attempt2,
        presence: r.presence,
      })
        .then(() => void refresh())
        .catch(() => {});
    }
  };

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

            {gymLaunch && (
              <View className="mx-6 mt-10 mb-2 flex-row items-center rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3">
                <Swords size={16} color="#F5A340" />
                <Text className="ml-2 flex-1 text-sm text-foreground">
                  {gymLaunch.challenge
                    ? 'Challenge attempt — one shot today. Gold standard unlocks the skill.'
                    : `${DIFFICULTY_WORD[gymLaunch.difficulty]} — topic preselected from your path.`}
                </Text>
              </View>
            )}

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
            difficulty={gamified ? gymCtx!.difficulty : 'base'}
            skipScoring={skipScoring}
            onComplete={handleComplete}
          />
        </View>
      )}

      {/* ── Results (persona-aware) ───────────────────────────────────────── */}
      {stage === "results" && result && isChild && (
        <ChildCelebration onDone={backToSetup} />
      )}

      {stage === "results" && result && !isChild && gamified && (
        <GymSessionComplete
          result={result}
          skillId={gymCtx!.skillId}
          levelAttempted={gymCtx!.levelAttempted}
          onTrainAgain={() => {
            setResult(null);
            setStage('setup');
          }}
          onBackToGym={() => {
            backToSetup();
            router.push('/(tabs)/skills' as never);
          }}
        />
      )}

      {stage === "results" && result && !isChild && !gamified && (
        <Results result={result} onTryAnother={backToSetup} />
      )}
    </SafeAreaView>
  );
}
