import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '../ui/Button';
import { topics, type TopicId } from '../../lib/topics';
import { LESSON_LENGTHS, type LessonLength } from '../../lib/phases';
import { Coffee, Users, Flame, Megaphone, Check, Clock } from 'lucide-react-native';

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
              style={{
                width: '48%',
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 24,
                borderWidth: 4,
                padding: 16,
                marginBottom: 16,
                backgroundColor: isSelected ? '#3b82f6' : '#1e293b',
                borderColor: isSelected ? '#60a5fa' : '#334155'
              }}
            >
              <View className="mb-4">
                <Icon size={48} color={isSelected ? "#ffffff" : "#94a3b8"} />
              </View>
              <Text className={`text-center font-bold text-lg ${isSelected ? 'text-white' : 'text-foreground'}`}>
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
          className={`w-full h-20 rounded-full items-center justify-center ${!selected ? 'opacity-40 bg-muted' : 'bg-green-500'}`}
        >
          <Text className="text-2xl font-bold text-white">Start Game!</Text>
        </Pressable>
      </View>
    </View>
  );
};
