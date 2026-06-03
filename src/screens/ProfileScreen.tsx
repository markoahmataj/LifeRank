// src/screens/ProfileScreen.tsx
// Rank identity card. Personal, not social. Shows what the user IS in
// the system — handle, rank, build, records.
// PORT: app/profile.tsx

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import type { CategoryId, LifeScore, RankTier, UserBuild } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { RankEmblem } from '../components/RankEmblem';
import { HudCard } from '../components/HudCard';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';

import {
  categories, getTier, surface, spacing, fonts, alpha, radius, state,
} from '../design-system/tokens';
import { mockBuild } from '../design-system/mockData';

export interface ProfileScreenProps {
  onShare?: () => void;
  onBack?: () => void;
  onOpenSettings?: () => void;
  handle?: string;
  displayName?: string;
  score?: LifeScore;
  build?: UserBuild;
  rp?: number;
  favoriteCategory?: CategoryId;
  joinedAt?: string;
  personalBest?: number;
  longestStreak?: number;
  totalCheckIns?: number;
  completedOperations?: number;
  rankPromotions?: number;
}

export function ProfileScreen({
  onShare,
  onBack,
  onOpenSettings,
  handle = '@you',
  displayName = 'You',
  score,
  build = mockBuild,
  rp,
  favoriteCategory = 'discipline',
  joinedAt,
  personalBest,
  longestStreak,
  totalCheckIns,
  completedOperations,
  rankPromotions,
}: ProfileScreenProps) {
  const tier: RankTier = getTier(score?.tier ?? 'dormant');
  const fav = categories[favoriteCategory];
  const pbScore  = personalBest ?? score?.pbScore ?? score?.value ?? 0;
  const longest  = longestStreak ?? score?.streak ?? 0;
  const checkIns = totalCheckIns ?? 0;
  const ops      = completedOperations ?? 0;

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.iconBtn}>
            <Svg width={9} height={14} viewBox="0 0 9 14"><Path d="M7 1L1 7l6 6" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerCap}>RANK IDENTITY</Text>
            <Text style={styles.headerSub}>Profile</Text>
          </View>
          <Pressable onPress={onOpenSettings} style={styles.iconBtn}>
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <Circle cx={7} cy={7} r={2.5} stroke="#fff" strokeWidth={1.5}/>
              <Path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.5 2.5l1.5 1.5M10 10l1.5 1.5M2.5 11.5L4 10M10 4l1.5-1.5" stroke="#fff" strokeWidth={1.5} strokeLinecap="round"/>
            </Svg>
          </Pressable>
        </View>

        {/* IDENTITY CARD */}
        <View style={[styles.padded, { marginBottom: 14 }]}>
          <HudCard accentColor={tier.primary} showTopEdge showCorners padding={{ x: 18, y: 18 }}>
            <View style={{ alignItems: 'center' }}>
              <RankEmblem tier={tier} size={150}/>
              <View style={[styles.handlePill, { borderColor: alpha(tier.primary, 0.4) }]}>
                <Text style={styles.handle}>{handle}</Text>
              </View>
              <Text style={styles.displayName}>{displayName}</Text>
              <View style={styles.tierRow}>
                <View style={[styles.tierRule, { backgroundColor: tier.primary }]}/>
                <Text style={[styles.tierName, { color: tier.primary }]}>{tier.name}</Text>
                <Text style={styles.tierSub}>{tier.sublabel}</Text>
                <View style={[styles.tierRule, { backgroundColor: tier.primary }]}/>
              </View>
              <Text style={styles.joinedLabel}>
                LEDGER OPEN · {joinedAt ? new Date(joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase() : '—'}
              </Text>
            </View>
          </HudCard>
        </View>

        {/* BUILD */}
        <SectionHeader index="02" title="Assigned Build"/>
        <View style={styles.padded}>
          <HudCard accentColor={tier.primary} variant="mission" padding={{ x: 16, y: 14 }}>
            <Text style={styles.smallCap}>ARCHETYPE</Text>
            <Text style={[styles.buildName, { color: tier.primary }]}>{build.name.toUpperCase()}</Text>
            <Text style={styles.buildTagline}>{build.tagline}</Text>
            <View style={styles.buildPills}>
              {build.primary.map(id => (
                <View key={id} style={[styles.primaryPill, {
                  borderColor:     alpha(categories[id].accent, 0.4),
                  backgroundColor: alpha(categories[id].accent, 0.10),
                }]}>
                  <CategoryGlyphIcon glyph={categories[id].glyph} color={categories[id].accent} size={12}/>
                  <Text style={[styles.primaryLabel, { color: categories[id].accent }]}>
                    {categories[id].name.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          </HudCard>
        </View>

        {/* RECORDS */}
        <SectionHeader index="03" title="Records"/>
        <View style={[styles.padded, { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }]}>
          <RecordTile label="PERSONAL BEST"   value={pbScore.toFixed(1)} color={tier.primary}/>
          <RecordTile label="LONGEST STREAK"  value={`${longest}d`}     color={tier.accent}/>
          <RecordTile label="CHECK-INS"       value={String(checkIns)}    color={tier.mid}/>
          <RecordTile label="OPERATIONS"      value={String(ops)} color={tier.far}/>
          <RecordTile label="RP"              value={String(rp ?? 0)}    color={state.win}/>
          <RecordTile label="DAYS ACTIVE"     value={joinedAt ? String(daysSince(joinedAt)) : '—'} color={state.signal}/>
        </View>

        {/* FAVORITE CATEGORY */}
        <SectionHeader index="04" title="Strongest Pillar"/>
        <View style={styles.padded}>
          <HudCard accentColor={fav.accent} variant="mission" padding={{ x: 16, y: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.favIcon, { backgroundColor: alpha(fav.accent, 0.18), borderColor: alpha(fav.accent, 0.4) }]}>
                <CategoryGlyphIcon glyph={fav.glyph} color={fav.accent} size={22}/>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.smallCap}>SIGNATURE DOMAIN</Text>
                <Text style={styles.favName}>{fav.name}</Text>
                <Text style={styles.favBlurb}>This pillar defines your rank curve.</Text>
              </View>
            </View>
          </HudCard>
        </View>

        {/* SHARE */}
        <View style={[styles.padded, { marginTop: 22 }]}>
          <PrimaryCTA tier={tier} label="Share Profile Card" onPress={onShare}/>
        </View>
      </ScrollView>
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
  row:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.xl, marginTop: 18, marginBottom: 12 },
  idx:   { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  title: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', letterSpacing: 1.4, color: alpha('#fff', 0.85) },
});

function RecordTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ width: '48%' as any }}>
      <HudCard padding={{ x: 12, y: 12 }}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={[styles.tileValue, { color: '#fff' }]}>{value}</Text>
        <View style={[styles.tileBar, { backgroundColor: color }]}/>
      </HudCard>
    </View>
  );
}

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)));
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: surface.bg },
  padded: { paddingHorizontal: spacing.xl },

  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.hero, paddingBottom: 16 },
  iconBtn:   { width: 36, height: 36, borderRadius: 12, backgroundColor: surface.glassFill, borderWidth: 1, borderColor: surface.hairline, alignItems: 'center', justifyContent: 'center' },
  headerCap: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.6 },
  headerSub: { fontFamily: fonts.displayBold, fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 2 },

  handlePill: {
    marginTop: 14, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: radius.pill, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  handle:      { fontFamily: fonts.monoBold, fontSize: 11, color: '#fff', letterSpacing: 0.5 },
  displayName: { fontFamily: fonts.displayBold, fontSize: 26, fontWeight: '700', color: '#fff', marginTop: 8, letterSpacing: -0.5 },
  tierRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  tierRule:    { width: 14, height: 1, opacity: 0.85 },
  tierName:    { fontFamily: fonts.displayBold, fontSize: 14, fontWeight: '600', letterSpacing: 4 },
  tierSub:     { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  joinedLabel: { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 1.4, marginTop: 8 },

  smallCap:    { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.2 },
  buildName:   { fontFamily: fonts.displayBold, fontSize: 22, fontWeight: '700', letterSpacing: 2, marginTop: 4 },
  buildTagline:{ fontFamily: fonts.display, fontSize: 12, color: surface.textSecondary, marginTop: 2 },
  buildPills:  { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  primaryPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  primaryLabel:{ fontFamily: fonts.monoBold, fontSize: 9, fontWeight: '600', letterSpacing: 0.8 },

  tileLabel: { fontFamily: fonts.mono, fontSize: 9, color: surface.textTertiary, letterSpacing: 1 },
  tileValue: { fontFamily: fonts.monoBold, fontSize: 22, fontWeight: '600', marginTop: 4 },
  tileBar:   { width: 32, height: 2, borderRadius: 1, marginTop: 8 },

  favIcon:  { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  favName:  { fontFamily: fonts.displayBold, fontSize: 17, fontWeight: '700', color: '#fff', marginTop: 4 },
  favBlurb: { fontFamily: fonts.display, fontSize: 11.5, color: surface.textTertiary, marginTop: 2 },
});
