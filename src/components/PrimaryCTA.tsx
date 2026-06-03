// src/components/PrimaryCTA.tsx
// Primary action button with gradient fill + shimmer animation.

import React, { useEffect, useRef, type ReactNode } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { RankTier } from '../design-system/types';
import { fonts, radius, alpha } from '../design-system/tokens';

interface PrimaryCTAProps {
  label: string;
  onPress?: () => void;
  tier: RankTier;
  size?: 'lg' | 'md';
  icon?: ReactNode;
  full?: boolean;
  disabled?: boolean;
}

export function PrimaryCTA({
  label,
  onPress,
  tier,
  size = 'lg',
  icon,
  full = false,
  disabled = false,
}: PrimaryCTAProps) {
  const shimmerX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (disabled) return;
    const anim = Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 2,
        duration: 2800,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [disabled, shimmerX]);

  const height = size === 'lg' ? 56 : 44;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { height, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        full && styles.full,
      ]}
    >
      <LinearGradient
        colors={[tier.primary, tier.mid, tier.far]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Shimmer */}
      {!disabled && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [
                {
                  translateX: shimmerX.interpolate({
                    inputRange: [-1, 2],
                    outputRange: [-100, 300],
                  }),
                },
              ],
            },
          ]}
        />
      )}

      <View style={styles.content}>
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text style={[styles.label, size === 'md' && styles.labelMd]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  full: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
  },
  labelMd: {
    fontSize: 13,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ skewX: '-20deg' }],
  },
});
