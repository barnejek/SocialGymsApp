import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Star } from 'lucide-react-native';

// ---------------------------------------------------------------------------
// Autism-persona results screen (clinical requirement, ToDo.md §3): the child
// sees stars and "You did it!" — never percentages or numeric scores. The
// quantitative panel belongs in the carer portal / enterprise tracker.
// Gentle star pop-in only; no confetti, nothing sudden.
// ---------------------------------------------------------------------------

const PoppingStar = ({ delay, reduced }: { delay: number; reduced: boolean }) => {
  const scale = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    Animated.spring(scale, {
      toValue: 1,
      delay,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [scale, delay, reduced]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Star size={52} color="#F5C842" fill="#F5C842" />
    </Animated.View>
  );
};

export const ChildCelebration = ({ onDone }: { onDone: () => void }) => {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <View className="flex-1 items-center justify-center px-8 bg-background">
      <View className="flex-row gap-4 mb-8">
        {[0, 1, 2].map((i) => (
          <PoppingStar key={i} delay={300 + i * 350} reduced={reducedMotion} />
        ))}
      </View>
      <Text className="text-4xl font-bold text-foreground text-center">You did it!</Text>
      <Text className="text-lg text-muted-foreground text-center mt-4 leading-relaxed">
        Great practicing today. That was brave and kind.
      </Text>
      <TouchableOpacity
        onPress={onDone}
        accessibilityLabel="All done"
        className="mt-12 bg-primary rounded-full px-12 py-5"
      >
        <Text className="text-primary-foreground font-bold text-xl">All done!</Text>
      </TouchableOpacity>
    </View>
  );
};
