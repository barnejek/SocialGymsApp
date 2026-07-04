import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Repeat2, Dumbbell, MessagesSquare, Eye } from 'lucide-react-native';

/**
 * The Science screen — the mobile counterpart of the web landing page's
 * "Method" section. Its whole job is to make us look credible in the ~10
 * seconds a viewer spends here: this is a validated training protocol, not a
 * chatbot with a personality. Kept scannable — big claim, the 6-phase circuit
 * as chips, four evidence pillars, one citations line.
 */

const PRIMARY = '#F5A340'; // hsl(30 92% 61%)

const STEPS: Array<{ n: number; label: string; method: string }> = [
  { n: 1, label: 'Setup', method: 'One sub-skill, one scene' },
  { n: 2, label: 'First try', method: 'Behavioral rehearsal' },
  { n: 3, label: 'Feedback', method: 'Performance feedback' },
  { n: 4, label: 'Watch coach', method: 'Modeling' },
  { n: 5, label: 'Try again', method: 'Re-rehearsal' },
  { n: 6, label: 'Debrief', method: 'Homework + Golden Rule' },
];

const PILLARS: Array<{ icon: any; title: string; body: string }> = [
  {
    icon: Repeat2,
    title: 'Behavioral rehearsal',
    body:
      "You don't read about conversations — you run them, out loud, under realistic pressure. Rehearse → feedback → model → rehearse is the core loop of clinical Social Skills Training (Bellack; UCLA PEERS®).",
  },
  {
    icon: Dumbbell,
    title: 'Deliberate practice',
    body:
      'Every session trains exactly one sub-skill — an opener, a label, one clear point. Narrow focus with immediate feedback is how experts actually improve (Ericsson).',
  },
  {
    icon: MessagesSquare,
    title: 'Feedback that names behavior',
    body:
      'Your coach quotes what you actually said, names its impact, and gives you one replacement behavior — never a lecture, never vague praise.',
  },
  {
    icon: Eye,
    title: 'A coach who sees you',
    body:
      'Live face analysis reads engagement, comfort and openness while you speak, adapting the scene to keep you in the stretch zone (graded exposure, after Clark & Wells). It runs on-device.',
  },
];

export default function ScienceScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero claim */}
        <View className="px-2 mb-8">
          <Text className="text-xs font-bold uppercase tracking-[3px] text-primary mb-3">
            The Method
          </Text>
          <Text className="text-3xl font-bold text-foreground leading-tight">
            A training protocol,{'\n'}not a chatbot.
          </Text>
          <Text className="text-muted-foreground mt-3 leading-relaxed">
            Every session runs the same six-phase circuit used in clinical
            social-skills training — enforced by the clock, so your coach can
            never drift into small talk when you should be doing reps.
          </Text>
        </View>

        {/* 6-phase circuit */}
        <View className="flex-row flex-wrap justify-between mb-8">
          {STEPS.map((s) => (
            <View
              key={s.n}
              className="w-[31.5%] rounded-2xl border border-border bg-surface px-2 py-4 items-center mb-3"
            >
              <View className="h-7 w-7 rounded-full items-center justify-center bg-primary/15 mb-2">
                <Text className="text-xs font-bold text-primary">{s.n}</Text>
              </View>
              <Text className="text-sm font-semibold text-foreground text-center">{s.label}</Text>
              <Text className="text-[10px] text-muted-foreground text-center mt-1 leading-snug">
                {s.method}
              </Text>
            </View>
          ))}
        </View>

        {/* Evidence pillars */}
        <View className="mb-6">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <View key={title} className="rounded-2xl border border-border bg-surface p-5 mb-3">
              <View className="flex-row items-center mb-3">
                <View className="h-9 w-9 rounded-full items-center justify-center bg-primary/10 mr-3">
                  <Icon size={18} color={PRIMARY} />
                </View>
                <Text className="text-base font-semibold text-foreground flex-1">{title}</Text>
              </View>
              <Text className="text-sm text-muted-foreground leading-relaxed">{body}</Text>
            </View>
          ))}
        </View>

        {/* Citations */}
        <Text className="text-[11px] text-muted-foreground/70 text-center leading-relaxed px-4">
          Informed by 40+ years of social-skills research: behavioral rehearsal &
          performance feedback (Bellack; UCLA PEERS®), deliberate practice
          (Ericsson), graded exposure for social confidence (Clark & Wells), and
          tactical empathy (Voss). Face analysis runs entirely on your device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
