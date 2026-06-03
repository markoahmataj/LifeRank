// src/components/ModalShell.tsx
// Shared chrome for every cinematic reveal modal. Renders an
// absolutely-positioned full-screen overlay with a backdrop blur,
// atmospheric glow tinted by tier, and a content slot.

import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';

import type { RankTier } from '../design-system/types';
import { AtmosphereBackground } from './AtmosphereBackground';
import { surface, alpha, spacing, fonts } from '../design-system/tokens';

export interface ModalShellProps {
  tier: RankTier;
  visible: boolean;
  onClose?: () => void;
  /** "REVEAL · SCORE", "RANK CHANGE", etc. */
  caption?: string;
  children: React.ReactNode;
  /** Hide the dismiss control (e.g. forced reveals). */
  hideClose?: boolean;
}

export function ModalShell({
  tier, visible, onClose, caption, children, hideClose,
}: ModalShellProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}/>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: alpha(surface.bg, 0.5) }]}/>
        <AtmosphereBackground tier={tier} intensity={1.3} showGrid={false}/>

        {caption && (
          <View style={styles.captionRow}>
            <Text style={[styles.caption, { color: tier.primary }]}>{caption}</Text>
          </View>
        )}

        {!hideClose && (
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <Path d="M1 1l12 12M13 1L1 13" stroke="#fff" strokeWidth={1.6} strokeLinecap="round"/>
            </Svg>
          </Pressable>
        )}

        <View style={styles.body}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionRow: {
    position: 'absolute',
    top: spacing.hero,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  caption: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.hero,
    right: spacing.xl,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: surface.glassFill,
    borderWidth: 1,
    borderColor: surface.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
});
