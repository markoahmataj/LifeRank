// src/screens/HomeScreen.tsx
// "Your operating system is online." — the primary dashboard.
// PORT: app/(tabs)/index.tsx

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Polyline, Defs, LinearGradient as SvgLG, Stop } from 'react-native-svg';

import type { LifeScore, LogbookEntry, RankTier, UserState } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { RankEmblem } from '../components/RankEmblem';
import { EnergyBar } from '../components/EnergyBar';
import { HudCard } from '../components/HudCard';
import { CategoryStatCard } from '../components/CategoryStatCard';
import { MissionCard } from '../components/MissionCard';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';

import {
  categories, getTier, spacing, surface, fonts, alpha, state, radius,
} from '../design-system/tokens';
import { mockBuild, mockQuickActions } from '../design-system/mockData';

const EMPTY_USER: UserState = {
  handle: '@you', displayName: 'You', initial: 'Y',
  score: { value: 0, delta: 0, tier: 'dormant', nextRankAt: 3.0, streak: 0 },
  build: mockBuild,
  categories: [],
  activeMissions: [],
};

export interface HomeScreenProps {
  user?: UserState;
  logbook?: LogbookEntry[];
  onNotifications?: () => void;
  onProfile?: () => void;
  onViewAllCategories?: () => void;
  onMissionPress?: (id: string) => void;
  onCategoryPress?: (id: string) => void;
  onQuickAction?: (id: string) => void;
  onStreakPress?: () => void;
  onTrendPress?: () => void;
  onBrowseMissions?: () => void;
}

export function HomeScreen({
  user = EMPTY_USER,
  logbook = [],
  onNotifications,
  onProfile,
  onViewAllCategories,
  onMissionPress,
  onCategoryPress,
  onQuickAction,
  onStreakPress,
  onTrendPress,
  onBrowseMissions,
}: HomeScreenProps) {
  const tier: RankTier = getTier(user.score.tier);
  const activeMission = user.activeMissions[0];

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier}/>

      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerCaption}>GOOD MORNING, {user.displayName.toUpperCase()}</Text>
            <Text style={styles.headerTitle}>Your operating system is online.</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={onNotifications}>
              <Svg width={14} height={16} viewBox="0 0 14 16" fill="none">
                <Path d="M7 1.5C4.5 1.5 3 3.5 3 6v3l-1.5 2.5h11L11 9V6c0-2.5-1.5-4.5-4-4.5z" stroke="#fff" strokeWidth={1.4}/>
                <Path d="M5.5 13a1.5 1.5 0 003 0" stroke="#fff" strokeWidth={1.4}/>
              </Svg>
              {/* No notification system yet — no static pip implying unread signals. */}
            </Pressable>

            <Pressable onPress={onProfile} style={[styles.avatarRing, { backgroundColor: 'transparent' }]}>
              <LinearGradient
                colors={[tier.primary, tier.mid, tier.far]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.avatarInner}>
                <Text style={styles.avatarLetter}>{user.initial}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* HERO — EMBLEM + LIFE SCORE */}
        <View style={styles.heroBlock}>
          <View style={{ alignItems: 'center' }}>
            <RankEmblem tier={tier} size={200}/>
          </View>

          <View style={styles.scoreBlock}>
            <View style={styles.scoreCaptionRow}>
              <Text style={styles.scoreCaption}>LIFE SCORE</Text>
              <DeltaPill
                value={`${user.score.delta >= 0 ? '+' : ''}${user.score.delta.toFixed(1)} THIS WEEK`}
                positive={user.score.delta >= 0}
              />
            </View>

            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color: tier.primary }]}>{user.score.value.toFixed(1)}</Text>
              <Text style={styles.scoreUnit}>/10</Text>
            </View>

            <View style={styles.tierRow}>
              <View style={[styles.tierRule, { backgroundColor: tier.primary }]}/>
              <Text style={[styles.tierName, { color: tier.primary }]}>{tier.name}</Text>
              <Text style={styles.tierSub}>{tier.sublabel}</Text>
              <View style={[styles.tierRule, { backgroundColor: tier.primary }]}/>
            </View>
          </View>

          {/* PROGRESSION BAR */}
          <View style={styles.progressBlock}>
            <View style={styles.progressMeta}>
              <Text style={styles.metaLabel}>PROGRESS TO ZENITH</Text>
              <Text style={styles.metaValue}>
                {user.score.value.toFixed(1)} / {user.score.nextRankAt.toFixed(1)}
              </Text>
            </View>
            <EnergyBar value={(user.score.value / user.score.nextRankAt) * 100} tier={tier} thickness={8}/>
            <View style={styles.progressFoot}>
              <Text style={styles.footLabel}>{tier.name.toUpperCase()}</Text>
              <Text style={[styles.footLabel, { color: surface.textSecondary }]}>
                ↑ {(user.score.nextRankAt - user.score.value).toFixed(1)} TO PROMOTE
              </Text>
              <Text style={styles.footLabel}>ZENITH</Text>
            </View>
          </View>
        </View>

        {/* CATEGORIES */}
        <SectionHeader index="02" title="Life Categories" action="VIEW ALL →" onAction={onViewAllCategories}/>
        <View style={styles.categoryGrid}>
          {user.categories.map((cs, i) => {
            const cat = categories[cs.id];
            const isFull = i === user.categories.length - 1 && user.categories.length % 2 === 1;
            return (
              <View
                key={cs.id}
                style={isFull ? { width: '100%' } : { width: '48%' }}
              >
                <CategoryStatCard
                  category={cat}
                  score={cs}
                  tier={tier}
                  fullWidth={isFull}
                  onPress={() => onCategoryPress?.(cs.id)}
                />
              </View>
            );
          })}
        </View>

        {/* ACTIVE MISSION */}
        <SectionHeader index="03" title="Today's Mission"/>
        <View style={styles.sectionBody}>
          {activeMission ? (
            <MissionCard
              mission={activeMission}
              tier={tier}
              variant="hero"
              accentColor={tier.primary}
              onPress={() => onMissionPress?.(activeMission.id)}
            />
          ) : (
            <Pressable onPress={onBrowseMissions}>
              <HudCard>
                <Text style={styles.emptyMissionTitle}>No active operation</Text>
                <Text style={styles.emptyMissionBody}>
                  Accept an operation to strengthen a category over time and earn RP.
                </Text>
                <View style={[styles.emptyMissionCta, { borderColor: alpha(tier.primary, 0.4) }]}>
                  <Text style={[styles.emptyMissionCtaText, { color: tier.primary }]}>BROWSE OPERATIONS →</Text>
                </View>
              </HudCard>
            </Pressable>
          )}
        </View>

        {/* STREAK + TREND */}
        <View style={[styles.sectionBody, { flexDirection: 'row', gap: 10, marginTop: spacing.lg }]}>
          <Pressable style={{ flex: 1 }} onPress={onStreakPress}>
            <StreakCard streak={user.score.streak} tier={tier}/>
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={onTrendPress}>
            <TrendCard score={user.score} logbook={logbook}/>
          </Pressable>
        </View>

        {/* QUICK ACTIONS */}
        <View style={{ height: spacing.lg }}/>
        <SectionHeader index="04" title="Quick Actions"/>
        <View style={[styles.sectionBody, { flexDirection: 'row', gap: 8 }]}>
          {mockQuickActions.map(q => (
            <QuickActionBtn
              key={q.id}
              label={q.label}
              color={q.color}
              onPress={() => onQuickAction?.(q.id)}
            />
          ))}
        </View>

        <View style={{ height: 100 }}/>
      </ScrollView>
    </View>
  );
}

/* ─── pieces local to this screen ────────────────────────────────── */

function SectionHeader({ index, title, action, onAction }: { index: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionLeft}>
        <Text style={styles.sectionIndex}>{index}</Text>
        <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      </View>
      {action && (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

function DeltaPill({ value, positive }: { value: string; positive: boolean }) {
  return (
    <View style={[
      styles.deltaPill,
      {
        backgroundColor: positive ? 'rgba(52,211,153,0.14)' : 'rgba(248,113,113,0.14)',
        borderColor:     positive ? 'rgba(52,211,153,0.4)'  : 'rgba(248,113,113,0.4)',
      },
    ]}>
      <Svg width={8} height={8} viewBox="0 0 8 8">
        <Path d="M4 1l3 4H5v3H3V5H1z" fill={positive ? state.win : state.break}/>
      </Svg>
      <Text style={[styles.deltaLabel, { color: positive ? state.win : state.break }]}>{value}</Text>
    </View>
  );
}

function StreakCard({ streak, tier }: { streak: number; tier: RankTier }) {
  return (
    <HudCard accentColor={tier.primary}>
      <View style={styles.streakHeader}>
        <Svg width={11} height={13} viewBox="0 0 11 13">
          <Path d="M5.5 1C7 3.5 9.5 4 9.5 7.5C9.5 10.5 7.5 12 5.5 12C3.5 12 1.5 10.5 1.5 7.5C1.5 5.5 3 4.5 3 2.5C3 4 4.5 4.5 5.5 6C5.5 4 4.5 2.5 5.5 1Z"
                fill={tier.primary} stroke={tier.primary} strokeLinejoin="round"/>
        </Svg>
        <Text style={styles.smallCaption}>STREAK</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text style={styles.streakValue}>{streak}</Text>
        <Text style={styles.streakUnit}>days</Text>
      </View>
      <Text style={styles.streakNote}>Personal best · keep going</Text>
    </HudCard>
  );
}

function TrendCard({ score, logbook }: { score: LifeScore; logbook: LogbookEntry[] }) {
  const recent7 = [...logbook].slice(0, 7).reverse();
  const series = recent7.length >= 2 ? recent7.map(e => e.lifeScore) : null;
  const delta = score.delta;
  const deltaStr = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`;
  const W = 100, H = 30;

  if (!series) {
    return (
      <HudCard>
        <View style={styles.streakHeader}>
          <View style={[styles.dot, { backgroundColor: state.win }]}/>
          <Text style={styles.smallCaption}>7-DAY TREND</Text>
        </View>
        <Text style={[styles.trendValue, { color: surface.textTertiary }]}>—</Text>
        <Text style={styles.streakNote}>No data yet</Text>
      </HudCard>
    );
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * W},${H - ((v - min) / (max - min || 1)) * H}`).join(' ');
  const periodDelta = +(series[series.length - 1] - series[0]).toFixed(1);
  const periodStr = `${periodDelta >= 0 ? '+' : ''}${periodDelta.toFixed(1)}`;
  const trendColor = delta >= 0 ? state.win : state.break;

  return (
    <HudCard>
      <View style={styles.streakHeader}>
        <View style={[styles.dot, { backgroundColor: trendColor }]}/>
        <Text style={styles.smallCaption}>7-DAY TREND</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text style={styles.trendValue}>{periodStr}</Text>
        <Text style={[styles.trendDelta, { color: trendColor }]}>{delta >= 0 ? '↑' : '↓'} {deltaStr}</Text>
      </View>
      <View style={{ marginTop: 6 }}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <SvgLG id="trendArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={trendColor} stopOpacity={0.5}/>
              <Stop offset="100%" stopColor={trendColor} stopOpacity={0}/>
            </SvgLG>
          </Defs>
          <Polyline points={`0,${H} ${pts} ${W},${H}`} fill="url(#trendArea)"/>
          <Polyline points={pts} fill="none" stroke={trendColor} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      </View>
    </HudCard>
  );
}

function QuickActionBtn({ label, color, onPress }: { label: string; color: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickIcon, { backgroundColor: alpha(color, 0.18), borderColor: alpha(color, 0.33) }]}>
        <Svg width={14} height={14} viewBox="0 0 14 14"><Path d="M7 1v12M1 7h12" stroke={color} strokeWidth={1.8} strokeLinecap="round"/></Svg>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

/* ─── styles ─────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface.bg },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.hero,
    paddingBottom: 18,
  },
  headerCaption: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: surface.textTertiary,
    letterSpacing: 1.4,
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    fontWeight: '600',
    color: surface.textPrimary,
    letterSpacing: -0.1,
    marginTop: 2,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: surface.glassFill, borderWidth: 1, borderColor: surface.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyMissionTitle: { fontFamily: fonts.displayBold, fontSize: 15, fontWeight: '600', color: surface.textPrimary },
  emptyMissionBody: { fontFamily: fonts.display, fontSize: 12.5, color: surface.textTertiary, marginTop: 6, lineHeight: 17 },
  emptyMissionCta: {
    alignSelf: 'flex-start', marginTop: 12,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1,
  },
  emptyMissionCtaText: { fontFamily: fonts.monoBold, fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  avatarRing: {
    width: 36, height: 36, borderRadius: 12,
    padding: 1.5, overflow: 'hidden',
  },
  avatarInner: {
    flex: 1, borderRadius: 10,
    backgroundColor: surface.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: fonts.displayBold, fontWeight: '700', fontSize: 13,
    color: surface.textPrimary,
  },

  heroBlock: { paddingHorizontal: spacing.xl, paddingBottom: 18 },
  scoreBlock: { alignItems: 'center', marginTop: -4 },
  scoreCaptionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreCaption: { fontFamily: fonts.mono, fontSize: 11, color: surface.textTertiary, letterSpacing: 1.6 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  scoreValue: {
    fontFamily: fonts.monoBold,
    fontSize: 64, fontWeight: '600', letterSpacing: -2, lineHeight: 64,
  },
  scoreUnit: { fontFamily: fonts.mono, fontSize: 22, color: surface.textMuted },
  tierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4,
  },
  tierRule: { width: 16, height: 1, opacity: 0.8 },
  tierName: {
    fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600',
    letterSpacing: 4,
  },
  tierSub: {
    fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1,
  },

  progressBlock: { marginTop: 18 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaLabel: { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 1 },
  metaValue: { fontFamily: fonts.mono, fontSize: 10, color: surface.textSecondary },
  progressFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  footLabel: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textMuted, letterSpacing: 0.6 },

  vitalsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },

  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: 12,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIndex: { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 13, fontWeight: '600',
    letterSpacing: 1.4,
    color: alpha(surface.textPrimary, 0.85),
  },
  sectionAction: {
    fontFamily: fonts.mono, fontSize: 10,
    color: surface.textTertiary, letterSpacing: 0.8,
  },

  sectionBody: { paddingHorizontal: spacing.xl },
  categoryGrid: {
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },

  deltaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 999, borderWidth: 1,
  },
  deltaLabel: { fontFamily: fonts.monoBold, fontSize: 9.5, fontWeight: '600', letterSpacing: 0.4 },

  streakHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  smallCaption: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1 },
  streakValue: { fontFamily: fonts.monoBold, fontSize: 32, fontWeight: '600', color: surface.textPrimary, lineHeight: 32 },
  streakUnit: { fontFamily: fonts.display, fontSize: 11, color: surface.textTertiary },
  streakNote: { fontFamily: fonts.display, fontSize: 10.5, color: surface.textTertiary, marginTop: 8 },
  trendValue: { fontFamily: fonts.monoBold, fontSize: 18, fontWeight: '600', color: surface.textPrimary },
  trendDelta: { fontFamily: fonts.display, fontSize: 10.5, color: state.win },

  quickAction: {
    flex: 1,
    paddingHorizontal: 8, paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: surface.hairline,
    alignItems: 'center', gap: 6,
  },
  quickIcon: {
    width: 28, height: 28, borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontFamily: fonts.display, fontSize: 10.5, color: alpha(surface.textPrimary, 0.75) },
});
