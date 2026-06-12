import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '../ui/Button';
import { LinearGradient } from 'expo-linear-gradient';

export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <View className="px-6 py-20 flex-1 justify-center items-center">
      <View className="bg-primary/10 rounded-full px-4 py-1.5 mb-8">
        <Text className="text-primary font-medium text-sm">Powered by Gemini Live</Text>
      </View>
      
      <View style={{ width: '100%', aspectRatio: 1709 / 902 }} className="relative mb-6">
        <Image 
          source={require('../../../assets/images/sg_app_big.png')} 
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
        />
        <LinearGradient 
          colors={['#0e1424', 'rgba(21, 22, 40, 0)', 'rgba(21, 22, 40, 0)', '#0e1424']} 
          locations={[0, 0.4, 0.6, 1]}
          className="absolute inset-0 pointer-events-none" 
        />
        <LinearGradient 
          colors={['#0e1424', 'rgba(21, 22, 40, 0)', 'rgba(21, 22, 40, 0)', '#0e1424']} 
          locations={[0, 0.25, 0.75, 1]}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}
          className="absolute inset-0 pointer-events-none" 
        />
      </View>
      
      <Text className="text-4xl font-bold text-center mb-6 text-foreground">
        Master High-Stakes Interactions
      </Text>
      
      <Text className="text-lg text-muted-foreground text-center mb-10 px-4">
        Practice critical conversations in a safe, AI-driven environment. 
        Real-time feedback on your voice and expressions.
      </Text>
      
      <Button size="lg" onPress={onStart} className="w-full max-w-sm">
        Start Training Session
      </Button>
    </View>
  );
}
