// src/components/LockedState.tsx
// Used when a feature is gated — e.g. Stats locked before 3 check-ins,
// Share locked before the first Result, missions locked before calibration.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { RankTier } from '../design-system/types';
import { HudCard } from './HudCard';
import { PrimaryCTA } from './PrimaryCTA';
import { fonts, surface, alpha } from '../design-system/tokens';

export interface LockedStateProps {
  tier: RankTier;
  /** e.g. "LOCKED · CALIBRATION REQUIRED". */
  status: string;
  title: string;
  /** Why it's locked + what unlocks it. */
  requirement: string;
  /** Optional progress toward unlock. */
  progressPct?: number;
  /** Optional unlock CTA. */
  cta?: { label: string; onPress?: () => void };
}

export function LockedState({
  tier,
  status,
  title,
  requirement,
  progressPct,
  cta,
}: LockedStateProps) {
  return (
    <HudCard accentColor={tier.primary} showCorners padding={{ x: 20, y: 22 }}>
      <View style={styles.iconWrap}>
        <View style={[styles.lockChip, {
          borderColor: alpha(tier.primary, 0.4),
          backgroundColor: alpha(tier.primary, 0.10),
        }]}>
          <Svg width={20} height={24} viewBox="0 0 20 24" fill="none">
            <Path d="M2 11h16v12H2z" stroke={tier.primary} strokeWidth={1.5}/>
            <Path d="M5 11V6a5 5 0 0110 0v5" stroke={tier.primary} strokeWidth={1.5}/>
            <Path d="M10 16v3" stroke={tier.primary} strokeWidth={1.5} strokeLinecap="round"/>
          </Svg>
        </View>
      </View>

      <Text style={[styles.status, { color: tier.primary }]}>{status}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.requirement}>{requirement}</Text>

      {progressPct != null && (
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill,
              { width: `${Math.max(0, Math.min(100, progressPct))}%` as any, backgroundColor: tier.primary },
            ]}/>
          </View>
          <Text style={[styles.progressLabel, { color: tier.primary }]}>
            {Math.round(progressPct)}%
          </Text>
        </View>
      )}

      {cta && (
        <View style={{ marginTop: 14 }}>
          <PrimaryCTA tier={tier} label={cta.label} onPress={cta.onPress} size="md"/>
        </View>
      )}
    </HudCard>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', marginBottom: 14 },
  lockChip: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.6,
    textAlign: 'center',
    fontWeight: '600',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 19,
    fontWeight: '600',
    color: surface.textPrimary,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: -0.2,
  },
  requirement: {
    fontFamily: fonts.display,
    fontSize: 12.5,
    color: surface.textTertiary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },
});
