// src/screens/MissionCompleteScreen.tsx
// Reward reveal for completed missions.
// PORT: app/mission/complete/[id].tsx

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import type { CategoryId, RankTier, RankTierId } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { RankEmblem } from '../components/RankEmblem';
import { HudCard } from '../components/HudCard';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';

import {
  categories, getTier, surface, spacing, fonts, alpha, radius, state,
} from '../design-system/tokens';

export interface MissionCompletionResult {
  missionId: string;
  title: string;
  category: CategoryId;
  rewardScore: number;
  rewardRP: number;
  prevScore: number;
  newScore: number;
  prevTier: RankTierId;
  newTier: RankTierId;
  streakDays: number;
  streakKept: boolean;
}

export interface MissionCompleteScreenProps {
  tier?: RankTier;
  result?: MissionCompletionResult;
  onShare?: () => void;
  onContinue?: () => void;
}

const PLACEHOLDER_RESULT: MissionCompletionResult = {
  missionId: '', title: '—', category: 'discipline',
  rewardScore: 0, rewardRP: 0,
  prevScore: 0, newScore: 0,
  prevTier: 'dormant', newTier: 'dormant',
  streakDays: 0, streakKept: false,
};

export function MissionCompleteScreen({
  tier = getTier('apex'),
  result = PLACEHOLDER_RESULT,
  onShare,
  onContinue,
}: MissionCompleteScreenProps) {
  const cat = categories[result.category];

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier} intensity={1.3}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* status */}
        <View style={styles.statusWrap}>
          <View style={[styles.statusTag, { backgroundColor: alpha(state.win, 0.14), borderColor: alpha(state.win, 0.4) }]}>
            <View style={[styles.dot, { backgroundColor: state.win }]}/>
            <Text style={[styles.statusLabel, { color: state.win }]}>OPERATION COMPLETE</Text>
          </View>
        </View>

        {/* emblem with checkmark glyph */}
        <View style={{ alignItems: 'center', marginBottom: 4 }}>
          <RankEmblem tier={tier} size={200} glyph="✓"/>
        </View>

        {/* title block */}
        <View style={styles.titleBlock}>
          <Text style={[styles.cap, { color: cat.accent }]}>{result.missionId} · {cat.name.toUpperCase()}</Text>
          <Text style={styles.title}>{result.title}</Text>
          <View style={styles.heldRow}>
            <View style={[styles.heldRule, { backgroundColor: tier.primary }]}/>
            <Text style={[styles.heldLabel, { color: tier.primary }]}>HELD · {tier.name} {tier.sublabel.replace('TIER ', '')}</Text>
            <View style={[styles.heldRule, { backgroundColor: tier.primary }]}/>
          </View>
        </View>

        {/* rewards */}
        <View style={styles.padded}>
          <HudCard accentColor={tier.primary} showTopEdge>
            <Text style={[styles.cap, { textAlign: 'center', marginBottom: 12 }]}>REWARDS</Text>
            <View style={styles.rewardGrid}>
              <RewardTile label="SCORE GAINED" value={`+${result.rewardScore.toFixed(1)}`} color={tier.primary}/>
              <RewardTile label="RP EARNED"    value={`+${result.rewardRP}`}                color={tier.accent}/>
            </View>
          </HudCard>
        </View>

        {/* score movement */}
        <View style={[styles.padded, { marginTop: 12 }]}>
          <HudCard padding={{ x: 16, y: 14 }}>
            <Text style={styles.cap}>LIFE SCORE MOVEMENT</Text>
            <View style={styles.movementRow}>
              <Text style={styles.movePrev}>{result.prevScore.toFixed(1)}</Text>
              <Svg width={18} height={14} viewBox="0 0 18 14" style={{ marginTop: 4 }}>
                <Path d="M1 7h14M11 1l5 6-5 6" stroke={tier.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
              <Text style={[styles.moveNew, { color: tier.primary }]}>{result.newScore.toFixed(1)}</Text>
            </View>
            <Text style={styles.moveSub}>
              {result.prevTier !== result.newTier
                ? `Tier promoted · ${(result.prevTier as string).toUpperCase()} → ${(result.newTier as string).toUpperCase()}`
                : 'Tier held · momentum compounding'}
            </Text>
          </HudCard>
        </View>

        {/* category impact */}
        <View style={[styles.padded, { marginTop: 12 }]}>
          <HudCard accentColor={cat.accent} variant="mission" padding={{ x: 14, y: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.catChip, { backgroundColor: alpha(cat.accent, 0.18), borderColor: alpha(cat.accent, 0.4) }]}>
                <CategoryGlyphIcon glyph={cat.glyph} color={cat.accent} size={18}/>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cap, { color: cat.accent }]}>PILLAR STRENGTHENED</Text>
                <Text style={styles.catName}>{cat.name}</Text>
              </View>
              <Text style={[styles.catGain, { color: cat.accent }]}>+{result.rewardScore.toFixed(1)}</Text>
            </View>
          </HudCard>
        </View>

        {/* streak */}
        <View style={[styles.padded, { marginTop: 12 }]}>
          <HudCard padding={{ x: 14, y: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Svg width={14} height={16} viewBox="0 0 11 13">
                <Path
                  d="M5.5 1C7 3.5 9.5 4 9.5 7.5C9.5 10.5 7.5 12 5.5 12C3.5 12 1.5 10.5 1.5 7.5C1.5 5.5 3 4.5 3 2.5C3 4 4.5 4.5 5.5 6C5.5 4 4.5 2.5 5.5 1Z"
                  fill={tier.primary}
                  stroke={tier.primary}
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 13, color: surface.textSecondary }}>
                Streak {result.streakKept ? 'protected' : 'broken'}
              </Text>
              <Text style={{ fontFamily: fonts.monoBold, fontSize: 14, color: '#fff' }}>
                {result.streakDays} days
              </Text>
            </View>
          </HudCard>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaBar}>
        <LinearGradient colors={['transparent', alpha(surface.bg, 0.95)]} style={StyleSheet.absoluteFill}/>
        <View>
          <View style={[styles.ghost, { borderColor: alpha(tier.primary, 0.4) }]}>
            <Text style={styles.ghostText} onPress={onShare}>SHARE</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryCTA tier={tier} label="Continue" onPress={onContinue}/>
        </View>
      </View>
    </View>
  );
}

function RewardTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.rewardTile, { borderColor: alpha(color, 0.4), backgroundColor: alpha(color, 0.10) }]}>
      <Text style={[styles.cap, { color }]}>{label}</Text>
      <Text style={[styles.rewardValue, { color: '#fff' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface.bg },
  padded: { paddingHorizontal: spacing.xl },

  statusWrap: { alignItems: 'center', paddingTop: spacing.hero, paddingBottom: 14 },
  statusTag: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.pill, borderWidth: 1,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  statusLabel: { fontFamily: fonts.monoBold, fontSize: 10, fontWeight: '600', letterSpacing: 1.4 },

  titleBlock: { paddingHorizontal: spacing.xl, alignItems: 'center', marginBottom: 18 },
  cap: { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 1.6, fontWeight: '600' },
  title: { fontFamily: fonts.displayBold, fontSize: 30, fontWeight: '700', color: '#fff', letterSpacing: -0.6, marginTop: 6 },
  heldRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  heldRule: { width: 16, height: 1, opacity: 0.85 },
  heldLabel: { fontFamily: fonts.displayBold, fontSize: 12, fontWeight: '600', letterSpacing: 3 },

  rewardGrid: { flexDirection: 'row', gap: 10 },
  rewardTile: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 6 },
  rewardValue: { fontFamily: fonts.monoBold, fontSize: 30, fontWeight: '600', letterSpacing: -1 },

  movementRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginTop: 6 },
  movePrev: { fontFamily: fonts.mono, fontSize: 22, color: surface.textMuted, textDecorationLine: 'line-through' },
  moveNew: { fontFamily: fonts.monoBold, fontSize: 44, fontWeight: '600', letterSpacing: -2 },
  moveSub: { fontFamily: fonts.display, fontSize: 11, color: surface.textTertiary, marginTop: 6 },

  catChip: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  catName: { fontFamily: fonts.displayBold, fontSize: 14, fontWeight: '600', color: '#fff', marginTop: 4 },
  catGain: { fontFamily: fonts.monoBold, fontSize: 18, fontWeight: '600' },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 40,
    flexDirection: 'row', gap: 10,
  },
  ghost: {
    height: 56, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  ghostText: { fontFamily: fonts.displayBold, fontSize: 11, fontWeight: '600', color: '#fff', letterSpacing: 1.4 },
});
