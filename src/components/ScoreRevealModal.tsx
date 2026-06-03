// src/components/ScoreRevealModal.tsx
// Animated old→new Life-Score reveal. Used after every check-in.

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { RankTier } from '../design-system/types';
import { ModalShell } from './ModalShell';
import { PrimaryCTA } from './PrimaryCTA';
import { HudCard } from './HudCard';
import { EnergyBar } from './EnergyBar';
import { RankEmblem } from './RankEmblem';
import { surface, fonts, alpha, radius } from '../design-system/tokens';

export interface ScoreRevealModalProps {
  tier: RankTier;
  visible: boolean;
  prevScore: number;
  newScore: number;
  rpEarned: number;
  onContinue?: () => void;
  onShare?: () => void;
}

export function ScoreRevealModal({
  tier, visible, prevScore, newScore, rpEarned, onContinue, onShare,
}: ScoreRevealModalProps) {
  const delta = +(newScore - prevScore).toFixed(1);
  const display = useCountUp(prevScore, newScore, 1200, visible);

  return (
    <ModalShell tier={tier} visible={visible} onClose={onContinue} caption="REVEAL · LIFE SCORE">
      <View style={{ alignItems: 'center', gap: 20 }}>
        <RankEmblem tier={tier} size={170}/>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.caption}>NEW LIFE SCORE</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.prev}>{prevScore.toFixed(1)}</Text>
            <Svg width={18} height={14} viewBox="0 0 18 14" style={{ marginTop: 6 }}>
              <Path d="M1 7h14M11 1l5 6-5 6" stroke={tier.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
            <Text style={[styles.scoreNew, { color: tier.primary }]}>{display.toFixed(1)}</Text>
          </View>

          <View style={[styles.deltaPill, { backgroundColor: alpha(tier.primary, 0.14), borderColor: alpha(tier.primary, 0.4) }]}>
            <Text style={[styles.deltaLabel, { color: tier.primary }]}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)} PTS  ·  +{rpEarned} RP
            </Text>
          </View>
        </View>

        <View style={{ width: '100%' }}>
          <HudCard padding={{ x: 16, y: 14 }}>
            <Text style={styles.caption}>PROGRESS TO PROMOTION</Text>
            <View style={{ marginTop: 8 }}>
              <EnergyBar value={(newScore / 9.0) * 100} tier={tier} thickness={6}/>
            </View>
          </HudCard>
        </View>

        <View style={{ width: '100%', flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <PrimaryCTA tier={tier} label="Continue" onPress={onContinue} size="md"/>
          </View>
        </View>
      </View>
    </ModalShell>
  );
}

function useCountUp(from: number, to: number, duration: number, run: boolean) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (!run) { setV(from); return; }
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(from + (to - from) * eased);
      if (t === 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [from, to, duration, run]);
  return v;
}

const styles = StyleSheet.create({
  caption: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: surface.textTertiary,
    letterSpacing: 2,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  prev: {
    fontFamily: fonts.mono,
    fontSize: 28,
    color: surface.textMuted,
    textDecorationLine: 'line-through',
  },
  scoreNew: {
    fontFamily: fonts.monoBold,
    fontSize: 88,
    fontWeight: '600',
    letterSpacing: -3,
    lineHeight: 88,
  },
  deltaPill: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  deltaLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
});
