import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Button } from '../ui/Button';
import { topics, type TopicId } from '../../lib/topics';
import { LESSON_LENGTHS, type LessonLength } from '../../lib/phases';
import { Coffee, Users, Flame, Megaphone, Check } from 'lucide-react-native';
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

export const EnterpriseScenarioPicker = ({ selected, onSelect, length, onLengthChange, onContinue }: Props) => {
  return (
    <View className="w-full bg-background py-8">
      <View className="px-6 mb-8">
        <Text className="text-3xl font-bold tracking-tight text-foreground">
          Corporate Training Modules
        </Text>
        <Text className="mt-2 text-base text-muted-foreground">
          Select a high-impact scenario to train your team. AI handles the simulation.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6 mb-12" contentContainerStyle={{ paddingRight: 40 }}>
        {topics.filter(t => t.persona === 'b2b_educator').map((s) => {
          const Icon = iconFor(s.icon);
          const isSelected = selected === s.id;
          
          return (
            <Pressable
              key={s.id}
              onPress={() => onSelect(s.id)}
              style={{ width: 280, height: 320 }}
              className={`rounded-2xl border-2 p-6 mr-4 justify-between ${
                isSelected ? 'bg-surface-2 border-primary' : 'bg-surface border-border'
              }`}
            >
              <View>
                <View
                  className={`h-16 w-16 items-center justify-center rounded-xl mb-6 ${
                    isSelected ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <Icon size={32} color={isSelected ? COLORS.primaryForeground : COLORS.foreground} />
                </View>
                <Text className="text-2xl font-bold text-foreground mb-3">{s.label}</Text>
                <Text className="text-sm text-foreground/70 leading-relaxed">{s.description}</Text>
              </View>
              
              <View className="flex-row items-center justify-between mt-4">
                <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                  {s.tag}
                </Text>
                {isSelected && <Check size={24} color={COLORS.primary} />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="items-center px-6 mb-8">
        <Pressable
          disabled={!selected}
          onPress={onContinue}
          className={`w-full rounded-xl py-4 items-center justify-center bg-primary ${!selected ? 'opacity-40' : ''}`}
        >
          <Text className="text-lg font-bold text-primary-foreground">Launch Module</Text>
        </Pressable>
      </View>
    </View>
  );
};
