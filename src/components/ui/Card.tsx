import React from 'react';
import { View, Text, ViewProps, TextProps } from 'react-native';

export function Card({ className = '', children, ...props }: ViewProps) {
  return (
    <View className={`rounded-xl border border-border bg-card shadow-sm ${className}`} {...props}>
      {children}
    </View>
  );
}

export function CardHeader({ className = '', children, ...props }: ViewProps) {
  return (
    <View className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
      {children}
    </View>
  );
}

export function CardTitle({ className = '', children, ...props }: TextProps) {
  return (
    <Text className={`text-2xl font-semibold leading-none tracking-tight text-card-foreground ${className}`} {...props}>
      {children}
    </Text>
  );
}

export function CardContent({ className = '', children, ...props }: ViewProps) {
  return (
    <View className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </View>
  );
}
