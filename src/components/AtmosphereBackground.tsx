// src/components/AtmosphereBackground.tsx
// Radial atmospheric glow + optional HUD grid. Sits behind all screen content.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Pattern, Line, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import type { RankTier } from '../design-system/types';
import { surface } from '../design-system/tokens';

interface AtmosphereBackgroundProps {
  tier: RankTier;
  showGrid?: boolean;
  intensity?: number;
}

export function AtmosphereBackground({
  tier,
  showGrid = false,
  intensity = 1.0,
}: AtmosphereBackgroundProps) {
  const op = (base: number) => Math.min(1, base * intensity);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: surface.bg }]} />

      {/* Radial glow via SVG */}
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <RadialGradient id="g1" cx="50%" cy="20%" r="60%" fx="50%" fy="20%">
            <Stop offset="0%"   stopColor={tier.primary} stopOpacity={op(0.30)}/>
            <Stop offset="40%"  stopColor={tier.mid}     stopOpacity={op(0.18)}/>
            <Stop offset="100%" stopColor={tier.far}     stopOpacity={0}/>
          </RadialGradient>
          <RadialGradient id="g2" cx="80%" cy="70%" r="50%">
            <Stop offset="0%"   stopColor={tier.glow2} stopOpacity={op(1)}/>
            <Stop offset="100%" stopColor={tier.glow2} stopOpacity={0}/>
          </RadialGradient>
          <RadialGradient id="g3" cx="20%" cy="85%" r="45%">
            <Stop offset="0%"   stopColor={tier.glow3} stopOpacity={op(1)}/>
            <Stop offset="100%" stopColor={tier.glow3} stopOpacity={0}/>
          </RadialGradient>
        </Defs>

        {/* Glow circles */}
        <Circle cx={195} cy={170} r={320} fill="url(#g1)"/>
        <Circle cx={312} cy={590} r={220} fill="url(#g2)"/>
        <Circle cx={78}  cy={717} r={200} fill="url(#g3)"/>

        {/* Optional HUD grid */}
        {showGrid && (
          <>
            <Defs>
              <Pattern id="grid" width={32} height={32} patternUnits="userSpaceOnUse">
                <Line x1={0} y1={32} x2={32} y2={32} stroke="#fff" strokeOpacity={0.04} strokeWidth={0.5}/>
                <Line x1={32} y1={0} x2={32} y2={32} stroke="#fff" strokeOpacity={0.04} strokeWidth={0.5}/>
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#grid)"/>
          </>
        )}
      </Svg>

      {/* Bottom vignette */}
      <LinearGradient
        colors={['transparent', surface.bg]}
        style={[StyleSheet.absoluteFill, { top: undefined, height: 160 }]}
        pointerEvents="none"
      />
    </View>
  );
}
