// src/components/RankChangeModal.tsx
// Tier-promotion or tier-demotion reveal.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { RankTier } from '../design-system/types';
import { ModalShell } from './ModalShell';
import { PrimaryCTA } from './PrimaryCTA';
import { RankEmblem } from './RankEmblem';
import { fonts, surface, alpha, radius } from '../design-system/tokens';

export interface RankChangeModalProps {
  visible: boolean;
  prevTier: RankTier;
  newTier: RankTier;
  /** 'promotion' or 'demotion' */
  direction: 'promotion' | 'demotion';
  unlockedCount?: number;
  onContinue?: () => void;
  onShare?: () => void;
}

export function RankChangeModal({
  visible, prevTier, newTier, direction,
  unlockedCount, onContinue, onShare,
}: RankChangeModalProps) {
  const isUp = direction === 'promotion';
  const headline = isUp ? 'RANK PROMOTED' : 'RANK DEMOTED';

  return (
    <ModalShell tier={newTier} visible={visible} onClose={onContinue} caption={headline}>
      <View style={{ alignItems: 'center', gap: 20 }}>
        <RankEmblem tier={newTier} size={180} intensity={1.4}/>

        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={styles.cap}>TIER MOVEMENT</Text>
          <View style={styles.row}>
            <Text style={[styles.prevTier, { color: alpha(prevTier.primary, 0.55) }]}>{prevTier.name}</Text>
            <Svg width={18} height={14} viewBox="0 0 18 14" style={{ marginHorizontal: 4 }}>
              <Path
                d={isUp ? "M1 7h14M11 1l5 6-5 6" : "M17 7H3M7 1L1 7l6 6"}
                stroke={newTier.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.newTier, { color: newTier.primary }]}>{newTier.name}</Text>
          </View>
          <Text style={styles.sub}>{newTier.sublabel}</Text>
        </View>

        <Text style={styles.copy}>
          {isUp ? newTier.promotionCopy : newTier.demotionCopy}
        </Text>

        {isUp && unlockedCount != null && unlockedCount > 0 && (
          <View style={[styles.unlockedRibbon, { backgroundColor: alpha(newTier.primary, 0.14), borderColor: alpha(newTier.primary, 0.4) }]}>
            <Text style={[styles.unlockedLabel, { color: newTier.primary }]}>
              {unlockedCount} NEW OPERATION{unlockedCount === 1 ? '' : 'S'} UNLOCKED
            </Text>
          </View>
        )}

        <View style={{ width: '100%', flexDirection: 'row', gap: 10, marginTop: 8 }}>
          {isUp && (
            <GhostButton onPress={onShare} tier={newTier}/>
          )}
          <View style={{ flex: 1 }}>
            <PrimaryCTA
              tier={newTier}
              label={isUp ? 'Continue' : 'Assign Recovery'}
              onPress={onContinue}
              size="md"
            />
          </View>
        </View>
      </View>
    </ModalShell>
  );
}

function GhostButton({ tier, onPress }: { tier: RankTier; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.ghost, { borderColor: alpha(tier.primary, 0.33) }]}>
      <Text style={styles.ghostText}>SHARE</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cap: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: surface.textTertiary,
    letterSpacing: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prevTier: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
  },
  newTier: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
  },
  sub: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    color: surface.textTertiary,
    letterSpacing: 1.4,
    marginTop: 2,
  },
  copy: {
    fontFamily: fonts.display,
    fontSize: 13.5,
    color: alpha('#fff', 0.85),
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  unlockedRibbon: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  unlockedLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.4,
  },
  ghost: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    fontFamily: fonts.displayBold,
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 1.4,
  },
});
