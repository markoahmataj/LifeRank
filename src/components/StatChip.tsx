// src/components/StatChip.tsx
// Animated pulsing dot stat chip — used for system signals.

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { fonts, surface, alpha } from '../design-system/tokens';

interface StatChipProps {
  label: string;
  value: string;
  dotColor: string;
  staticDot?: boolean;
}

export function StatChip({ label, value, dotColor, staticDot = false }: StatChipProps) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (staticDot) return;
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 0.7,
            duration: 900,
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(scale, {
            toValue: 1.0,
            duration: 900,
            useNativeDriver: true,
            isInteraction: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 900,
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(opacity, {
            toValue: 1.0,
            duration: 900,
            useNativeDriver: true,
            isInteraction: false,
          }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [staticDot, scale, opacity]);

  return (
    <View style={styles.chip}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}/>
      <LinearGradient
        colors={[surface.glassFill, surface.glassFillAlt]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.border, { borderColor: surface.hairline }]}/>

      <View style={styles.inner}>
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: dotColor },
            { transform: [{ scale }], opacity },
          ]}
        />
        <View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    minWidth: 72,
  },
  border: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 12,
    borderWidth: 1,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: surface.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: fonts.monoBold,
    fontSize: 13,
    color: surface.textPrimary,
    fontWeight: '600',
    marginTop: 1,
  },
});
