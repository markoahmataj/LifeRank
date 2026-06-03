// src/components/RankEmblem.tsx
// Animated rank emblem: aura rings, tick ring, counter-arc, hex core, HUD brackets.

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, {
  Circle, Path, Line, Text as SvgText,
  Defs, LinearGradient as SvgLG, Stop, RadialGradient,
} from 'react-native-svg';

import type { RankTier } from '../design-system/types';
import { alpha } from '../design-system/tokens';

interface RankEmblemProps {
  tier: RankTier;
  size?: number;
  glyph?: string;
  animated?: boolean;
  intensity?: number;
}

export function RankEmblem({
  tier,
  size = 200,
  glyph,
  animated: enableAnim = true,
  intensity = 1.0,
}: RankEmblemProps) {
  const ringSpin  = useRef(new Animated.Value(0)).current;
  const arcSpin   = useRef(new Animated.Value(0)).current;
  const auraPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enableAnim) return;

    const ringAnim = Animated.loop(
      Animated.timing(ringSpin, {
        toValue: 1,
        duration: 28000,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    const arcAnim = Animated.loop(
      Animated.timing(arcSpin, {
        toValue: 1,
        duration: 18000,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    const auraAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(auraPulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(auraPulse, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );

    ringAnim.start();
    arcAnim.start();
    auraAnim.start();

    return () => {
      ringAnim.stop();
      arcAnim.stop();
      auraAnim.stop();
    };
  }, [enableAnim, ringSpin, arcSpin, auraPulse]);

  const ringRotate = ringSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const arcRotate = arcSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });
  const auraOpacity = auraPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25 * intensity, 0.55 * intensity],
  });

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.32;
  const coreR  = size * 0.24;

  // Hex polygon points
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + coreR * Math.cos(angle)},${cy + coreR * Math.sin(angle)}`;
  }).join(' ');

  // Tick marks on outer ring (60 marks)
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 60 - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const innerR2 = outerR - (isMajor ? size * 0.045 : size * 0.025);
    const x1 = cx + outerR * Math.cos(angle);
    const y1 = cy + outerR * Math.sin(angle);
    const x2 = cx + innerR2 * Math.cos(angle);
    const y2 = cy + innerR2 * Math.sin(angle);
    return { x1, y1, x2, y2, isMajor };
  });

  // HUD bracket size
  const bSize = size * 0.1;
  const bOff  = size * 0.04;
  const bPad  = outerR + bOff;

  return (
    <View style={{ width: size, height: size }}>
      {/* Aura pulse layer */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: auraOpacity,
            borderRadius: size / 2,
            backgroundColor: alpha(tier.primary, 0.15),
            transform: [{ scale: 1.15 }],
          },
        ]}
      />

      {/* Outer tick ring — spins */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: ringRotate }] }]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {ticks.map((t, i) => (
            <Line
              key={i}
              x1={t.x1} y1={t.y1}
              x2={t.x2} y2={t.y2}
              stroke={tier.primary}
              strokeWidth={t.isMajor ? 1.2 : 0.6}
              strokeOpacity={t.isMajor ? 0.9 : 0.4}
            />
          ))}
        </Svg>
      </Animated.View>

      {/* Counter-arc — spins reverse */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: arcRotate }] }]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={cx} cy={cy} r={innerR}
            fill="none"
            stroke={tier.mid}
            strokeWidth={0.8}
            strokeOpacity={0.55}
            strokeDasharray={`${innerR * 0.4} ${innerR * 0.12}`}
          />
        </Svg>
      </Animated.View>

      {/* Static core SVG */}
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgLG id={`hexGrad-${tier.id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor={tier.primary} stopOpacity={0.9}/>
            <Stop offset="50%"  stopColor={tier.mid}     stopOpacity={0.75}/>
            <Stop offset="100%" stopColor={tier.far}     stopOpacity={0.6}/>
          </SvgLG>
          <RadialGradient id={`coreGlow-${tier.id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={tier.primary} stopOpacity={0.25}/>
            <Stop offset="100%" stopColor={tier.primary} stopOpacity={0}/>
          </RadialGradient>
        </Defs>

        {/* Core glow */}
        <Circle cx={cx} cy={cy} r={coreR * 1.6} fill={`url(#coreGlow-${tier.id})`}/>

        {/* Hex fill */}
        <Path
          d={`M ${hexPoints.split(' ').map((p, i) => `${i === 0 ? '' : 'L '}${p}`).join(' ')} Z`}
          fill={`url(#hexGrad-${tier.id})`}
          fillOpacity={0.18}
          stroke={tier.primary}
          strokeWidth={1}
          strokeOpacity={0.8}
        />

        {/* Inner mesh lines */}
        {[0, 1, 2].map(i => {
          const a1 = (Math.PI / 3) * i - Math.PI / 6;
          const a2 = a1 + Math.PI;
          return (
            <Line
              key={i}
              x1={cx + coreR * Math.cos(a1)}
              y1={cy + coreR * Math.sin(a1)}
              x2={cx + coreR * Math.cos(a2)}
              y2={cy + coreR * Math.sin(a2)}
              stroke={tier.primary}
              strokeWidth={0.5}
              strokeOpacity={0.3}
            />
          );
        })}

        {/* Vertex circles */}
        {Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          return (
            <Circle
              key={i}
              cx={cx + coreR * Math.cos(angle)}
              cy={cy + coreR * Math.sin(angle)}
              r={size * 0.018}
              fill={tier.primary}
              fillOpacity={0.9}
            />
          );
        })}

        {/* Glyph or tier name */}
        {glyph ? (
          <SvgText
            x={cx} y={cy + size * 0.065}
            textAnchor="middle"
            fontSize={size * 0.18}
            fill={tier.primary}
            fontWeight="700"
            fillOpacity={0.95}
          >
            {glyph}
          </SvgText>
        ) : (
          <SvgText
            x={cx} y={cy + size * 0.035}
            textAnchor="middle"
            fontSize={size * 0.09}
            fill={tier.primary}
            fontWeight="700"
            letterSpacing={size * 0.012}
            fillOpacity={0.9}
          >
            {tier.name}
          </SvgText>
        )}
      </Svg>

      {/* HUD corner brackets */}
      {[
        { top: 0,    left: 0,    rotate: '0deg'   },
        { top: 0,    right: 0,   rotate: '90deg'  },
        { bottom: 0, right: 0,   rotate: '180deg' },
        { bottom: 0, left: 0,    rotate: '270deg' },
      ].map((pos, i) => (
        <View
          key={i}
          style={[
            styles.bracket,
            {
              width: bSize,
              height: bSize,
              borderColor: alpha(tier.primary, 0.5),
              transform: [{ rotate: pos.rotate }],
              ...pos,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bracket: {
    position: 'absolute',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
});
