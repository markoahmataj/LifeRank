// src/screens/MissionFailedScreen.tsx
// Serious but not humiliating. Acknowledges, offers recovery.
// PORT: app/mission/failed/[id].tsx

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import type { CategoryId, Mission, RankTier } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { HudCard } from '../components/HudCard';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';

import {
  categories, getTier, surface, spacing, fonts, alpha, radius, state,
} from '../design-system/tokens';
import { mockAvailableMissions } from '../design-system/mockData';

export interface MissionFailureResult {
  missionId: string;
  title: string;
  category: CategoryId;
  missedDays: number;
  scoreImpact: number;
  streakBroken: boolean;
  recoveryMissionId: string;
}

const PLACEHOLDER_FAILURE: MissionFailureResult = {
  missionId: '', title: '—', category: 'discipline',
  missedDays: 0, scoreImpact: 0, streakBroken: false,
  recoveryMissionId: mockAvailableMissions[0]?.id ?? '',
};

export interface MissionFailedScreenProps {
  tier?: RankTier;
  failure?: MissionFailureResult;
  recoveryMission?: Mission;
  onRecalibrate?: () => void;
  onAssignRecovery?: () => void;
}

export function MissionFailedScreen({
  tier = getTier('apex'),
  failure = PLACEHOLDER_FAILURE,
  recoveryMission = mockAvailableMissions[0],
  onRecalibrate,
  onAssignRecovery,
}: MissionFailedScreenProps) {
  const cat = categories[failure.category];

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier} intensity={1.0}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* status */}
        <View style={styles.statusWrap}>
          <View style={[styles.statusTag, { backgroundColor: alpha(state.break, 0.14), borderColor: alpha(state.break, 0.4) }]}>
            <View style={[styles.dot, { backgroundColor: state.break }]}/>
            <Text style={[styles.statusLabel, { color: state.break }]}>OPERATION FAILED</Text>
          </View>
        </View>

        {/* hero icon */}
        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <View style={[styles.heroIcon, {
            borderColor: alpha(state.break, 0.4),
            backgroundColor: alpha(state.break, 0.10),
          }]}>
            <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
              <Path d="M18 4l14 26H4z" stroke={state.break} strokeWidth={1.6} strokeLinejoin="round" fill={alpha(state.break, 0.15)}/>
              <Path d="M18 14v8M18 25v0.5" stroke={state.break} strokeWidth={2} strokeLinecap="round"/>
            </Svg>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={[styles.cap, { color: cat.accent }]}>{failure.missionId} · {cat.name.toUpperCase()}</Text>
          <Text style={styles.title}>The operation failed.</Text>
          <Text style={styles.body}>
            {failure.missedDays} required day{failure.missedDays === 1 ? '' : 's'} missed.
            The system flagged the cycle as broken.
            Failure is logged but does not define you — recovery does.
          </Text>
        </View>

        {/* impact card */}
        <View style={styles.padded}>
          <HudCard accentColor={state.break} showTopEdge padding={{ x: 16, y: 14 }}>
            <Text style={[styles.cap, { color: state.break, marginBottom: 8 }]}>IMPACT</Text>
            <View style={styles.impactRow}>
              <ImpactStat label="SCORE"  value={`${failure.scoreImpact.toFixed(1)}`}                           tone={state.break}/>
              <ImpactStat label="STREAK" value={failure.streakBroken ? 'BROKEN' : 'HELD'}                      tone={failure.streakBroken ? state.break : state.win}/>
              <ImpactStat label="PILLAR" value={cat.short}                                                     tone={cat.accent}/>
            </View>
          </HudCard>
        </View>

        {/* recovery mission */}
        <SectionHeader index="02" title="Recovery Protocol"/>
        <View style={styles.padded}>
          <HudCard accentColor={tier.accent} variant="mission" showTopEdge>
            <Text style={[styles.cap, { color: tier.accent, marginBottom: 4 }]}>RECOMMENDED · LOWER STAKES</Text>
            <Text style={styles.recoveryTitle}>{recoveryMission.title}</Text>
            <Text style={styles.recoverySub}>{recoveryMission.subtitle}</Text>
            <Text style={styles.recoveryNote}>
              A short, simple protocol to rebuild trust with the system.
              No score penalty for incomplete tasks during recovery.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <View style={[styles.stamp, { backgroundColor: alpha(tier.accent, 0.16), borderColor: alpha(tier.accent, 0.4) }]}>
                <Text style={[styles.stampText, { color: tier.accent }]}>+{recoveryMission.rewardScore.toFixed(1)} score</Text>
              </View>
              <View style={[styles.stamp, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: surface.hairline }]}>
                <Text style={[styles.stampText, { color: surface.textSecondary }]}>{recoveryMission.duration ?? 7}D protocol</Text>
              </View>
            </View>
          </HudCard>
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <LinearGradient colors={['transparent', alpha(surface.bg, 0.95)]} style={StyleSheet.absoluteFill}/>
        <View style={[styles.ghost, { borderColor: surface.hairline }]}>
          <Text style={styles.ghostText} onPress={onRecalibrate}>RECALIBRATE TOMORROW</Text>
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryCTA tier={tier} label="Assign Recovery" onPress={onAssignRecovery}/>
        </View>
      </View>
    </View>
  );
}

function ImpactStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={styles.impactStat}>
      <Text style={styles.impactLabel}>{label}</Text>
      <Text style={[styles.impactValue, { color: tone }]}>{value}</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.xl, marginTop: 18, marginBottom: 12 },
  idx: { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  title: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', letterSpacing: 1.4, color: alpha('#fff', 0.85) },
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

  heroIcon: { width: 72, height: 72, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { paddingHorizontal: spacing.xl, alignItems: 'center', marginBottom: 18 },
  cap: { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 1.4, fontWeight: '600' },
  title: { fontFamily: fonts.displayBold, fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginTop: 6 },
  body: { fontFamily: fonts.display, fontSize: 13, color: surface.textSecondary, lineHeight: 19, textAlign: 'center', marginTop: 10, paddingHorizontal: 8 },

  impactRow: { flexDirection: 'row', gap: 8 },
  impactStat: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: surface.hairlineSoft,
    borderRadius: 12, alignItems: 'center', gap: 4,
  },
  impactLabel: { fontFamily: fonts.mono, fontSize: 9, color: surface.textTertiary, letterSpacing: 1 },
  impactValue: { fontFamily: fonts.monoBold, fontSize: 15, fontWeight: '600' },

  recoveryTitle: { fontFamily: fonts.displayBold, fontSize: 19, fontWeight: '700', color: '#fff', marginTop: 6, letterSpacing: -0.2 },
  recoverySub: { fontFamily: fonts.display, fontSize: 12, color: surface.textTertiary, marginTop: 4 },
  recoveryNote: { fontFamily: fonts.display, fontSize: 12.5, color: alpha('#fff', 0.85), marginTop: 8, lineHeight: 17 },
  stamp: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  stampText: { fontFamily: fonts.monoBold, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 40,
    flexDirection: 'row', gap: 10,
  },
  ghost: {
    height: 56, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  ghostText: { fontFamily: fonts.displayBold, fontSize: 10.5, fontWeight: '600', color: '#fff', letterSpacing: 1.4 },
});
