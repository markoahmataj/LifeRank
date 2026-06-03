// src/components/EnergyBar.tsx
// Animated shimmer progress bar used for scores, mission progress, etc.

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { RankTier } from '../design-system/types';
import { surface } from '../design-system/tokens';

interface EnergyBarProps {
  /** 0–100 */
  value: number;
  max?: number;
  tier: RankTier;
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  length?: number;
  shimmer?: boolean;
  colors?: [string, string, string];
}

export function EnergyBar({
  value,
  max = 100,
  tier,
  orientation = 'horizontal',
  thickness = 6,
  length,
  shimmer = true,
  colors,
}: EnergyBarProps) {
  const shimmerX = useRef(new Animated.Value(-1)).current;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  useEffect(() => {
    if (!shimmer) return;
    const anim = Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 2,
        duration: 2200,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer, shimmerX]);

  const gradColors = colors ?? [tier.primary, tier.mid, tier.far];

  if (orientation === 'vertical') {
    const h = length ?? 80;
    return (
      <View style={[styles.trackV, { width: thickness, height: h }]}>
        <View style={[styles.fillContainerV, { height: `${pct}%` }]}>
          <LinearGradient
            colors={gradColors}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.track, { height: thickness, width: length ? length : undefined }]}>
      <View style={[styles.fillContainer, { width: `${pct}%` }]}>
        <LinearGradient
          colors={gradColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {shimmer && (
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [
                  {
                    translateX: shimmerX.interpolate({
                      inputRange: [-1, 2],
                      outputRange: [-80, 200],
                    }),
                  },
                ],
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: surface.hairlineSoft,
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  fillContainer: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
  },
  trackV: {
    backgroundColor: surface.hairlineSoft,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fillContainerV: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
});
