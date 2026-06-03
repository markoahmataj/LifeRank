// src/screens/RankPromotionScreen.tsx
// Major emotional moment. Old rank → new rank, with unlocked operations.
// PORT: app/rank/promotion.tsx and app/rank/demotion-risk.tsx

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import type { Mission, RankTier, RankTierId } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { RankEmblem } from '../components/RankEmblem';
import { HudCard } from '../components/HudCard';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { MissionCard } from '../components/MissionCard';

import {
  categories, getTier, surface, spacing, fonts, alpha, radius, state,
} from '../design-system/tokens';
import { mockAvailableMissions } from '../design-system/mockData';

export type RankPromotionScreenMode = 'promotion' | 'demotion-risk';

export interface RankPromotionScreenProps {
  mode?: RankPromotionScreenMode;
  prevTier?: RankTierId;
  newTier?: RankTierId;
  prevScore?: number;
  newScore?: number;
  unlockedMissions?: Mission[];
  narrative?: string;
  onShare?: () => void;
  onContinue?: () => void;
}

export function RankPromotionScreen({
  mode = 'promotion',
  prevTier  = 'dormant',
  newTier   = 'dormant',
  prevScore = 0,
  newScore  = 0,
  unlockedMissions = [],
  narrative = mode === 'promotion'
    ? 'Rank threshold cleared. New operations available.'
    : 'Score trending below current tier floor. Accept a recovery mission to stabilize.',
  onShare,
  onContinue,
}: RankPromotionScreenProps) {
  const isPromotion = mode === 'promotion';
  const focusTierId = isPromotion ? newTier : prevTier;
  const tier = getTier(focusTierId);
  const oldTierObj = getTier(prevTier);
  const newTierObj = getTier(newTier);

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier} intensity={1.4}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* status */}
        <View style={styles.statusWrap}>
          <View style={[styles.statusTag, {
            backgroundColor: isPromotion ? alpha(state.win, 0.14) : alpha(state.hold, 0.14),
            borderColor:     isPromotion ? alpha(state.win, 0.4)  : alpha(state.hold, 0.4),
          }]}>
            <View style={[styles.dot, { backgroundColor: isPromotion ? state.win : state.hold }]}/>
            <Text style={[styles.statusLabel, { color: isPromotion ? state.win : state.hold }]}>
              {isPromotion ? 'PROMOTION ACHIEVED' : 'RANK STABILITY AT RISK'}
            </Text>
          </View>
        </View>

        {/* EMBLEM */}
        <View style={{ alignItems: 'center', marginVertical: 4 }}>
          <RankEmblem tier={tier} size={230} intensity={1.5}/>
        </View>

        {/* tier movement */}
        <View style={styles.tierBlock}>
          <Text style={styles.cap}>{isPromotion ? 'TIER ASCENT' : 'TIER WARNING'}</Text>
          <View style={styles.tierRow}>
            <Text style={[styles.tierPrev, { color: alpha(oldTierObj.primary, 0.6) }]}>{oldTierObj.name}</Text>
            <Svg width={24} height={16} viewBox="0 0 24 16" style={{ marginHorizontal: 6 }}>
              <Path d={isPromotion ? "M1 8h18M14 1l6 7-6 7" : "M23 8H5M10 1L4 8l6 7"}
                stroke={tier.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
            <Text style={[styles.tierNew, { color: newTierObj.primary }]}>{newTierObj.name}</Text>
          </View>
          <Text style={styles.tierSub}>
            {isPromotion ? `Score crossed ${newScore.toFixed(1)} threshold` : `Floor at ${newScore.toFixed(1)} · current ${prevScore.toFixed(1)}`}
          </Text>
        </View>

        {/* tier copy */}
        <View style={styles.padded}>
          <HudCard accentColor={tier.primary} showTopEdge padding={{ x: 18, y: 16 }}>
            <Text style={[styles.cap, { color: tier.primary, marginBottom: 6 }]}>
              {isPromotion ? `WELCOME TO ${newTierObj.name}` : 'SYSTEM NOTICE'}
            </Text>
            <Text style={styles.copy}>
              {isPromotion ? newTierObj.description : 'You are at the boundary. A single weak cycle will trigger demotion.'}
            </Text>
            <Text style={[styles.narrative, { marginTop: 10 }]}>{narrative}</Text>
          </HudCard>
        </View>

        {/* unlocked missions */}
        {isPromotion && unlockedMissions.length > 0 && (
          <>
            <SectionHeader index="02" title="Operations Unlocked"/>
            <View style={[styles.padded, { gap: 10 }]}>
              {unlockedMissions.map(m => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  tier={tier}
                  variant="compact"
                  accentColor={categories[m.category].accent}
                />
              ))}
            </View>
          </>
        )}

        {/* recovery mission for demotion risk */}
        {!isPromotion && (
          <>
            <SectionHeader index="02" title="Recovery Protocol"/>
            <View style={styles.padded}>
              <MissionCard
                mission={mockAvailableMissions[0]}
                tier={tier}
                variant="compact"
                accentColor={tier.accent}
              />
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.ctaBar}>
        <LinearGradient colors={['transparent', alpha(surface.bg, 0.95)]} style={StyleSheet.absoluteFill}/>
        {isPromotion && (
          <View style={[styles.ghost, { borderColor: alpha(tier.primary, 0.4) }]}>
            <Text style={styles.ghostText} onPress={onShare}>SHARE</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <PrimaryCTA tier={tier} label={isPromotion ? 'Continue' : 'Assign Recovery'} onPress={onContinue}/>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <View style={sh.row}>
      <Text style={sh.idx}>{index}</Text>
      <Text style={sh.title}>{title.toUpperCase()}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.xl, marginTop: 22, marginBottom: 12 },
  idx: { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  title: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', letterSpacing: 1.4, color: alpha('#fff', 0.85) },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface.bg },
  padded: { paddingHorizontal: spacing.xl },

  statusWrap: { alignItems: 'center', paddingTop: spacing.hero, paddingBottom: 14 },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  statusLabel: { fontFamily: fonts.monoBold, fontSize: 10, fontWeight: '600', letterSpacing: 1.4 },

  tierBlock: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: 18 },
  cap: { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 2, fontWeight: '600' },
  tierRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  tierPrev: { fontFamily: fonts.displayBold, fontSize: 22, fontWeight: '700', letterSpacing: 3 },
  tierNew:  { fontFamily: fonts.displayBold, fontSize: 28, fontWeight: '700', letterSpacing: 4 },
  tierSub: { fontFamily: fonts.mono, fontSize: 10.5, color: surface.textTertiary, letterSpacing: 1.2, marginTop: 8 },

  copy: { fontFamily: fonts.displayBold, fontSize: 16, fontWeight: '600', color: '#fff', letterSpacing: -0.2, lineHeight: 22 },
  narrative: { fontFamily: fonts.display, fontSize: 13, color: surface.textSecondary, lineHeight: 18 },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 40,
    flexDirection: 'row', gap: 10,
  },
  ghost: { height: 56, paddingHorizontal: 18, borderRadius: radius.pill, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: fonts.displayBold, fontSize: 11, fontWeight: '600', color: '#fff', letterSpacing: 1.4 },
});
