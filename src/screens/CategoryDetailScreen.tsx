// src/screens/CategoryDetailScreen.tsx
// Detail page for any one of the five life pillars. Generic — accepts
// a CategoryId via props.
// PORT: app/category/[id].tsx

import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Polyline, Defs, LinearGradient as SvgLG, Stop } from 'react-native-svg';

import type { CategoryId, RankTier } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { HudCard } from '../components/HudCard';
import { EnergyBar } from '../components/EnergyBar';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';
import { MissionCard } from '../components/MissionCard';

import {
  categories, getTier, surface, spacing, fonts, alpha, radius, state,
} from '../design-system/tokens';
import {
  mockCategoryScores, mockAvailableMissions, mockLogbook,
} from '../design-system/mockData';

export interface CategoryDetailScreenProps {
  tier?: RankTier;
  categoryId?: CategoryId;
  onBack?: () => void;
}

export function CategoryDetailScreen({
  tier = getTier('apex'),
  categoryId = 'discipline',
  onBack,
}: CategoryDetailScreenProps) {
  const cat = categories[categoryId];
  const score = mockCategoryScores.find(c => c.id === categoryId)!;

  const trail7  = useMemo(() => makeTrail(score.value, score.delta, 7),  [score]);
  const trail30 = useMemo(() => makeTrail(score.value, score.delta, 30), [score]);

  const relatedMissions = mockAvailableMissions.filter(m => m.category === categoryId);

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
            <Text style={styles.headerCap}>PILLAR DETAIL</Text>
            <Text style={[styles.headerSub, { color: cat.accent }]}>{cat.short} · {cat.name.toUpperCase()}</Text>
          </View>
          <View style={{ width: 36 }}/>
        </View>

        {/* HERO */}
        <View style={[styles.padded, { marginBottom: 14 }]}>
          <HudCard accentColor={cat.accent} variant="mission" showTopEdge showCorners padding={{ x: 18, y: 18 }}>
            <View style={styles.heroRow}>
              <View style={[styles.heroIcon, { borderColor: alpha(cat.accent, 0.4), backgroundColor: alpha(cat.accent, 0.18) }]}>
                <CategoryGlyphIcon glyph={cat.glyph} color={cat.accent} size={26}/>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroName}>{cat.name}</Text>
                <Text style={styles.heroBlurb}>{BLURB[categoryId]}</Text>
              </View>
            </View>

            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color: cat.accent }]}>{score.value.toFixed(1)}</Text>
              <Text style={styles.scoreUnit}>/10</Text>
              <View style={[styles.deltaPill, {
                backgroundColor: score.delta >= 0 ? alpha(state.win, 0.14) : alpha(state.break, 0.14),
                borderColor:     score.delta >= 0 ? alpha(state.win, 0.4)  : alpha(state.break, 0.4),
              }]}>
                <Text style={[styles.deltaLabel, { color: score.delta >= 0 ? state.win : state.break }]}>
                  {score.delta >= 0 ? '+' : ''}{score.delta.toFixed(1)} WK
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 14 }}>
              <EnergyBar
                value={score.value * 10}
                tier={tier}
                thickness={6}
                colors={[cat.accent, tier.mid, cat.accent]}
              />
            </View>
          </HudCard>
        </View>

        {/* STATUS */}
        <View style={[styles.padded, { flexDirection: 'row', gap: 10 }]}>
          <StatusTile
            label="STATUS"
            value={score.value >= 8 ? 'STRONG' : score.value >= 6.5 ? 'OPERATIONAL' : 'WEAK'}
            tone={score.value >= 8 ? state.win : score.value >= 6.5 ? state.hold : state.break}
          />
          <StatusTile
            label="TREND"
            value={score.delta > 0 ? 'RISING' : score.delta < 0 ? 'FALLING' : 'HELD'}
            tone={score.delta > 0 ? state.win : score.delta < 0 ? state.break : surface.textSecondary}
          />
          <StatusTile
            label="RANK"
            value={'#2 of 5'}
            tone={cat.accent}
          />
        </View>

        {/* TRENDS */}
        <SectionHeader index="02" title="Movement"/>
        <View style={[styles.padded, { gap: 10 }]}>
          <TrendCard title="7-DAY TRAIL"  data={trail7}  accent={cat.accent}/>
          <TrendCard title="30-DAY TRAIL" data={trail30} accent={cat.accent}/>
        </View>

        {/* SIGNALS */}
        <SectionHeader index="03" title="Signals"/>
        <View style={[styles.padded, { gap: 10 }]}>
          <SignalRow label="STRONGEST SIGNAL" text={STRONGEST[categoryId]} tone={state.win}/>
          <SignalRow label="DRAGGING FACTOR"  text={DRAGGING[categoryId]}  tone={state.hold}/>
        </View>

        {/* RELATED TAGS */}
        <SectionHeader index="04" title="Related Tags"/>
        <View style={[styles.padded, { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }]}>
          {TAGS[categoryId].map(t => (
            <View key={t} style={[styles.tagPill, { borderColor: alpha(cat.accent, 0.33), backgroundColor: alpha(cat.accent, 0.08) }]}>
              <Text style={[styles.tagLabel, { color: alpha('#fff', 0.85) }]}>{t}</Text>
            </View>
          ))}
        </View>

        {/* RECOMMENDED MISSIONS */}
        {relatedMissions.length > 0 && (
          <>
            <SectionHeader index="05" title="Recommended Operations"/>
            <View style={[styles.padded, { gap: 10 }]}>
              {relatedMissions.map(m => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  tier={tier}
                  variant="compact"
                  accentColor={cat.accent}
                />
              ))}
            </View>
          </>
        )}

        {/* RECENT ENTRIES */}
        <SectionHeader index="06" title="Recent Check-ins"/>
        <View style={[styles.padded, { gap: 6 }]}>
          {mockLogbook.slice(0, 5).map(entry => {
            const c = entry.categoryScores.find(c => c.id === categoryId);
            return (
              <View key={entry.date} style={styles.entryRow}>
                <Text style={styles.entryDate}>
                  {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }).toUpperCase()}
                </Text>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <View style={styles.entryBar}>
                    <View style={[
                      styles.entryFill,
                      { width: `${(c?.value ?? 0) * 10}%` as any, backgroundColor: cat.accent },
                    ]}/>
                  </View>
                </View>
                <Text style={styles.entryValue}>{(c?.value ?? 0).toFixed(1)}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

/* ─── helpers + per-category content ─────────────────────────────── */
function makeTrail(value: number, delta: number, n: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < n; i++) {
    arr.push(value - delta + (delta * i) / (n - 1) + Math.sin(i * 0.8) * 0.06);
  }
  return arr;
}

const BLURB: Record<CategoryId, string> = {
  discipline:  'Routine, focus, follow-through.',
  style:       'Aesthetic execution, curation, self-presentation.',
  environment: 'The physical and digital space around you.',
  money:       'Spending direction and capital flow control.',
  career:      'Skill compounding and tangible output trajectory.',
};

const STRONGEST: Record<CategoryId, string> = {
  discipline:  '6 AM wake-time logged 12 of 14 days. Anchor habit holding.',
  style:       'Wardrobe upgrade compounded weekly photo signal.',
  environment: 'Desk audit + light protocol pushed pillar to +0.4.',
  money:       'Subscription audit cleared monthly drift entirely.',
  career:      'Deep-work blocks held 5 days running — output curve.',
};

const DRAGGING: Record<CategoryId, string> = {
  discipline:  'Reading block missed 4 nights in 14. Stack with strength.',
  style:       'Outfit auto-pilot — same 3 looks in rotation 11 days.',
  environment: 'Bedroom signal weak. Noise + clutter both flagged.',
  money:       'Impulse spend window 22:00–24:00 — set a hard cap.',
  career:      'Output slipped Tue/Wed. No focused block recorded.',
};

const TAGS: Record<CategoryId, string[]> = {
  discipline:  ['cold shower', 'morning protocol', 'deep work', 'no screens AM'],
  style:       ['outfit logged', 'haircut', 'posture', 'curated AV'],
  environment: ['desk audit', 'light protocol', 'noise floor', 'no clutter'],
  money:       ['no impulse', 'audit complete', 'invested', 'subscription cull'],
  career:      ['deep work', 'output logged', 'skill block', 'meeting cull'],
};

/* ─── sub-components ─────────────────────────────────────────────── */
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

function StatusTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={{ flex: 1 }}>
      <HudCard padding={{ x: 12, y: 12 }}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={[styles.tileValue, { color: tone }]}>{value}</Text>
      </HudCard>
    </View>
  );
}

function TrendCard({ title, data, accent }: { title: string; data: number[]; accent: string }) {
  const W = 320, H = 70;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / (max - min || 1)) * H * 0.7 - H * 0.15}`)
    .join(' ');
  return (
    <HudCard padding={{ x: 14, y: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.tileLabel}>{title}</Text>
        <Text style={[styles.tileLabel, { color: accent }]}>{data[data.length - 1].toFixed(1)}</Text>
      </View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ marginTop: 6 }}>
        <Defs>
          <SvgLG id={`tg-${title}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={accent} stopOpacity={0.4}/>
            <Stop offset="100%" stopColor={accent} stopOpacity={0}/>
          </SvgLG>
        </Defs>
        <Polyline points={`0,${H} ${pts} ${W},${H}`} fill={`url(#tg-${title})`} stroke="none"/>
        <Polyline points={pts} fill="none" stroke={accent} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    </HudCard>
  );
}

function SignalRow({ label, text, tone }: { label: string; text: string; tone: string }) {
  return (
    <HudCard accentColor={tone} padding={{ x: 14, y: 12 }}>
      <Text style={[styles.tileLabel, { color: tone }]}>{label}</Text>
      <Text style={styles.signalText}>{text}</Text>
    </HudCard>
  );
}

/* ─── styles ─────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: surface.bg },
  padded: { paddingHorizontal: spacing.xl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.hero, paddingBottom: 16,
  },
  iconBtn:   { width: 36, height: 36, borderRadius: 12, backgroundColor: surface.glassFill, borderWidth: 1, borderColor: surface.hairline, alignItems: 'center', justifyContent: 'center' },
  headerCap: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.6 },
  headerSub: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', marginTop: 2, letterSpacing: 1.4 },

  heroRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon:  { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  heroName:  { fontFamily: fonts.displayBold, fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  heroBlurb: { fontFamily: fonts.display, fontSize: 12, color: surface.textTertiary, marginTop: 2, lineHeight: 16 },

  scoreRow:   { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 14 },
  scoreValue: { fontFamily: fonts.monoBold, fontSize: 48, fontWeight: '600', letterSpacing: -1.5, lineHeight: 48 },
  scoreUnit:  { fontFamily: fonts.mono, fontSize: 16, color: surface.textMuted },
  deltaPill:  { marginLeft: 10, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
  deltaLabel: { fontFamily: fonts.monoBold, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },

  tileLabel: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.2 },
  tileValue: { fontFamily: fonts.monoBold, fontSize: 14, fontWeight: '600', marginTop: 4, letterSpacing: 0.5 },

  signalText: { fontFamily: fonts.display, fontSize: 12.5, color: alpha('#fff', 0.85), marginTop: 6, lineHeight: 17 },

  tagPill:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1 },
  tagLabel: { fontFamily: fonts.display, fontSize: 11, fontWeight: '500' },

  entryRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  entryDate:  { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 1, width: 48 },
  entryBar:   { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  entryFill:  { height: '100%' },
  entryValue: { fontFamily: fonts.mono, fontSize: 12, color: '#fff', width: 32, textAlign: 'right' },
});
