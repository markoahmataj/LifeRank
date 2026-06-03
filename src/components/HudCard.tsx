// src/components/HudCard.tsx
// Glass card with BlurView + gradient + optional top-edge accent + corner brackets.

import React, { type ReactNode } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { surface, radius, alpha } from '../design-system/tokens';

export type HudCardVariant = 'default' | 'elevated' | 'mission' | 'success' | 'danger';

interface HudCardProps {
  children: ReactNode;
  accentColor?: string;
  variant?: HudCardVariant;
  showTopEdge?: boolean;
  showCorners?: boolean;
  padding?: number | { x?: number; y?: number };
  style?: StyleProp<ViewStyle>;
}

export function HudCard({
  children,
  accentColor,
  variant = 'default',
  showTopEdge = false,
  showCorners = false,
  padding = { x: 16, y: 14 },
  style,
}: HudCardProps) {
  const padX = typeof padding === 'number' ? padding : (padding.x ?? 16);
  const padY = typeof padding === 'number' ? padding : (padding.y ?? 14);

  const variantTint = variantColors[variant];
  const borderColor = accentColor
    ? alpha(accentColor, 0.22)
    : surface.hairline;

  return (
    <View style={[styles.container, style]}>
      {/* Blur layer */}
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}/>

      {/* Base fill */}
      <LinearGradient
        colors={[surface.glassFill, surface.glassFillAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Variant mission tint */}
      {variant === 'mission' && accentColor && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: alpha(accentColor, 0.06) },
          ]}
        />
      )}

      {/* Border */}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.border,
          { borderColor },
        ]}
      />

      {/* Top edge accent */}
      {showTopEdge && accentColor && (
        <LinearGradient
          colors={[alpha(accentColor, 0.7), 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topEdge}
        />
      )}

      {/* Corner brackets */}
      {showCorners && accentColor && (
        <>
          <View style={[styles.corner, styles.cornerTL, { borderColor: alpha(accentColor, 0.5) }]}/>
          <View style={[styles.corner, styles.cornerTR, { borderColor: alpha(accentColor, 0.5) }]}/>
          <View style={[styles.corner, styles.cornerBL, { borderColor: alpha(accentColor, 0.5) }]}/>
          <View style={[styles.corner, styles.cornerBR, { borderColor: alpha(accentColor, 0.5) }]}/>
        </>
      )}

      {/* Content */}
      <View style={{ paddingHorizontal: padX, paddingVertical: padY }}>
        {children}
      </View>
    </View>
  );
}

const variantColors: Record<HudCardVariant, string | null> = {
  default:  null,
  elevated: null,
  mission:  null,
  success:  '#34d399',
  danger:   '#f87171',
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  border: {
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  corner: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderWidth: 1.2,
  },
  cornerTL: {
    top: 8,
    left: 8,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 8,
    right: 8,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 8,
    left: 8,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 8,
    right: 8,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 4,
  },
});
