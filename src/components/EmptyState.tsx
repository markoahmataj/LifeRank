// src/components/EmptyState.tsx
// Used when a list/tab has no data.

import React, { type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { RankTier } from '../design-system/types';
import { HudCard } from './HudCard';
import { PrimaryCTA } from './PrimaryCTA';
import { fonts, surface, alpha } from '../design-system/tokens';

interface EmptyStateProps {
  tier: RankTier;
  status: string;
  title: string;
  body?: string;
  cta?: { label: string; onPress?: () => void };
  icon?: ReactNode;
}

export function EmptyState({ tier, status, title, body, cta, icon }: EmptyStateProps) {
  return (
    <HudCard accentColor={tier.primary} padding={{ x: 20, y: 24 }}>
      <View style={styles.center}>
        {/* Icon or default signal icon */}
        <View style={[styles.iconChip, { borderColor: alpha(tier.primary, 0.33), backgroundColor: alpha(tier.primary, 0.10) }]}>
          {icon ?? (
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path d="M10 1v4M10 15v4M1 10h4M15 10h4M3 3l3 3M14 14l3 3M3 17l3-3M14 6l3-3" stroke={tier.primary} strokeWidth={1.6} strokeLinecap="round"/>
            </Svg>
          )}
        </View>

        <Text style={[styles.status, { color: tier.primary }]}>{status}</Text>
        <Text style={styles.title}>{title}</Text>
        {body && <Text style={styles.body}>{body}</Text>}

        {cta && (
          <View style={styles.ctaWrap}>
            <PrimaryCTA tier={tier} label={cta.label} onPress={cta.onPress}/>
          </View>
        )}
      </View>
    </HudCard>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: 8,
  },
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  status: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: surface.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 8,
  },
  ctaWrap: {
    width: '100%',
    marginTop: 16,
  },
});
