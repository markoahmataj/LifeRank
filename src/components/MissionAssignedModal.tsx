// src/components/MissionAssignedModal.tsx
// "New operation assigned" reveal. Used after check-in / calibration / promotion.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { Mission, RankTier } from '../design-system/types';
import { ModalShell } from './ModalShell';
import { PrimaryCTA } from './PrimaryCTA';
import { HudCard } from './HudCard';
import { CategoryGlyphIcon } from './CategoryGlyph';
import { categories, fonts, surface, alpha } from '../design-system/tokens';

export interface MissionAssignedModalProps {
  tier: RankTier;
  visible: boolean;
  mission: Mission;
  onAccept?: () => void;
  onLater?: () => void;
}

export function MissionAssignedModal({
  tier, visible, mission, onAccept, onLater,
}: MissionAssignedModalProps) {
  const cat = categories[mission.category];

  return (
    <ModalShell tier={tier} visible={visible} onClose={onLater} caption="OPERATION ASSIGNED">
      <View style={{ alignItems: 'center', gap: 18, width: '100%' }}>
        <View style={[styles.iconChip, {
          backgroundColor: alpha(cat.accent, 0.18),
          borderColor: alpha(cat.accent, 0.4),
        }]}>
          <CategoryGlyphIcon glyph={cat.glyph} color={cat.accent} size={26}/>
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={[styles.cap, { color: cat.accent }]}>{mission.id} · {cat.name.toUpperCase()}</Text>
          <Text style={styles.title}>{mission.title}</Text>
          <Text style={styles.sub}>{mission.subtitle}</Text>
        </View>

        {mission.reason && (
          <HudCard accentColor={cat.accent} variant="mission" padding={{ x: 14, y: 12 }} style={{ width: '100%' }}>
            <Text style={[styles.cap, { color: cat.accent, marginBottom: 4 }]}>WHY ASSIGNED</Text>
            <Text style={styles.reason}>{mission.reason}</Text>
          </HudCard>
        )}

        <View style={styles.statsRow}>
          <Stat label="DIFFICULTY" value={'■'.repeat(mission.difficulty) + '□'.repeat(5 - mission.difficulty)}/>
          <Stat label="SCORE"      value={`+${mission.rewardScore.toFixed(1)}`}/>
          <Stat label="RP"         value={`+${mission.rewardRP ?? Math.round(mission.rewardScore * 250)}`}/>
        </View>

        <View style={{ width: '100%', flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <PrimaryCTA tier={tier} label="Accept Operation" onPress={onAccept} size="md"/>
          </View>
        </View>

        <Text style={styles.skip} onPress={onLater}>Decide Later</Text>
      </View>
    </ModalShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconChip: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cap: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '600',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  sub: {
    fontFamily: fonts.display,
    fontSize: 12.5,
    color: surface.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  reason: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: alpha('#fff', 0.85),
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  stat: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: surface.hairlineSoft,
    borderRadius: 14,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: surface.textTertiary,
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: fonts.monoBold,
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  skip: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: surface.textTertiary,
    letterSpacing: 1,
    textAlign: 'center',
    paddingVertical: 4,
  },
});
