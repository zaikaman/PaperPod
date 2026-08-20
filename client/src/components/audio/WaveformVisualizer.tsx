/**
 * Animated Audio Waveform Visualizer Component
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../theme';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  speaker?: 'alex' | 'taylor';
  color?: string;
  barCount?: number;
  height?: number;
}

const BAR_PATTERNS = [
  [0.3, 0.8, 0.5, 1.0, 0.6, 0.9, 0.4, 0.7, 0.3, 0.6, 0.8, 0.4, 0.9, 0.5, 0.3],
  [0.4, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7, 1.0, 0.5, 0.8, 0.3, 0.6, 0.9, 0.4, 0.5],
];

const WaveBar: React.FC<{
  index: number;
  isPlaying: boolean;
  color: string;
  maxHeight: number;
}> = ({ index, isPlaying, color, maxHeight }) => {
  const scaleY = useSharedValue(0.2);

  useEffect(() => {
    if (isPlaying) {
      const delay = (index % 5) * 80;
      const targetHigh = 0.35 + ((index * 7) % 10) * 0.065;
      const targetLow = 0.15 + ((index * 3) % 5) * 0.04;

      scaleY.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(targetHigh, { duration: 250 + (index % 3) * 60, easing: Easing.inOut(Easing.ease) }),
            withTiming(targetLow, { duration: 250 + (index % 4) * 50, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    } else {
      scaleY.value = withTiming(0.2, { duration: 300 });
    }
  }, [isPlaying, index, scaleY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: color,
          height: maxHeight,
        },
        animatedStyle,
      ]}
    />
  );
};

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  speaker = 'alex',
  color,
  barCount = 18,
  height = 36,
}) => {
  const activeColor =
    color ||
    (speaker === 'taylor' ? theme.colors.hostTaylor : theme.colors.primary);

  const bars = Array.from({ length: barCount });

  return (
    <View style={[styles.container, { height }]}>
      {bars.map((_, i) => (
        <WaveBar
          key={i}
          index={i}
          isPlaying={isPlaying}
          color={activeColor}
          maxHeight={height}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3.5,
    paddingHorizontal: 12,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
    opacity: 0.88,
  },
});
