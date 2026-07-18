import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '../ui/Button';
import { topics, type TopicId } from '../../lib/topics';
import { LESSON_LENGTHS, type LessonLength } from '../../lib/phases';
import { Coffee, Users, Flame, Megaphone, Check, Clock } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

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

export const ScenarioPicker = ({ selected, onSelect, length, onLengthChange, onContinue }: Props) => {
  return (
    <View className="w-full bg-background py-8 px-6">
      <View className="items-center mb-6">
        <Image 
          source={require('../../../assets/images/sg_app_small.png')} 
          style={{ width: 48, height: 48, marginBottom: 16 }}
          contentFit="contain"
        />
        <Text className="text-3xl font-semibold tracking-tight text-foreground text-center">
          What do you want to train?
        </Text>
        <Text className="mt-3 text-base text-muted-foreground text-center px-4">
          Pick a topic. Your coach will invent a real situation, watch you handle it,
          then show you another way.
        </Text>
      </View>

      {/* Lesson length */}
      <View className="mt-4 flex-col items-center mb-8">
        <View className="flex-row items-center mb-3">
          <Clock size={14} color={COLORS.mutedForeground} />
          <Text className="ml-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            How long do you want to train?
          </Text>
        </View>
        
        <View className="flex-row rounded-full border border-border bg-surface p-1">
          {LESSON_LENGTHS.map((len) => {
            const active = length === len;
            return (
              <Pressable
                key={len}
                onPress={() => onLengthChange(len)}
                className={`rounded-full px-5 py-2 ${active ? 'bg-primary' : 'bg-transparent'}`}
              >
                <Text className={`text-sm font-semibold ${
                  active ? "text-primary-foreground" : "text-muted-foreground"
                }`}>
                  {len} min
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-col space-y-4">
        {topics.filter(t => t.persona === 'b2c_user').map((s) => {
          const Icon = iconFor(s.icon);
          const isSelected = selected === s.id;
          
          return (
            <Pressable
              key={s.id}
              onPress={() => onSelect(s.id)}
              className={`flex-row w-full items-start rounded-2xl border p-5 mb-4 ${
                isSelected ? 'bg-surface-2 border-primary' : 'bg-surface border-border'
              }`}
            >
              <View
                className={`h-12 w-12 items-center justify-center rounded-xl mr-4 ${
                  isSelected ? "bg-primary" : "bg-muted"
                }`}
              >
                <Icon size={20} color={isSelected ? COLORS.primaryForeground : COLORS.foreground} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-lg font-semibold text-foreground">{s.shortLabel}</Text>
                  {isSelected && <Check size={16} color={COLORS.primary} />}
                </View>
                <Text className="text-sm text-foreground/80">{s.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text className="mt-6 mb-8 text-center text-xs text-muted-foreground">
        All sessions are AI-simulated. No real person is on the other end.
      </Text>

      <View className="items-center mb-8">
        <Button
          size="lg"
          disabled={!selected}
          onPress={onContinue}
          className={`w-full max-w-sm rounded-full ${!selected ? 'opacity-40' : ''}`}
        >
          Let's go
        </Button>
      </View>
    </View>
  );
};
