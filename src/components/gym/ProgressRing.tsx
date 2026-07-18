import React, { useEffect, useRef, type ReactNode } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Raw values for the design tokens (react-native-svg needs literal colors).
export const RING_COLORS = {
  primary: '#F5A340', //   --primary
  engagement: '#4ECB71', // --engagement
  comfort: '#F5A340', //   --comfort
  openness: '#3B9EF5', //  --openness
  track: '#262d44', //     --muted
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#F5C842',
} as const;

/**
 * Generic SVG progress ring, mirror of the web component. `value` is 0–100.
 * Pass animate={false} for reduced motion (value snaps instead of sweeping).
 */
export const ProgressRing = ({
  value,
  size = 64,
  stroke = 6,
  color = RING_COLORS.primary,
  animate = true,
  children,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  animate?: boolean;
  children?: ReactNode;
  /** Accessible name, e.g. "Level progress 40%". */
  label?: string;
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));

  const progress = useRef(new Animated.Value(animate ? 0 : clamped)).current;
  useEffect(() => {
    if (!animate) {
      progress.setValue(clamped);
      return;
    }
    Animated.timing(progress, {
      toValue: clamped,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [clamped, animate, progress]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [c, 0],
  });

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="image"
      accessibilityLabel={label ?? `${Math.round(clamped)}%`}
    >
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={RING_COLORS.track}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={`${c}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      {children != null && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
};

/**
 * Mastery medal ring: three arc segments (bronze/silver/gold). Segment k
 * lights up when mastery > k. Used on skill tree nodes — mirror of the web
 * MedalRing.
 */
export const MedalRing = ({
  mastery,
  size = 56,
  stroke = 4,
  children,
}: {
  mastery: number; // 0-3
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = c * 0.04;
  const seg = c / 3 - gap;
  const levels = ['bronze', 'silver', 'gold'] as const;
  const label =
    mastery >= 3
      ? 'Gold mastery'
      : mastery >= 2
        ? 'Silver mastery'
        : mastery >= 1
          ? 'Bronze mastery'
          : 'Not yet mastered';

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {levels.map((lvl, i) => (
          <Circle
            key={lvl}
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            stroke={mastery > i ? RING_COLORS[lvl] : RING_COLORS.track}
            strokeDasharray={`${seg} ${c - seg}`}
            strokeDashoffset={-(i * (seg + gap)) - gap / 2}
          />
        ))}
      </Svg>
      {children != null && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
};
