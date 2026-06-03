// src/screens/CalibrationResultsScreen.tsx
// Cinematic baseline-result reveal.
// PORT: app/(onboarding)/results.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { CalibrationResult, Mission, RankTier } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { RankEmblem } from '../components/RankEmblem';
import { HudCard } from '../components/HudCard';
import { EnergyBar } from '../components/EnergyBar';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';
import { LoadingScanState } from '../components/LoadingScanState';

import {
  categories, getTier, surface, spacing, fonts, alpha, radius, state,
} from '../design-system/tokens';
import { mockCalibrationResult, mockAvailableMissions } from '../design-system/mockData';

export interface CalibrationResultsScreenProps {
  result?: CalibrationResult;
  firstMission?: Mission;
  showScannerFor?: number;
  onContinue?: () => void;
}

export function CalibrationResultsScreen({
  result = mockCalibrationResult,
  firstMission = mockAvailableMissions.find(m => m.id === mockCalibrationResult.firstMissionId) ?? mockAvailableMissions[0],
  showScannerFor = 0,
  onContinue,
}: CalibrationResultsScreenProps) {
  const tier: RankTier = getTier(result.initialTier);
  const [scanning, setScanning] = useState(showScannerFor > 0);

  useEffect(() => {
    if (!scanning) return;
    const id = setTimeout(() => setScanning(false), showScannerFor);
    return () => clearTimeout(id);
  }, [scanning, showScannerFor]);

  if (scanning) {
    return (
      <View style={styles.root}>
        <AtmosphereBackground tier={tier} intensity={1.1}/>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }}>
          <LoadingScanState
            tier={tier}
            status="COMPILING BASELINE"
            lines={[
              'Sampling 5 pillars · 5/5 captured',
              'Cross-referencing identity tags',
              'Computing initial tier assignment',
              'Selecting opening operation',
            ]}
          />
        </View>
      </View>
    );
  }

  const strongest = categories[result.strongest.id];
  const weakest = categories[result.weakest.id];

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier} intensity={1.2}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Status bar */}
        <View style={styles.statusWrap}>
          <View style={[styles.statusTag, { backgroundColor: alpha(state.win, 0.14), borderColor: alpha(state.win, 0.4) }]}>
            <View style={[styles.dot, { backgroundColor: state.win }]}/>
            <Text style={[styles.statusLabel, { color: state.win }]}>BASELINE COMPILED</Text>
          </View>
        </View>

        {/* EMBLEM */}
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <RankEmblem tier={tier} size={210} intensity={1.2}/>
        </View>

        {/* SCORE */}
        <View style={styles.scoreBlock}>
          <Text style={styles.cap}>INITIAL LIFE SCORE</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.score, { color: tier.primary }]}>{result.initialScore.toFixed(1)}</Text>
            <Text style={styles.scoreUnit}>/10</Text>
          </View>
          <View style={styles.tierRow}>
            <View style={[styles.tierRule, { backgroundColor: tier.primary }]}/>
            <Text style={[styles.tierName, { color: tier.primary }]}>{tier.name}</Text>
            <Text style={styles.tierSub}>{tier.sublabel}</Text>
            <View style={[styles.tierRule, { backgroundColor: tier.primary }]}/>
          </View>
        </View>

        {/* NARRATIVE */}
        <View style={styles.padded}>
          <HudCard accentColor={tier.accent} showTopEdge padding={{ x: 16, y: 14 }}>
            <Text style={[styles.smallCap, { color: tier.accent, marginBottom: 6 }]}>
              SIGNAL · OS BASELINE
            </Text>
            <Text style={styles.narrative}>{result.narrative}</Text>
          </HudCard>
        </View>

        {/* STRONGEST + WEAKEST */}
        <SectionHeader index="02" title="Baseline Diagnosis"/>
        <View style={[styles.padded, { flexDirection: 'row', gap: 10 }]}>
          <FocusCard
            label="STRONGEST"
            categoryId={result.strongest.id}
            score={result.strongest.value}
            tone={state.win}
          />
          <FocusCard
            label="WEAKEST"
            categoryId={result.weakest.id}
            score={result.weakest.value}
            tone={state.hold}
          />
        </View>

        {/* BUILD */}
        <SectionHeader index="03" title="Assigned Build"/>
        <View style={styles.padded}>
          <HudCard accentColor={tier.primary} variant="mission" showCorners>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.smallCap}>ARCHETYPE</Text>
                <Text style={[styles.buildName, { color: tier.primary }]}>{result.build.name.toUpperCase()}</Text>
                <Text style={styles.buildTagline}>{result.build.tagline}</Text>
              </View>
              <View style={[styles.buildBadge, { borderColor: alpha(tier.primary, 0.4) }]}>
                <Text style={[styles.buildBadgeText, { color: tier.primary }]}>v1</Text>
              </View>
            </View>
            <View style={{ marginTop: 14, gap: 6 }}>
              {(Object.keys(result.build.signature) as Array<keyof typeof result.build.signature>).map(k => (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles.buildCat}>{categories[k].name}</Text>
                  <View style={{ flex: 1 }}>
                    <EnergyBar value={result.build.signature[k] * 100} tier={tier} thickness={4} shimmer={false}/>
                  </View>
                  <Text style={styles.buildVal}>{Math.round(result.build.signature[k] * 100)}</Text>
                </View>
              ))}
            </View>
          </HudCard>
        </View>

        {/* FIRST MISSION */}
        <SectionHeader index="04" title="Opening Operation"/>
        <View style={styles.padded}>
          <HudCard accentColor={tier.primary} variant="mission" showTopEdge>
            <Text style={styles.opCode}>{firstMission.id} · ASSIGNED</Text>
            <Text style={styles.missionTitle}>{firstMission.title}</Text>
            <Text style={styles.missionSub}>{firstMission.subtitle}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <View style={[styles.rewardStamp, { backgroundColor: alpha(tier.primary, 0.16), borderColor: alpha(tier.primary, 0.4) }]}>
                <Text style={[styles.rewardText, { color: tier.primary }]}>+{firstMission.rewardScore.toFixed(1)} score</Text>
              </View>
              {firstMission.rewardRP != null && (
                <Text style={styles.missionRP}>+{firstMission.rewardRP} RP</Text>
              )}
            </View>
          </HudCard>
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <LinearGradient colors={['transparent', alpha(surface.bg, 0.95)]} style={StyleSheet.absoluteFill}/>
        <PrimaryCTA tier={tier} label="Enter Operating System" onPress={onContinue}/>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.xl, marginTop: spacing.xxl, marginBottom: 12 },
  idx: { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  title: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', letterSpacing: 1.4, color: alpha('#fff', 0.85) },
});

function FocusCard({ label, categoryId, score, tone }: { label: string; categoryId: keyof typeof categories; score: number; tone: string }) {
  const cat = categories[categoryId];
  return (
    <View style={{ flex: 1 }}>
      <HudCard accentColor={tone}>
        <Text style={[focusStyles.cap, { color: tone }]}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 4 }}>
          <CategoryGlyphIcon glyph={cat.glyph} color="#fff" size={14}/>
          <Text style={{ color: '#fff', fontFamily: fonts.displayBold, fontSize: 14 }}>{cat.name}</Text>
        </View>
        <Text style={{ fontFamily: fonts.monoBold, fontSize: 24, color: tone, marginTop: 4 }}>
          {score.toFixed(1)}
        </Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 11, color: surface.textTertiary, marginTop: 6 }}>
          baseline reading
        </Text>
      </HudCard>
    </View>
  );
}
const focusStyles = StyleSheet.create({
  cap: { fontFamily: fonts.monoBold, fontSize: 9.5, letterSpacing: 1.2 },
});

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

  scoreBlock: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: 14 },
  cap: { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 2, marginBottom: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  score: {
    fontFamily: fonts.monoBold, fontSize: 72, fontWeight: '600',
    letterSpacing: -2, lineHeight: 72,
  },
  scoreUnit: { fontFamily: fonts.mono, fontSize: 22, color: surface.textMuted },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  tierRule: { width: 16, height: 1, opacity: 0.85 },
  tierName: { fontFamily: fonts.displayBold, fontSize: 14, fontWeight: '600', letterSpacing: 4 },
  tierSub:  { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },

  smallCap: { fontFamily: fonts.monoBold, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.2 },
  narrative: { fontFamily: fonts.display, fontSize: 13.5, color: alpha('#fff', 0.9), lineHeight: 19 },

  buildName: { fontFamily: fonts.displayBold, fontSize: 22, fontWeight: '700', letterSpacing: 2, marginTop: 4 },
  buildTagline: { fontFamily: fonts.display, fontSize: 12, color: surface.textSecondary, marginTop: 2 },
  buildBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  buildBadgeText: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 0.5 },
  buildCat: { fontFamily: fonts.display, fontSize: 11, color: surface.textSecondary, width: 100 },
  buildVal: { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, width: 26, textAlign: 'right' },

  opCode: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.2, marginBottom: 4 },
  missionTitle: { fontFamily: fonts.displayBold, fontSize: 19, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  missionSub: { fontFamily: fonts.display, fontSize: 11.5, color: surface.textTertiary, marginTop: 4 },
  rewardStamp: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  rewardText: { fontFamily: fonts.monoBold, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  missionRP: { fontFamily: fonts.mono, fontSize: 11, color: surface.textTertiary },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 40,
  },
});
