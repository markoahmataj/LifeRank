// src/screens/StatsScreen.tsx
// Telemetry / progress intelligence.
// PORT: app/(tabs)/stats.tsx

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Polyline, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgLG, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import type { CategoryId, CategoryScore, LifeScore, LogbookEntry, RankTier, StatRange } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { HudCard } from '../components/HudCard';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';

import {
  categories, getTier, surface, spacing, fonts, alpha, state, radius,
} from '../design-system/tokens';
import type { LifeScore as LifeScoreType } from '../design-system/types';

const ZERO_SCORE: LifeScoreType = { value: 0, delta: 0, tier: 'dormant', nextRankAt: 3.0, streak: 0 };

export interface StatsScreenProps {
  tier?: RankTier;
  onBack?: () => void;
  score?: LifeScore;
  categoryScores?: CategoryScore[];
  logbook?: LogbookEntry[];
  onCategoryPress?: (id: CategoryId) => void;
}

export function StatsScreen({
  tier = getTier('apex'),
  onBack,
  score = ZERO_SCORE,
  categoryScores = [],
  logbook,
  onCategoryPress,
}: StatsScreenProps) {
  const [range, setRange] = useState<StatRange>('M');

  const hasEnoughData = logbook && logbook.length >= 2;
  const series = useMemo(() => {
    if (hasEnoughData) {
      // Logbook is newest-first — reverse for chronological order.
      return [...logbook!].slice(0, 30).reverse().map(e => e.lifeScore);
    }
    // Not enough check-ins yet — show a flat line at the current score
    return [score.value, score.value];
  }, [logbook, hasEnoughData, score.value]);
  const { pathLine, pathArea, lastPt, W, H } = useChartGeometry(series, 320, 110);

  const weakest = useMemo(() => {
    return [...categoryScores].sort((a, b) => a.value - b.value)[0];
  }, [categoryScores]);

  const earliestScore = series[0];
  const latestScore = series[series.length - 1];
  const periodDelta = +(latestScore - earliestScore).toFixed(1);

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
            <Text style={styles.headerCap}>TELEMETRY</Text>
            <Text style={styles.headerTitle}>Progress</Text>
          </View>
          <Pressable style={styles.iconBtn}>
            <Svg width={14} height={14} viewBox="0 0 14 14"><Circle cx={6} cy={6} r={4.5} stroke="#fff" strokeWidth={1.5} fill="none"/><Path d="M9.5 9.5L13 13" stroke="#fff" strokeWidth={1.5} strokeLinecap="round"/></Svg>
          </Pressable>
        </View>

        {/* HERO METRIC */}
        <View style={[styles.padded, { paddingBottom: 14 }]}>
          <Text style={styles.heroCap}>LIFE SCORE · CURRENT</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: 4 }}>
            <Text style={[styles.heroValue, { color: tier.primary }]}>{score.value.toFixed(1)}</Text>
            <View style={{ paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Svg width={9} height={9} viewBox="0 0 9 9"><Path d="M4.5 1l3 4H6v3H3V5H1z" fill={periodDelta >= 0 ? state.win : state.break}/></Svg>
                <Text style={{ fontFamily: fonts.monoBold, fontSize: 14, color: periodDelta >= 0 ? state.win : state.break, fontWeight: '600' }}>
                  {periodDelta >= 0 ? '+' : ''}{periodDelta.toFixed(1)}
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, marginTop: 2 }}>vs PERIOD START</Text>
            </View>
          </View>
        </View>

        {/* RANGE SELECTOR */}
        <View style={[styles.padded, { paddingBottom: 14 }]}>
          <View style={styles.rangeWrap}>
            {(['W', 'M', '3M', 'Y', 'ALL'] as StatRange[]).map(r => {
              const isActive = r === range;
              return (
                <Pressable key={r} onPress={() => setRange(r)} style={styles.rangeCell}>
                  {isActive && (
                    <LinearGradient
                      colors={[alpha(tier.primary, 0.27), alpha(tier.mid, 0.14)]}
                      start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                      style={[StyleSheet.absoluteFill, { borderRadius: 9, borderWidth: 1, borderColor: alpha(tier.primary, 0.33) }]}
                    />
                  )}
                  <Text style={[styles.rangeLabel, { color: isActive ? '#fff' : alpha('#fff', 0.55) }]}>{r}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* BIG CHART */}
        <View style={styles.padded}>
          <HudCard padding={{ x: 16, y: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.smallCap}>RANK TRAJECTORY</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.dot, { backgroundColor: tier.primary }]}/>
                <Text style={[styles.smallCap, { color: alpha('#fff', 0.7) }]}>SCORE</Text>
              </View>
            </View>

            <Svg width="100%" height={H + 28} viewBox={`0 0 ${W} ${H + 28}`} preserveAspectRatio="none">
              <Defs>
                <SvgLG id="ssArea" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%"   stopColor={tier.primary} stopOpacity={0.45}/>
                  <Stop offset="100%" stopColor={tier.primary} stopOpacity={0}/>
                </SvgLG>
                <SvgLG id="ssLine" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%"   stopColor={tier.primary}/>
                  <Stop offset="50%"  stopColor={tier.mid}/>
                  <Stop offset="100%" stopColor={tier.far}/>
                </SvgLG>
              </Defs>

              {[0.2, 0.5, 0.8].map((y, i) => (
                <Line key={i} x1={0} y1={H * y} x2={W} y2={H * y}
                      stroke="#fff" strokeOpacity={0.05} strokeDasharray="2 4"/>
              ))}

              <SvgText x={W - 2} y={H * 0.18 + 3} fill="rgba(255,255,255,0.35)" fontSize={8} fontFamily={fonts.mono} textAnchor="end" letterSpacing={0.6}>ZENITH</SvgText>
              <SvgText x={W - 2} y={H * 0.48 + 3} fill="rgba(255,255,255,0.35)" fontSize={8} fontFamily={fonts.mono} textAnchor="end" letterSpacing={0.6}>APEX</SvgText>
              <SvgText x={W - 2} y={H * 0.78 + 3} fill="rgba(255,255,255,0.35)" fontSize={8} fontFamily={fonts.mono} textAnchor="end" letterSpacing={0.6}>ASCENDANT</SvgText>

              <Path d={pathArea} fill="url(#ssArea)"/>
              <Path d={pathLine} fill="none" stroke="url(#ssLine)" strokeWidth={2}/>

              <Circle cx={lastPt[0]} cy={lastPt[1]} r={9} fill={tier.primary} fillOpacity={0.2}/>
              <Circle cx={lastPt[0]} cy={lastPt[1]} r={4.5} fill={tier.primary}/>
              <Circle cx={lastPt[0]} cy={lastPt[1]} r={2} fill="#fff"/>

              <SvgText x={0}   y={H + 18} fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily={fonts.mono}>30D AGO</SvgText>
              <SvgText x={W/2} y={H + 18} fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily={fonts.mono} textAnchor="middle">15D</SvgText>
              <SvgText x={W}   y={H + 18} fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily={fonts.mono} textAnchor="end">TODAY</SvgText>
            </Svg>
          </HudCard>
        </View>

        {/* STAT TILES */}
        <View style={[styles.padded, { paddingTop: 14, flexDirection: 'row', gap: 8 }]}>
          <StatTile label="STREAK"     value={String(score.streak)} unit="d" sub="current streak" color={tier.primary}/>
          <StatTile label="CHECK-INS"  value={String(logbook?.length ?? 0)} unit=""  sub="logged"        color={tier.accent}/>
          <StatTile label="ENTRIES"    value={String(series.length)} unit=""  sub="in window"      color={tier.mid}/>
        </View>

        {/* CATEGORY BREAKDOWN */}
        <SectionHeader index="02" title="Category Breakdown"/>
        <View style={[styles.padded, { gap: 8 }]}>
          {categoryScores.map(cs => {
            const cat = categories[cs.id];
            return (
              <Pressable key={cs.id} onPress={() => onCategoryPress?.(cs.id)}>
                <HudCard padding={{ x: 14, y: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.iconChip, { backgroundColor: alpha(cat.accent, 0.18), borderColor: alpha(cat.accent, 0.33) }]}>
                      <CategoryGlyphIcon glyph={cat.glyph} color={cat.accent} size={16}/>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                        <Text style={styles.catScore}>{cs.value.toFixed(1)}/10</Text>
                        <Text style={[styles.catDelta, { color: cs.delta >= 0 ? state.win : state.break }]}>
                          {cs.delta >= 0 ? '+' : ''}{cs.delta.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <MiniSpark
                      color={cat.accent}
                      points={generateSparkData(cs.value, cs.delta)}
                    />
                  </View>
                </HudCard>
              </Pressable>
            );
          })}
        </View>

        {/* WHAT'S DRAGGING YOU DOWN */}
        <SectionHeader index="03" title="What's Dragging You Down"/>
        <View style={styles.padded}>
          <HudCard accentColor={state.hold} showTopEdge>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.iconChip, { width: 40, height: 40, borderRadius: 12, backgroundColor: alpha(categories[weakest.id].accent, 0.18), borderColor: alpha(categories[weakest.id].accent, 0.33) }]}>
                <CategoryGlyphIcon glyph={categories[weakest.id].glyph} color={categories[weakest.id].accent} size={20}/>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.smallCap}>WEAKEST PILLAR</Text>
                <Text style={styles.weakName}>{categories[weakest.id].name}</Text>
                <Text style={styles.weakInsight}>{weakest.insight ?? 'Slow movement.'}</Text>
              </View>
              <Text style={[styles.weakScore, { color: state.hold }]}>{weakest.value.toFixed(1)}</Text>
            </View>
          </HudCard>
        </View>

        {/* PERSONAL RECORDS — derived from real logbook */}
        <SectionHeader index="04" title="Records"/>
        <View style={[styles.padded, { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }]}>
          {[
            {
              label: 'CURRENT STREAK',
              value: `${score.streak}d`,
              delta: score.streak > 0 ? 'keep going' : 'start today',
              color: '#FF2D5C',
            },
            {
              label: 'PERSONAL BEST',
              value: score.pbScore != null ? score.pbScore.toFixed(1) : score.value.toFixed(1),
              delta: 'highest score',
              color: '#22D3EE',
            },
            {
              label: 'CHECK-INS',
              value: String(logbook?.length ?? 0),
              delta: 'total logged',
              color: '#C026D3',
            },
            {
              label: 'SCORE NOW',
              value: score.value.toFixed(1),
              delta: `${score.delta >= 0 ? '+' : ''}${score.delta.toFixed(1)} this check-in`,
              color: '#7C3AED',
            },
          ].map(pr => (
            <View key={pr.label} style={{ width: '48%' }}>
              <HudCard padding={{ x: 12, y: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Svg width={9} height={11} viewBox="0 0 9 11"><Path d="M4.5 1l1.5 3 3 .4-2.2 2 .5 3-2.8-1.5L1.7 9.4l.5-3L0 4.4 3 4z" fill={pr.color}/></Svg>
                  <Text style={styles.smallCap}>{pr.label}</Text>
                </View>
                <Text style={styles.prValue}>{pr.value}</Text>
                <Text style={styles.prDelta}>{pr.delta}</Text>
              </HudCard>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ─── chart helpers ─────────────────────────────────────────────── */
function useChartGeometry(series: number[], W: number, H: number) {
  return useMemo(() => {
    const min = Math.min(...series);
    const max = Math.max(...series);
    const pts: Array<[number, number]> = series.map((v, i) => {
      const x = (i / (series.length - 1)) * W;
      const y = H - ((v - min) / (max - min || 1)) * H * 0.8 - H * 0.1;
      return [x, y];
    });
    const pathLine = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
      .join(' ');
    const pathArea = `${pathLine} L ${W} ${H} L 0 ${H} Z`;
    return { pts, pathLine, pathArea, lastPt: pts[pts.length - 1], W, H };
  }, [series, W, H]);
}

function generateSparkData(value: number, delta: number): number[] {
  const trail: number[] = [];
  for (let i = 0; i < 7; i++) {
    trail.push(value - delta + (delta * i) / 6 + (Math.sin(i * 1.7) * 0.05));
  }
  return trail;
}

function MiniSpark({ color, points }: { color: string; points: number[] }) {
  const W = 60, H = 24;
  const min = Math.min(...points), max = Math.max(...points);
  const str = points
    .map((v, i) => `${(i / (points.length - 1)) * W},${H - ((v - min) / (max - min || 1)) * H * 0.7 - H * 0.15}`)
    .join(' ');
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Polyline points={str} fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.xl, marginTop: 18, marginBottom: 12 },
  idx: { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  title: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', letterSpacing: 1.4, color: alpha('#fff', 0.85) },
});

function StatTile({ label, value, unit, sub, color }: { label: string; value: string; unit: string; sub: string; color: string }) {
  return (
    <View style={{ flex: 1 }}>
      <HudCard padding={{ x: 12, y: 12 }}>
        <Text style={styles.smallCap}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 4 }}>
          <Text style={[styles.tileValue, { color: '#fff' }]}>{value}</Text>
          {unit ? <Text style={styles.tileUnit}>{unit}</Text> : null}
        </View>
        <Text style={styles.tileSub}>{sub}</Text>
      </HudCard>
    </View>
  );
}

/* ─── styles ─────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface.bg },
  padded: { paddingHorizontal: spacing.xl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.hero, paddingBottom: 16,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: surface.glassFill, borderWidth: 1, borderColor: surface.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCap: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.6 },
  headerTitle: { fontFamily: fonts.displayBold, fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 2, letterSpacing: -0.2 },

  heroCap: { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 1.6 },
  heroValue: {
    fontFamily: fonts.monoBold, fontSize: 70, fontWeight: '600',
    letterSpacing: -2, lineHeight: 70,
  },

  rangeWrap: {
    flexDirection: 'row', gap: 4, padding: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: surface.hairlineSoft,
    borderRadius: 12,
  },
  rangeCell: { flex: 1, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rangeLabel: { fontFamily: fonts.monoBold, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  smallCap: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.2 },
  dot: { width: 6, height: 6, borderRadius: 3 },

  iconChip: {
    width: 32, height: 32, borderRadius: 9, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  catName: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', color: '#fff' },
  catScore: { fontFamily: fonts.mono, fontSize: 12, color: surface.textTertiary },
  catDelta: { fontFamily: fonts.monoBold, fontSize: 10 },

  weakName: { fontFamily: fonts.displayBold, fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 4 },
  weakInsight: { fontFamily: fonts.display, fontSize: 11.5, color: surface.textTertiary, marginTop: 4 },
  weakScore: { fontFamily: fonts.monoBold, fontSize: 30, fontWeight: '600' },

  tileValue: { fontFamily: fonts.monoBold, fontSize: 26, fontWeight: '600', lineHeight: 26 },
  tileUnit: { fontFamily: fonts.mono, fontSize: 11, color: surface.textTertiary },
  tileSub: { fontFamily: fonts.display, fontSize: 10, color: surface.textMuted, marginTop: 3 },

  prValue: { fontFamily: fonts.monoBold, fontSize: 22, fontWeight: '600', color: '#fff' },
  prDelta: { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, marginTop: 2 },
});
