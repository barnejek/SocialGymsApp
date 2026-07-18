import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { RewardSequence } from './RewardSequence';
import { Results, type SessionResult } from '../social-gyms/Results';
import { useGamification } from '../GamificationProvider';
import { completeSession, type CompleteSessionResult } from '../../lib/gamification';
import type { ScoreResult } from '../../lib/chat';
import { COLORS } from '../../constants/colors';

// ---------------------------------------------------------------------------
// End-of-session flow for gamified sessions: sends both attempts to the
// complete-session edge function (which grades AND applies all rewards
// server-side), plays the staged RewardSequence, then lands on the debrief.
// Mirror of the web GymSessionComplete.
// ---------------------------------------------------------------------------

interface Props {
  result: SessionResult;
  skillId: string;
  levelAttempted: number;
  onTrainAgain: () => void;
  onBackToGym: () => void;
}

type Phase = 'scoring' | 'sequence' | 'debrief' | 'error';

export const GymSessionComplete = ({
  result,
  skillId,
  levelAttempted,
  onTrainAgain,
  onBackToGym,
}: Props) => {
  const { state, refresh } = useGamification();
  const [phase, setPhase] = useState<Phase>('scoring');
  const [outcome, setOutcome] = useState<CompleteSessionResult | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    completeSession({
      skillId,
      levelAttempted,
      topicLabel: result.topic.label,
      northStar: result.topic.northStar,
      scenario: result.scenario,
      attempt1: result.attempt1,
      attempt2: result.attempt2,
      presence: result.presence,
    })
      .then((r) => {
        setOutcome(r);
        setPhase('sequence');
        void refresh(); // HUD / quests / tree update behind the overlay
      })
      .catch(() => setPhase('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'scoring') {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <ActivityIndicator size="large" color={COLORS.primary} accessibilityLabel="Scoring your session" />
        <Text className="mt-6 text-sm text-muted-foreground">
          Your coach is scoring both attempts…
        </Text>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg font-semibold text-foreground text-center">
          Your practice counts — scoring just didn't reach the server.
        </Text>
        <Text className="mt-2 text-sm text-muted-foreground text-center max-w-[320px]">
          Nothing is lost. Check your connection and head back to the gym; your next
          session picks up where you left off.
        </Text>
        <TouchableOpacity
          onPress={onBackToGym}
          className="mt-6 bg-primary rounded-full px-8 py-3.5"
          accessibilityLabel="Back to the gym"
        >
          <Text className="text-primary-foreground font-bold">Back to the gym</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!outcome) return null;
  const { feedback, rewards } = outcome;

  // The debrief reuses the classic Results screen, fed from the server-graded
  // payload (rewards carry both attempts' axis scores; feedback the prose).
  const scoring: ScoreResult = {
    attempt1: rewards.scores.attempt1,
    attempt2: rewards.scores.attempt2,
    coachRead: feedback.coachRead,
    didWell: feedback.didWell,
    tryNext: feedback.tryNext,
    improvement: feedback.improvement,
  };

  return (
    <View className="flex-1">
      <Results result={{ ...result, scoring }} onTryAnother={onTrainAgain} />
      {phase === 'sequence' && (
        <RewardSequence
          rewards={rewards}
          questDefs={state?.quests ?? []}
          achievementDefs={state?.achievements ?? []}
          onDone={() => setPhase('debrief')}
        />
      )}
    </View>
  );
};
