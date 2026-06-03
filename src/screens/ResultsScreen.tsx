// src/screens/ResultsScreen.tsx
// Post-check-in cinematic reveal.
// PORT: app/checkin/results.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import type { RankTier, Diagnosis, UserBuild, Mission, CategoryScore } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { RankEmblem } from '../components/RankEmblem';
import { EnergyBar } from '../components/EnergyBar';
import { HudCard } from '../components/HudCard';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';

import {
  categories, getTier, surface, spacing, fonts, alpha, state, radius,
} from '../design-system/tokens';
import { mockBuild, mockAvailableMissions } from '../design-system/mockData';

export interface ResultsScreenProps {
  tier?: RankTier;
  prevScore?: number;
  newScore?: number;
  diagnosis?: Diagnosis;
  build?: UserBuild;
  nextMission?: Mission;
  categoryMovement?: Array<{ id: CategoryScore['id']; delta: number }>;
  onShare?: () => void;
  onContinue?: () => void;
  onNextMissionPress?: (id: string) => void;
}

const EMPTY_DIAGNOSIS: Diagnosis = {
  strongest: { category: 'discipline', delta: 0 },
  weakest:   { category: 'discipline', delta: 0 },
  narrative: '',
};

export function ResultsScreen({
  tier = getTier('apex'),
  prevScore = 0,
  newScore = 0,
  diagnosis = EMPTY_DIAGNOSIS,
  build = mockBuild,
  nextMission = mockAvailableMissions[0],
  categoryMovement,
  onShare,
  onContinue,
  onNextMissionPress,
}: ResultsScreenProps) {
  const delta = +(newScore - prevScore).toFixed(1);
  const display = useDeltaCount(prevScore, newScore, 1200);
  const movement = categoryMovement ?? [];

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier} intensity={1.2}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* status tag */}
        <View style={styles.statusWrap}>
          <View style={[styles.statusTag, { backgroundColor: alpha(state.win, 0.14), borderColor: alpha(state.win, 0.4) }]}>
            <View style={[styles.statusDot, { backgroundColor: state.win }]}/>
            <Text style={[styles.statusLabel, { color: state.win }]}>CHECK-IN PROCESSED · {new Date().toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
          </View>
        </View>

        {/* EMBLEM */}
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <RankEmblem tier={tier} size={200}/>
        </View>

        {/* SCORE REVEAL */}
        <View style={styles.scoreBlock}>
          <Text style={styles.cap}>LIFE SCORE</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scorePrev}>{prevScore.toFixed(1)}</Text>
            <Svg width={18} height={14} viewBox="0 0 18 14" style={{ marginTop: 4 }}>
              <Path d="M1 7h14M11 1l5 6-5 6" stroke={tier.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
            <Text style={[styles.scoreNew, { color: tier.primary }]}>{display.toFixed(1)}</Text>
          </View>

          <View style={[styles.deltaPill, { backgroundColor: alpha(tier.primary, 0.12), borderColor: alpha(tier.primary, 0.33) }]}>
            <Svg width={9} height={9} viewBox="0 0 9 9"><Path d="M4.5 1l3 4H6v3H3V5H1z" fill={tier.primary}/></Svg>
            <Text style={[styles.deltaLabel, { color: tier.primary }]}>+{delta.toFixed(1)} POINTS · BEST WEEK Q4</Text>
          </View>
        </View>

        {/* TIER PANEL */}
        <View style={styles.padded}>
          <HudCard accentColor={tier.primary} showTopEdge>
            <View style={styles.tierRow}>
              <View>
                <Text style={styles.smallCap}>TIER STATUS</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <Text style={[styles.tierName, { color: tier.primary }]}>{tier.name}</Text>
                  <Text style={styles.tierSub}>{tier.sublabel} · HELD</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.smallCap}>↑ TO ZENITH</Text>
                <Text style={styles.tierToGo}>{(9.0 - newScore).toFixed(1)} PTS</Text>
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <EnergyBar value={(newScore / 9.0) * 100} tier={tier} thickness={6}/>
            </View>
          </HudCard>
        </View>

        {/* CATEGORY MOVEMENT */}
        <SectionHeader index="02" title="Category Movement"/>
        <View style={[styles.padded, { gap: 8 }]}>
          {movement.map(m => (
            <CategoryDeltaRow key={m.id} id={m.id} delta={m.delta} tier={tier}/>
          ))}
        </View>

        {/* STRENGTHS / WEAKNESSES */}
        <SectionHeader index="03" title="Diagnosis"/>
        <View style={[styles.padded, { flexDirection: 'row', gap: 10 }]}>
          <FocusCard
            label="STRONGEST"
            categoryId={diagnosis.strongest.category}
            delta={diagnosis.strongest.delta}
            tone={state.win}
            note="Fastest mover this cycle."
          />
          <FocusCard
            label="WEAKEST"
            categoryId={diagnosis.weakest.category}
            delta={diagnosis.weakest.delta}
            tone={state.hold}
            note={diagnosis.weakest.delta < 0 ? 'Regressed — flag for review.' : 'Slow movement. Push it.'}
          />
        </View>

        {/* IMBALANCE WARNING */}
        {diagnosis.imbalance && diagnosis.imbalance.gap >= 0.8 && (
          <View style={[styles.padded, { marginTop: 16 }]}>
            <HudCard accentColor={state.hold} variant="default" showTopEdge>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={[styles.warnIcon, { borderColor: alpha(state.hold, 0.4), backgroundColor: alpha(state.hold, 0.14) }]}>
                  <Svg width={14} height={14} viewBox="0 0 14 14"><Path d="M7 1l6 11H1z" stroke={state.hold} strokeWidth={1.6} fill="none" strokeLinejoin="round"/><Path d="M7 6v3M7 11v0.4" stroke={state.hold} strokeWidth={1.6} strokeLinecap="round"/></Svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.smallCap, { color: state.hold }]}>IMBALANCE</Text>
                  <Text style={styles.narrative}>
                    {categories[diagnosis.imbalance.high].name} is{' '}
                    <Text style={{ color: '#fff', fontFamily: fonts.monoBold }}>{diagnosis.imbalance.gap.toFixed(1)} pts</Text>{' '}
                    ahead of {categories[diagnosis.imbalance.low].name}. Balance the build.
                  </Text>
                </View>
              </View>
            </HudCard>
          </View>
        )}

        {/* OS NARRATIVE */}
        <View style={[styles.padded, { marginTop: 16 }]}>
          <HudCard accentColor={tier.accent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <EqIcon color={tier.accent}/>
              <Text style={[styles.smallCap, { color: tier.accent }]}>SIGNAL · OS INSIGHT</Text>
            </View>
            <Text style={styles.narrative}>{diagnosis.narrative}</Text>
          </HudCard>
        </View>

        {/* BUILD */}
        <SectionHeader index="04" title="Assigned Build"/>
        <View style={styles.padded}>
          <HudCard accentColor={tier.primary} variant="mission" showCorners>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.smallCap}>ARCHETYPE</Text>
                <Text style={[styles.buildName, { color: tier.primary }]}>{build.name.toUpperCase()}</Text>
                <Text style={styles.buildTagline}>{build.tagline}</Text>
              </View>
              <View style={[styles.buildBadge, { borderColor: alpha(tier.primary, 0.4) }]}>
                <Text style={[styles.buildBadgeText, { color: tier.primary }]}>v2</Text>
              </View>
            </View>
            <View style={{ marginTop: 14, gap: 6 }}>
              {(Object.keys(build.signature) as Array<keyof typeof build.signature>).map(k => (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles.buildCat}>{categories[k].name}</Text>
                  <View style={{ flex: 1 }}>
                    <EnergyBar value={build.signature[k] * 100} tier={tier} thickness={4} shimmer={false}/>
                  </View>
                  <Text style={styles.buildVal}>{Math.round(build.signature[k] * 100)}</Text>
                </View>
              ))}
            </View>
          </HudCard>
        </View>

        {/* NEXT MISSION RECOMMENDATION */}
        <SectionHeader index="05" title="Recommended Next"/>
        <Pressable
          style={styles.padded}
          onPress={() => onNextMissionPress?.(nextMission.id)}
        >
          <HudCard accentColor={tier.primary} variant="mission" showTopEdge>
            <Text style={styles.opCode}>{nextMission.id} · FEATURED</Text>
            <Text style={styles.missionTitle}>{nextMission.title}</Text>
            <Text style={styles.missionSub}>{nextMission.subtitle}</Text>
            {nextMission.reason && <Text style={styles.missionReason}>{nextMission.reason}</Text>}
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.missionRewardStamp, { backgroundColor: alpha(tier.primary, 0.16), borderColor: alpha(tier.primary, 0.4) }]}>
                <Text style={[styles.missionRewardText, { color: tier.primary }]}>+{nextMission.rewardScore} score</Text>
              </View>
              {nextMission.rewardRP != null && (
                <Text style={styles.missionRP}>+{nextMission.rewardRP} RP</Text>
              )}
            </View>
          </HudCard>
        </Pressable>
      </ScrollView>

      {/* BOTTOM CTAs */}
      <View style={styles.ctaBar}>
        <LinearGradient colors={['transparent', alpha(surface.bg, 0.95)]} style={StyleSheet.absoluteFill}/>
        <Pressable onPress={onShare} style={styles.ghostBtn}>
          <Svg width={13} height={14} viewBox="0 0 13 14"><Path d="M6.5 1v8M3 4.5l3.5-3.5L10 4.5M1 9v3a1 1 0 001 1h9a1 1 0 001-1V9" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>
          <Text style={styles.ghostText}>SHARE</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <PrimaryCTA tier={tier} label="Enter Operating System" onPress={onContinue}/>
        </View>
      </View>
    </View>
  );
}

/* ─── hooks ─────────────────────────────────────────────────────── */
function useDeltaCount(from: number, to: number, duration: number) {
  const [v, setV] = useState(from);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(from + (to - from) * eased);
      if (t === 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [from, to, duration]);
  return v;
}

/* ─── local pieces ──────────────────────────────────────────────── */
function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <View style={shStyles.row}>
      <Text style={shStyles.idx}>{index}</Text>
      <Text style={shStyles.title}>{title.toUpperCase()}</Text>
    </View>
  );
}
const shStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl, marginBottom: 12,
  },
  idx: { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  title: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', letterSpacing: 1.4, color: alpha('#fff', 0.85) },
});

function CategoryDeltaRow({ id, delta, tier }: { id: keyof typeof categories; delta: number; tier: RankTier }) {
  const cat = categories[id];
  const positive = delta >= 0;
  return (
    <HudCard padding={{ x: 14, y: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[styles.iconChip, { backgroundColor: alpha(cat.accent, 0.18), borderColor: alpha(cat.accent, 0.33) }]}>
          <CategoryGlyphIcon glyph={cat.glyph} color={cat.accent} size={16}/>
        </View>
        <Text style={{ flex: 1, color: '#fff', fontFamily: fonts.display, fontSize: 13, fontWeight: '600' }}>{cat.name}</Text>
        <View style={{ width: 60 }}>
          <EnergyBar
            value={Math.min(100, 60 + delta * 80)}
            tier={tier}
            thickness={4}
            shimmer={false}
            colors={[cat.accent, tier.mid, cat.accent]}
          />
        </View>
        <Text style={{
          fontFamily: fonts.monoBold, fontSize: 11, fontWeight: '600',
          color: positive ? state.win : delta === 0 ? alpha('#fff', 0.5) : state.break,
          width: 36, textAlign: 'right',
        }}>
          {positive ? '+' : ''}{delta.toFixed(1)}
        </Text>
      </View>
    </HudCard>
  );
}

function FocusCard({
  label, categoryId, delta, tone, note,
}: { label: string; categoryId: keyof typeof categories; delta: number; tone: string; note: string }) {
  const cat = categories[categoryId];
  return (
    <View style={{ flex: 1 }}>
      <HudCard accentColor={tone}>
        <Text style={[styles.smallCap, { color: tone }]}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 4 }}>
          <CategoryGlyphIcon glyph={cat.glyph} color="#fff" size={14}/>
          <Text style={{ color: '#fff', fontFamily: fonts.displayBold, fontSize: 14 }}>{cat.name}</Text>
        </View>
        <Text style={{ fontFamily: fonts.monoBold, fontSize: 18, color: tone, marginTop: 2 }}>
          {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
        </Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 11, color: surface.textTertiary, marginTop: 6 }}>{note}</Text>
      </HudCard>
    </View>
  );
}

function EqIcon({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 12 }}>
      {[0.4, 1, 0.6, 1, 0.4].map((h, i) => (
        <View key={i} style={{ width: 2, height: 12 * h, backgroundColor: color, borderRadius: 1 }}/>
      ))}
    </View>
  );
}

/* ─── styles ─────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface.bg },
  padded: { paddingHorizontal: spacing.xl },

  statusWrap: { alignItems: 'center', paddingTop: spacing.hero, paddingBottom: 14 },
  statusTag: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.pill, borderWidth: 1,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusLabel: { fontFamily: fonts.monoBold, fontSize: 10, fontWeight: '600', letterSpacing: 1.4 },

  scoreBlock: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: 12 },
  cap: { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 2, marginBottom: 6 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  scorePrev: {
    fontFamily: fonts.mono, fontSize: 28, color: surface.textMuted,
    textDecorationLine: 'line-through',
  },
  scoreNew: {
    fontFamily: fonts.monoBold, fontSize: 88, fontWeight: '600',
    letterSpacing: -3, lineHeight: 88,
  },
  deltaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill, borderWidth: 1, marginTop: 6,
  },
  deltaLabel: { fontFamily: fonts.monoBold, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  tierRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallCap: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.2 },
  tierName: { fontFamily: fonts.displayBold, fontSize: 18, fontWeight: '700', letterSpacing: 3 },
  tierSub:  { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 1 },
  tierToGo: { fontFamily: fonts.mono, fontSize: 14, color: '#fff', marginTop: 4 },

  iconChip: {
    width: 32, height: 32, borderRadius: 9, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  narrative: {
    fontFamily: fonts.display, fontSize: 13.5, lineHeight: 19,
    color: alpha('#fff', 0.9),
  },
  warnIcon: {
    width: 32, height: 32, borderRadius: 9, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  buildName: { fontFamily: fonts.displayBold, fontSize: 22, fontWeight: '700', letterSpacing: 2, marginTop: 4 },
  buildTagline: { fontFamily: fonts.display, fontSize: 12, color: surface.textSecondary, marginTop: 2 },
  buildBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  buildBadgeText: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 0.5 },
  buildCat: { fontFamily: fonts.display, fontSize: 11, color: surface.textSecondary, width: 100 },
  buildVal: { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, width: 26, textAlign: 'right' },

  opCode: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.2, marginBottom: 4 },
  missionTitle: { fontFamily: fonts.displayBold, fontSize: 18, fontWeight: '600', color: '#fff', letterSpacing: -0.2 },
  missionSub: { fontFamily: fonts.display, fontSize: 11.5, color: surface.textTertiary, marginTop: 4 },
  missionReason: { fontFamily: fonts.display, fontSize: 12, color: surface.textSecondary, marginTop: 8, lineHeight: 16 },
  missionRewardStamp: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  missionRewardText: { fontFamily: fonts.monoBold, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  missionRP: { fontFamily: fonts.mono, fontSize: 11, color: surface.textTertiary },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 40,
    flexDirection: 'row', gap: 10,
  },
  ghostBtn: {
    height: 44, paddingHorizontal: 18, borderRadius: radius.pill,
    borderWidth: 1, borderColor: alpha('#FF2D5C', 0.33),
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
  },
  ghostText: { fontFamily: fonts.displayBold, fontSize: 12, fontWeight: '600', color: '#fff', letterSpacing: 1.4 },
});
