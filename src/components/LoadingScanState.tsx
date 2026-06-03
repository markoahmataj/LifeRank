// src/components/LoadingScanState.tsx
// Cinematic loader used during: calibration result computation, weekly
// report compilation, OS-insight generation. Looks like a radar sweep
// + scan-line readout.

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLG, Stop } from 'react-native-svg';

import type { RankTier } from '../design-system/types';
import { fonts, surface, alpha, spacing } from '../design-system/tokens';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface LoadingScanStateProps {
  tier: RankTier;
  /** Multi-line scan readout — pass 1–3 lines max. */
  lines: string[];
  /** Optional headline above the scanner. */
  status?: string;
  size?: number;
}

export function LoadingScanState({
  tier,
  lines,
  status = 'SCANNING · ANALYZING',
  size = 180,
}: LoadingScanStateProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(Animated.timing(spin, {
      toValue: 1,
      duration: 2400,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    const pulseLoop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [spin, pulse]);

  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={styles.root}>
      <Text style={[styles.status, { color: tier.primary }]}>{status}</Text>

      <View style={[styles.scanner, { width: size, height: size }]}>
        {/* base concentric rings */}
        <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
          {[40, 30, 20, 10].map(r => (
            <Circle key={r} cx={50} cy={50} r={r}
              stroke={alpha(tier.primary, 0.18)} strokeWidth={0.5} fill="none"/>
          ))}
          {/* cross-hair */}
          <Path d="M50 6 V94 M6 50 H94" stroke={alpha(tier.primary, 0.12)} strokeWidth={0.4}/>
          {/* center dot */}
          <Circle cx={50} cy={50} r={1.6} fill={tier.primary}/>
        </Svg>

        {/* rotating sweep */}
        <AnimatedView style={[StyleSheet.absoluteFill, { transform: [{ rotate: rot }] }]}>
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <SvgLG id="sweep" x1="50%" y1="50%" x2="100%" y2="50%">
                <Stop offset="0%"   stopColor={tier.primary} stopOpacity={0}/>
                <Stop offset="60%"  stopColor={tier.primary} stopOpacity={0.4}/>
                <Stop offset="100%" stopColor={tier.primary} stopOpacity={0.85}/>
              </SvgLG>
            </Defs>
            <Path d="M50 50 L 92 50 A 42 42 0 0 0 75 12 Z" fill="url(#sweep)"/>
          </Svg>
        </AnimatedView>

        {/* pulsing core glow */}
        <AnimatedView style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx={50} cy={50} r={6} fill={tier.primary} opacity={0.35}/>
            <Circle cx={50} cy={50} r={12} fill={tier.primary} opacity={0.18}/>
            <Circle cx={50} cy={50} r={22} fill={tier.primary} opacity={0.08}/>
          </Svg>
        </AnimatedView>
      </View>

      <View style={styles.readout}>
        {lines.map((line, i) => (
          <View key={i} style={styles.readoutLine}>
            <View style={[styles.readoutDot, { backgroundColor: tier.primary }]}/>
            <Text style={styles.readoutText}>{line}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', paddingVertical: spacing.xl, gap: 20 },
  status: {
    fontFamily: fonts.monoBold,
    fontSize: 10.5,
    letterSpacing: 2,
    fontWeight: '600',
  },
  scanner: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  readout: { gap: 6, alignItems: 'flex-start' },
  readoutLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readoutDot: { width: 4, height: 4, borderRadius: 2 },
  readoutText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: alpha('#fff', 0.75),
    letterSpacing: 0.4,
  },
});
