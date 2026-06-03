// src/screens/CalibrationScreen.tsx
// First-time baseline scan. 5 category steps.
// PORT: app/(onboarding)/calibration/[step].tsx

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import type { CategoryId, CalibrationAnswer, RankTier } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { HudCard } from '../components/HudCard';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';

import {
  categories, CATEGORY_ORDER, rankTiers, segmentForScore,
  surface, spacing, fonts, alpha, radius,
} from '../design-system/tokens';

export interface CalibrationScreenProps {
  /** 0–4 */
  stepIndex?: number;
  onNext?: (answer: CalibrationAnswer) => void;
  onBack?: () => void;
}

const BASELINE_TAGS: Array<{ id: string; label: string }> = [
  { id: 'consistent',    label: 'Consistent' },
  { id: 'volatile',      label: 'Volatile' },
  { id: 'building',      label: 'Building' },
  { id: 'plateaued',     label: 'Plateaued' },
  { id: 'in-recovery',   label: 'In recovery' },
  { id: 'starting-zero', label: 'Starting from zero' },
];

const CATEGORY_EXPLANATION: Record<CategoryId, string> = {
  discipline:
    'Your ability to execute the routines you set, even when motivation drops.',
  style:
    'Aesthetic execution. Curation. How precisely you present.',
  environment:
    'The signal of your physical and digital spaces. Order, light, noise.',
  money:
    'Control over spending direction, not amount. Are flows intentional?',
  career:
    'Skill compounding and tangible output trajectory across months.',
};

export function CalibrationScreen({
  stepIndex = 0, onNext, onBack,
}: CalibrationScreenProps) {
  const tier: RankTier = rankTiers.unranked;
  const categoryId: CategoryId = CATEGORY_ORDER[stepIndex];
  const category = categories[categoryId];

  const [score, setScore] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const segment = useMemo(() => segmentForScore(score), [score]);

  const toggleTag = (id: string) =>
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier} intensity={0.85}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.iconBtn}>
            <Svg width={9} height={14} viewBox="0 0 9 14"><Path d="M7 1L1 7l6 6" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.headerCap, { color: tier.primary }]}>BASELINE SCAN</Text>
            <Text style={styles.headerSub}>CALIBRATION · STEP {stepIndex + 1}/5</Text>
          </View>
          <View style={{ width: 36 }}/>
        </View>

        {/* STEP BAR */}
        <View style={styles.stepBar}>
          {CATEGORY_ORDER.map((_, i) => (
            <View key={i} style={[
              styles.stepSeg,
              { backgroundColor: i <= stepIndex ? 'transparent' : alpha('#fff', 0.1) },
            ]}>
              {i <= stepIndex && (
                <LinearGradient
                  colors={[tier.primary, tier.mid]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
            </View>
          ))}
        </View>

        {/* CONTEXT BLOCK */}
        <View style={styles.contextBlock}>
          <Text style={styles.contextHead}>
            Before the system can rank you,{'\n'}it needs a baseline.
          </Text>
          <Text style={styles.contextSub}>
            Rate the current state, not your potential.{'\n'}
            Honesty here defines the curve from here.
          </Text>
        </View>

        {/* CATEGORY HERO */}
        <View style={styles.heroBlock}>
          <View style={[styles.heroIcon, {
            borderColor: alpha(category.accent, 0.4),
            backgroundColor: alpha(category.accent, 0.18),
          }]}>
            <CategoryGlyphIcon glyph={category.glyph} color="#fff" size={32}/>
          </View>
          <Text style={[styles.heroCap, { color: category.accent }]}>
            CATEGORY · {category.short}
          </Text>
          <Text style={styles.heroQuestion}>{category.name}</Text>
          <Text style={styles.heroExplain}>{CATEGORY_EXPLANATION[categoryId]}</Text>
        </View>

        {/* SCORE READOUT */}
        <View style={{ paddingHorizontal: spacing.xl }}>
          <HudCard accentColor={segment.color} showTopEdge>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.scoreValue}>{score}</Text>
              <View style={[styles.statusBadge, {
                backgroundColor: alpha(segment.color, 0.12),
                borderColor: alpha(segment.color, 0.4),
              }]}>
                <View style={[styles.dot, { backgroundColor: segment.color }]}/>
                <Text style={[styles.statusLabel, { color: segment.color }]}>{segment.label}</Text>
              </View>
              <Text style={styles.statusDesc}>{segment.desc}</Text>

              <View style={styles.selector}>
                {Array.from({ length: 10 }).map((_, i) => {
                  const n = i + 1;
                  const active = n === score;
                  const below = n < score;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setScore(n)}
                      style={[styles.selectorCell, {
                        backgroundColor:
                          active ? segment.color :
                          below  ? alpha(category.accent, 0.22) :
                                  'rgba(255,255,255,0.04)',
                        borderColor: active ? segment.color : surface.hairline,
                      }]}
                    >
                      <Text style={[styles.cellLabel, {
                        color: active || below ? '#fff' : alpha('#fff', 0.5),
                      }]}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </HudCard>
        </View>

        {/* TAGS */}
        <SectionHeader index="02" title="Identity Signal" action="OPTIONAL"/>
        <View style={[styles.tagWrap, { paddingHorizontal: spacing.xl }]}>
          {BASELINE_TAGS.map(tg => {
            const active = selectedTags.includes(tg.id);
            return (
              <Pressable
                key={tg.id}
                onPress={() => toggleTag(tg.id)}
                style={[styles.tag, {
                  backgroundColor: active ? alpha(category.accent, 0.18) : 'rgba(255,255,255,0.03)',
                  borderColor:     active ? category.accent : alpha('#fff', 0.12),
                }]}
              >
                <Text style={[styles.tagLabel, { color: active ? '#fff' : alpha('#fff', 0.75) }]}>
                  {tg.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* BOTTOM CTA */}
      <View style={styles.ctaBar}>
        <LinearGradient colors={['transparent', alpha(surface.bg, 0.95)]} style={StyleSheet.absoluteFill}/>
        <PrimaryCTA
          tier={rankTiers.apex}
          label={stepIndex === CATEGORY_ORDER.length - 1 ? 'Compile Result' : 'Continue'}
          onPress={() => onNext?.({ category: categoryId, score, tags: selectedTags })}
          icon={
            <Svg width={14} height={12} viewBox="0 0 14 12"><Path d="M1 6h11M8 1l4 5-4 5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>
          }
        />
      </View>
    </View>
  );
}

function SectionHeader({ index, title, action }: { index: string; title: string; action?: string }) {
  return (
    <View style={sh.row}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={sh.idx}>{index}</Text>
        <Text style={sh.title}>{title.toUpperCase()}</Text>
      </View>
      {action && <Text style={sh.action}>{action}</Text>}
    </View>
  );
}

const sh = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: 12,
  },
  idx: { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  title: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', letterSpacing: 1.4, color: alpha('#fff', 0.85) },
  action: { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 0.8 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface.bg },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.hero, paddingBottom: 12,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: surface.glassFill, borderWidth: 1, borderColor: surface.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCap: { fontFamily: fonts.monoBold, fontSize: 9.5, letterSpacing: 1.6, fontWeight: '600' },
  headerSub: { fontFamily: fonts.mono, fontSize: 11, color: '#fff', marginTop: 2, letterSpacing: 0.5 },

  stepBar: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: spacing.xl, paddingTop: 6, paddingBottom: 20,
  },
  stepSeg: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },

  contextBlock: { paddingHorizontal: spacing.xl, marginBottom: 22, alignItems: 'center' },
  contextHead: {
    fontFamily: fonts.displayBold, fontSize: 18, fontWeight: '700',
    color: '#fff', letterSpacing: -0.2, lineHeight: 22, textAlign: 'center',
  },
  contextSub: {
    fontFamily: fonts.display, fontSize: 12, color: surface.textTertiary,
    lineHeight: 17, textAlign: 'center', marginTop: 10,
  },

  heroBlock: { paddingHorizontal: spacing.xl, alignItems: 'center', marginBottom: 18 },
  heroIcon: {
    width: 72, height: 72, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  heroCap: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 1.6, fontWeight: '600', marginBottom: 4 },
  heroQuestion: {
    fontFamily: fonts.displayBold, fontSize: 24, fontWeight: '700',
    color: '#fff', letterSpacing: -0.4, lineHeight: 28,
  },
  heroExplain: {
    fontFamily: fonts.display, fontSize: 12.5, color: surface.textTertiary,
    textAlign: 'center', marginTop: 8, lineHeight: 18, paddingHorizontal: 6,
  },

  scoreValue: {
    fontFamily: fonts.monoBold, fontSize: 72, fontWeight: '600',
    color: '#fff', lineHeight: 72, letterSpacing: -2,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1, marginTop: 4,
  },
  statusLabel: { fontFamily: fonts.monoBold, fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  statusDesc: {
    fontFamily: fonts.display, fontSize: 12, color: surface.textSecondary,
    marginTop: 10, textAlign: 'center',
  },

  selector: { flexDirection: 'row', gap: 4, marginTop: 18, width: '100%' },
  selectorCell: {
    flex: 1, height: 38, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  cellLabel: { fontFamily: fonts.monoBold, fontSize: 13, fontWeight: '600' },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  tagLabel: { fontFamily: fonts.display, fontSize: 12, fontWeight: '500' },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 40,
  },
});
