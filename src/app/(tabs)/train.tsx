import React, { useState, useEffect } from 'react';
import { ScrollView, View, BackHandler, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../../components/AuthProvider';
import { recordSessionComplete } from '../../lib/gamification';
import { ScenarioPicker } from '../../components/social-gyms/ScenarioPicker';
import { AutismScenarioPicker } from '../../components/social-gyms/AutismScenarioPicker';
import { EnterpriseScenarioPicker } from '../../components/social-gyms/EnterpriseScenarioPicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { topics, type TopicId } from '../../lib/topics';
import { DEFAULT_LESSON_LENGTH, type LessonLength } from '../../lib/phases';
import { TrinityCoachSession } from '../../components/social-gyms/TrinityCoachSession';

type Stage = "setup" | "session" | "results";

export default function Index() {
  const [stage, setStage] = useState<Stage>("setup");
  const [topicId, setTopicId] = useState<TopicId | null>(null);
  const [lessonLength, setLessonLength] = useState<LessonLength>(DEFAULT_LESSON_LENGTH);
  const { user, logout } = useAuth();

  const handleStart = () => setStage("setup");
  const handleContinue = () => {
    if (!topicId) return;
    setStage("session");
  };

  useEffect(() => {
    const backAction = () => {
      if (stage === 'setup') {
        return false; // Let router handle going back to Home
      }
      if (stage === 'session') {
        setStage('setup');
        return true;
      }
      if (stage === 'results') {
        setStage('setup');
        return true;
      }
      return false; // Let the default back behavior happen (exit app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [stage]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1">
        <View className="flex-1 relative pt-4">
          <TouchableOpacity onPress={logout} className="absolute top-2 right-6 z-10 px-4 py-2 bg-surface rounded-full border border-border">
            <Text className="text-xs text-foreground font-medium">Switch Persona</Text>
          </TouchableOpacity>
          
          {stage === "setup" && (
            <>
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
            </>
          )}

          {stage === "session" && topicId && (
            <View className="flex-1 min-h-[800px]">
              <TrinityCoachSession
                topic={topics.find((t: any) => t.id === topicId)!}
                lessonLength={lessonLength}
                active={stage === "session"}
                onComplete={(r: any) => {
                  recordSessionComplete(85); // Dummy presence score
                  setStage("results");
                }}
              />
            </View>
          )}

          {stage === "results" && (
            <View className="flex-1 items-center justify-center p-6 min-h-[600px]">
              <Text className="text-3xl font-bold text-foreground mb-4">Training Complete!</Text>
              <Text className="text-muted-foreground text-center mb-8">
                Great job stepping out of your comfort zone.
              </Text>
              <TouchableOpacity onPress={() => setStage("setup")} className="bg-primary px-6 py-3 rounded-full">
                <Text className="text-primary-foreground font-bold">Back to Scenarios</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
