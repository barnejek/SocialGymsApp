import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '../ui/Button';
import { topics, type TopicId } from '../../lib/topics';
import { LESSON_LENGTHS, type LessonLength } from '../../lib/phases';
import { Coffee, Users, Flame, Megaphone, Check, Clock } from 'lucide-react-native';
import { personaTheme } from '../../constants/themes';

// This picker only ever renders for the autism persona — use its calm palette
// for the icon colors that can't take a token class.
const CALM = personaTheme('b2b_autism_user').colors;

const iconFor = (icon: string) => {
  if (icon === "users") return Users;
  if (icon === "flame") return Flame;
  if (icon === "megaphone") return Megaphone;
  return Coffee;
};

interface Props {
  selected: TopicId | null;
  onSelect: (id: TopicId) => void;
  length: LessonLength;
  onLengthChange: (len: LessonLength) => void;
  onContinue: () => void;
}

export const AutismScenarioPicker = ({ selected, onSelect, length, onLengthChange, onContinue }: Props) => {
  return (
    <View className="w-full bg-background py-8 px-6">
      <View className="items-center mb-8">
        <Image 
          source={require('../../../assets/images/sg_app_small.png')} 
          style={{ width: 64, height: 64, marginBottom: 16 }}
          contentFit="contain"
        />
        <Text className="text-3xl font-bold tracking-tight text-foreground text-center">
          What are we playing today?
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-between">
        {topics.filter(t => t.persona === 'b2b_autism_user').map((s) => {
          const Icon = iconFor(s.icon);
          const isSelected = selected === s.id;
          
          return (
            <Pressable
              key={s.id}
              onPress={() => onSelect(s.id)}
              style={{ width: '48%', aspectRatio: 1, transform: [{ scale: isSelected ? 1.03 : 1 }] }}
              className={`items-center justify-center rounded-3xl border-4 p-4 mb-4 ${
                isSelected ? 'bg-primary border-ring' : 'bg-surface border-border'
              }`}
            >
              {/* Selection is never color-only: checkmark badge + slight scale. */}
              {isSelected && (
                <View className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background items-center justify-center">
                  <Check size={20} color={CALM.primary} />
                </View>
              )}
              <View className="mb-4">
                <Icon size={48} color={isSelected ? '#ffffff' : CALM.mutedForeground} />
              </View>
              <Text className={`text-center font-bold text-lg ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                {s.shortLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="items-center mt-8 mb-8 w-full">
        <Pressable
          disabled={!selected}
          onPress={onContinue}
          className={`w-full h-20 rounded-full items-center justify-center ${!selected ? 'opacity-40 bg-muted' : 'bg-primary'}`}
        >
          <Text className="text-2xl font-bold text-primary-foreground">Start Game!</Text>
        </Pressable>
      </View>
    </View>
  );
};
