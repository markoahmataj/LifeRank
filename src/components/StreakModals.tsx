// src/components/StreakModals.tsx
// Two variants of the streak-event modal.
// Re-exported as two named components.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { RankTier } from '../design-system/types';
import { ModalShell } from './ModalShell';
import { PrimaryCTA } from './PrimaryCTA';
import { fonts, alpha, state } from '../design-system/tokens';

interface StreakModalProps {
  tier: RankTier;
  visible: boolean;
  days: number;
  onContinue?: () => void;
}

interface StreakBrokenModalProps extends StreakModalProps {
  previousDays: number;
  onRecover?: () => void;
}

export function StreakBrokenModal({
  tier, visible, days, previousDays, onContinue, onRecover,
}: StreakBrokenModalProps) {
  return (
    <ModalShell tier={tier} visible={visible} onClose={onContinue} caption="STREAK BROKEN">
      <View style={{ alignItems: 'center', gap: 20 }}>
        <View style={[styles.iconChip, {
          backgroundColor: alpha(state.break, 0.14),
          borderColor: alpha(state.break, 0.4),
        }]}>
          <Svg width={28} height={32} viewBox="0 0 28 32" fill="none">
            <Path
              d="M14 2C18 8 24 9 24 18C24 26 19 30 14 30C9 30 4 26 4 18C4 13 7 11 7 6C7 10 11 11 14 14C14 10 11 6 14 2Z"
              stroke={state.break} strokeWidth={1.4} fill={alpha(state.break, 0.22)}/>
            <Path d="M6 6L22 28" stroke={state.break} strokeWidth={2} strokeLinecap="round"/>
          </Svg>
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={[styles.caption, { color: state.break }]}>STREAK · {previousDays} DAYS</Text>
          <Text style={styles.title}>The chain is broken.</Text>
          <Text style={styles.body}>
            A new streak begins on your next check-in.{'\n'}
            The previous record is logged.
          </Text>
        </View>

        <View style={{ width: '100%', flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <PrimaryCTA tier={tier} label="Assign Recovery" onPress={onRecover} size="md"/>
          </View>
        </View>
      </View>
    </ModalShell>
  );
}

interface StreakProtectedModalProps extends StreakModalProps {
  rpEarned: number;
}

export function StreakProtectedModal({
  tier, visible, days, rpEarned, onContinue,
}: StreakProtectedModalProps) {
  return (
    <ModalShell tier={tier} visible={visible} onClose={onContinue} caption="STREAK PROTECTED">
      <View style={{ alignItems: 'center', gap: 20 }}>
        <View style={[styles.iconChip, {
          backgroundColor: alpha(tier.primary, 0.14),
          borderColor: alpha(tier.primary, 0.4),
        }]}>
          <Svg width={28} height={32} viewBox="0 0 28 32" fill="none">
            <Path
              d="M14 2C18 8 24 9 24 18C24 26 19 30 14 30C9 30 4 26 4 18C4 13 7 11 7 6C7 10 11 11 14 14C14 10 11 6 14 2Z"
              stroke={tier.primary} strokeWidth={1.4} fill={alpha(tier.primary, 0.34)}/>
          </Svg>
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={[styles.caption, { color: tier.primary }]}>STREAK · DAY {days}</Text>
          <Text style={styles.title}>The streak holds.</Text>
          <Text style={styles.body}>
            +{rpEarned} RP earned. The system is recording every cycle.
          </Text>
        </View>

        <View style={{ width: '100%' }}>
          <PrimaryCTA tier={tier} label="Continue" onPress={onContinue} size="md"/>
        </View>
      </View>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  iconChip: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '600',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  body: {
    fontFamily: fonts.display,
    fontSize: 13.5,
    color: alpha('#fff', 0.75),
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
    paddingHorizontal: 16,
  },
});
