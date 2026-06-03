// src/screens/WeeklyReportScreen.tsx
// Recurring retention moment — the Sunday compile.
// PORT: app/weekly-report.tsx

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import type { RankTier, WeeklyReport } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { HudCard } from '../components/HudCard';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';

import {
  categories, getTier, surface, spacing, fonts, alpha, radius, state,
} from '../design-system/tokens';
import { EmptyState } from '../components/EmptyState';

export interface WeeklyReportScreenProps {
  tier?: RankTier;
  report?: WeeklyReport;
  onBack?: () => void;
  onShare?: () => void;
}

export function WeeklyReportScreen({
  tier = getTier('apex'),
  report,
  onBack,
  onShare,
}: WeeklyReportScreenProps) {
  if (!report) {
    return (
      <View style={styles.root}>
        <AtmosphereBackground tier={tier}/>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.iconBtn}>
            <Svg width={9} height={14} viewBox="0 0 9 14"><Path d="M7 1L1 7l6 6" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerCap}>WEEKLY REPORT</Text>
            <Text style={styles.headerSub}>OFFLINE</Text>
          </View>
          <View style={{ width: 36 }}/>
        </View>
        <View style={{ paddingHorizontal: 24, marginTop: 40 }}>
          <EmptyState
            tier={tier}
            status="STATUS · COMPILING"
            title="Report not ready."
            body="Weekly reports compile after 7 consecutive check-ins. Keep your streak alive and the system will deliver your first debrief."
          />
        </View>
      </View>
    );
  }

  const positive  = report.delta >= 0;
  const strongest = categories[report.strongest];
  const weakest   = categories[report.weakest];
  const focus     = categories[report.recommendedFocus];

  const weekTrend = [report.startScore, report.endScore];

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.iconBtn}>
            <Svg width={9} height={14} viewBox="0 0 9 14"><Path d="M7 1L1 7l6 6" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerCap}>WEEKLY REPORT</Text>
            <Text style={styles.headerSub}>WK{report.weekNumber} · {report.year}</Text>
          </View>
          <View style={{ width: 36 }}/>
        </View>

        {/* TITLE BLOCK */}
        <View style={styles.titleBlock}>
          <Text style={styles.cap}>RANK STABILITY</Text>
          <Text style={[styles.stabilityWord, { color: stabilityColor(report.rankStability, tier) }]}>
            {report.rankStability.toUpperCase()}
          </Text>
          <Text style={styles.dateRange}>
            {formatDate(report.startDate)} → {formatDate(report.endDate)}
          </Text>
        </View>

        {/* MOVEMENT */}
        <View style={[styles.padded, { marginBottom: 14 }]}>
          <HudCard accentColor={tier.primary} showTopEdge padding={{ x: 16, y: 16 }}>
            <Text style={styles.smallCap}>LIFE SCORE MOVEMENT</Text>
            <View style={styles.movementRow}>
              <Text style={styles.movePrev}>{report.startScore.toFixed(1)}</Text>
              <Svg width={20} height={16} viewBox="0 0 20 16">
                <Path d={positive ? "M1 8h14M12 1l6 7-6 7" : "M19 8H5M9 1L3 8l6 7"}
                  stroke={tier.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
              <Text style={[styles.moveNew, { color: tier.primary }]}>{report.endScore.toFixed(1)}</Text>
              <View style={[styles.deltaPill, {
                backgroundColor: positive ? alpha(state.win, 0.14) : alpha(state.break, 0.14),
                borderColor:     positive ? alpha(state.win, 0.4)  : alpha(state.break, 0.4),
              }]}>
                <Text style={[styles.deltaLabel, { color: positive ? state.win : state.break }]}>
                  {positive ? '+' : ''}{report.delta.toFixed(1)}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Spark data={weekTrend} accent={tier.primary}/>
            </View>
          </HudCard>
        </View>

        {/* STRONGEST / WEAKEST */}
        <SectionHeader index="02" title="Cycle Diagnosis"/>
        <View style={[styles.padded, { flexDirection: 'row', gap: 10 }]}>
          <DiagCard label="STRONGEST" tone={state.win}  categoryName={strongest.name} glyph={strongest.glyph as any} color={strongest.accent}/>
          <DiagCard label="WEAKEST"   tone={state.hold} categoryName={weakest.name}   glyph={weakest.glyph as any}   color={weakest.accent}/>
        </View>

        {/* NUMBERS */}
        <SectionHeader index="03" title="Cycle Numbers"/>
        <View style={[styles.padded, { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }]}>
          <NumberTile label="MISSIONS COMPLETED" value={String(report.completedMissions)} color={tier.primary}/>
          <NumberTile label="CHECK-INS MISSED"   value={String(report.missedCheckIns)}    color={report.missedCheckIns > 0 ? state.break : state.win}/>
          <NumberTile label="RANK DELTA"         value={`${report.delta > 0 ? '+' : ''}${report.delta.toFixed(1)}`} color={tier.accent}/>
          <NumberTile label="WEEK NUMBER"        value={`WK${report.weekNumber}`} color={surface.textSecondary}/>
        </View>

        {/* NARRATIVE */}
        <SectionHeader index="04" title="OS Narrative"/>
        <View style={styles.padded}>
          <HudCard accentColor={tier.accent} padding={{ x: 16, y: 14 }}>
            <Text style={[styles.smallCap, { color: tier.accent, marginBottom: 6 }]}>SIGNAL</Text>
            <Text style={styles.narrative}>{report.narrative}</Text>
          </HudCard>
        </View>

        {/* RECOMMENDED FOCUS */}
        <SectionHeader index="05" title="Next Cycle Focus"/>
        <View style={styles.padded}>
          <HudCard accentColor={focus.accent} variant="mission" showTopEdge padding={{ x: 16, y: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.iconChip, { backgroundColor: alpha(focus.accent, 0.18), borderColor: alpha(focus.accent, 0.4) }]}>
                <CategoryGlyphIcon glyph={focus.glyph} color={focus.accent} size={20}/>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.smallCap, { color: focus.accent }]}>RECOMMENDED PILLAR</Text>
                <Text style={styles.focusName}>{focus.name}</Text>
                <Text style={styles.focusNote}>
                  Compounding here unlocks the largest score movement next cycle.
                </Text>
              </View>
            </View>
          </HudCard>
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <LinearGradient colors={['transparent', alpha(surface.bg, 0.95)]} style={StyleSheet.absoluteFill}/>
        <PrimaryCTA tier={tier} label="Share Weekly Report" onPress={onShare}/>
      </View>
    </View>
  );
}

function DiagCard({ label, tone, categoryName, glyph, color }: {
  label: string; tone: string; categoryName: string;
  glyph: 'crosshair' | 'diamond' | 'node' | 'chart' | 'ascent'; color: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <HudCard accentColor={tone}>
        <Text style={[styles.smallCap, { color: tone }]}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <CategoryGlyphIcon glyph={glyph} color={color} size={16}/>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 14, color: '#fff', fontWeight: '600' }}>{categoryName}</Text>
        </View>
      </HudCard>
    </View>
  );
}

function NumberTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ width: '48%' as any }}>
      <HudCard padding={{ x: 12, y: 12 }}>
        <Text style={styles.smallCap}>{label}</Text>
        <Text style={[styles.numberValue, { color }]}>{value}</Text>
      </HudCard>
    </View>
  );
}

function Spark({ data, accent }: { data: number[]; accent: string }) {
  const W = 320, H = 50;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / (max - min || 1)) * H * 0.7 - H * 0.15}`)
    .join(' ');
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Polyline points={pts} fill="none" stroke={accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
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

function stabilityColor(s: WeeklyReport['rankStability'], tier: RankTier): string {
  switch (s) {
    case 'rising':   return state.win;
    case 'holding':  return tier.primary;
    case 'falling':  return state.break;
    case 'volatile': return state.hold;
  }
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }).toUpperCase();
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: surface.bg },
  padded: { paddingHorizontal: spacing.xl },

  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.hero, paddingBottom: 16 },
  iconBtn:   { width: 36, height: 36, borderRadius: 12, backgroundColor: surface.glassFill, borderWidth: 1, borderColor: surface.hairline, alignItems: 'center', justifyContent: 'center' },
  headerCap: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.6 },
  headerSub: { fontFamily: fonts.displayBold, fontSize: 14, fontWeight: '600', color: '#fff', marginTop: 2 },

  titleBlock:    { paddingHorizontal: spacing.xl, alignItems: 'center', marginBottom: 22 },
  cap:           { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 2 },
  stabilityWord: { fontFamily: fonts.displayBold, fontSize: 44, fontWeight: '700', letterSpacing: 6, marginTop: 4 },
  dateRange:     { fontFamily: fonts.mono, fontSize: 11, color: surface.textTertiary, letterSpacing: 1, marginTop: 4 },

  smallCap: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.2 },

  movementRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  movePrev:    { fontFamily: fonts.mono, fontSize: 22, color: surface.textMuted, textDecorationLine: 'line-through' },
  moveNew:     { fontFamily: fonts.monoBold, fontSize: 36, fontWeight: '600', letterSpacing: -1 },
  deltaPill:   { marginLeft: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
  deltaLabel:  { fontFamily: fonts.monoBold, fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },

  iconChip:  { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  focusName: { fontFamily: fonts.displayBold, fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 4 },
  focusNote: { fontFamily: fonts.display, fontSize: 12, color: surface.textTertiary, marginTop: 4, lineHeight: 17 },

  numberValue: { fontFamily: fonts.monoBold, fontSize: 22, fontWeight: '600', marginTop: 4 },

  narrative: { fontFamily: fonts.display, fontSize: 13, color: alpha('#fff', 0.85), lineHeight: 18 },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 40,
  },
});
