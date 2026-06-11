// src/screens/CheckInScreen.tsx
// 5-step daily ranked ritual.
// PORT: app/(tabs)/checkin.tsx

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import type { CategoryId, CheckInAnswer, CheckInTagId, RankTier } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { HudCard } from '../components/HudCard';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';

import {
  categories, CATEGORY_ORDER, getTier, segmentForScore,
  surface, spacing, fonts, alpha, radius, layout,
} from '../design-system/tokens';
import { mockCheckInTags, CHECKIN_PROMPTS } from '../design-system/mockData';

export interface CheckInScreenProps {
  tier: RankTier;
  stepIndex?: number;
  streak?: number;
  /** Seed value when revisiting a category (defaults to a clean 5). */
  initialScore?: number;
  /** Seed tags when revisiting a category (defaults to none). */
  initialTags?: CheckInTagId[];
  /** When false, the last category's button says "Continue" because a mission
   *  progress step follows. Defaults to true (last category submits the flow). */
  isFinalStep?: boolean;
  onNext?: (answer: CheckInAnswer) => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export function CheckInScreen({
  tier,
  stepIndex = 0,
  streak = 0,
  initialScore,
  initialTags,
  isFinalStep = true,
  onNext,
  onBack,
  onCancel,
}: CheckInScreenProps) {
  const categoryId: CategoryId = CATEGORY_ORDER[stepIndex];
  const category = categories[categoryId];

  // The parent remounts this screen per step (key={stepIndex}), so these
  // initializers run fresh for each category — clean by default, or restored
  // from a saved answer when the user steps back.
  const [score, setScore] = useState<number>(initialScore ?? 5);
  const [selectedTags, setSelectedTags] = useState<CheckInTagId[]>(initialTags ?? []);

  const segment = useMemo(() => segmentForScore(score), [score]);

  const toggleTag = (id: CheckInTagId) =>
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 220 }} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.iconBtn}>
            <Svg width={9} height={14} viewBox="0 0 9 14"><Path d="M7 1L1 7l6 6" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerCap}>DAILY CHECK-IN</Text>
            <Text style={styles.headerSub}>
              {streak > 0 ? `DAY ${streak} · STREAK ACTIVE` : 'STREAK · INACTIVE'}
            </Text>
          </View>
          <Pressable onPress={onCancel} style={styles.iconBtn}>
            <Svg width={14} height={14} viewBox="0 0 14 14"><Path d="M1 1l12 12M13 1L1 13" stroke="rgba(255,255,255,0.7)" strokeWidth={1.6} strokeLinecap="round" fill="none"/></Svg>
          </Pressable>
        </View>

        {/* STEP BAR */}
        <View style={styles.stepBar}>
          {CATEGORY_ORDER.map((_, i) => {
            const filled = i <= stepIndex;
            return (
              <View key={i} style={[styles.stepSeg, { backgroundColor: filled ? 'transparent' : alpha('#fff', 0.1) }]}>
                {filled && (
                  <LinearGradient
                    colors={[tier.primary, tier.mid]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* CATEGORY HERO */}
        <View style={styles.heroBlock}>
          <View style={[styles.heroIcon, { borderColor: alpha(tier.primary, 0.33), backgroundColor: alpha(tier.primary, 0.18) }]}>
            <CategoryGlyphIcon glyph={category.glyph} color="#fff" size={32} strokeWidth={1.6}/>
          </View>
          <Text style={[styles.stepCount, { color: tier.primary }]}>
            {String(stepIndex + 1).padStart(2, '0')} / {String(CATEGORY_ORDER.length).padStart(2, '0')} · CATEGORY
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Text style={styles.heroQuestion}>How was your </Text>
            <Text style={[styles.heroQuestion, { color: tier.primary }]}>
              {category.name.toLowerCase().replace(' progress', '').replace(' control', '')}
            </Text>
            <Text style={styles.heroQuestion}>{stepIndex === 0 ? ' today?' : '?'}</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            Rate from 1 (collapsed) to 10 (zenith-class)
          </Text>
        </View>

        {/* SCORE READOUT */}
        <View style={{ paddingHorizontal: spacing.xl }}>
          <HudCard accentColor={segment.color} showTopEdge>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.scoreValue, { color: '#fff' }]}>{score}</Text>
              <View style={[styles.statusBadge, { backgroundColor: alpha(segment.color, 0.12), borderColor: alpha(segment.color, 0.33) }]}>
                <View style={[styles.dot, { backgroundColor: segment.color }]}/>
                <Text style={[styles.statusLabel, { color: segment.color }]}>{segment.label}</Text>
              </View>
              <Text style={styles.statusDesc}>{segment.desc}</Text>

              {/* 1–10 SELECTOR */}
              <View style={styles.selector}>
                {Array.from({ length: 10 }).map((_, i) => {
                  const n = i + 1;
                  const active = n === score;
                  const below = n < score;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setScore(n)}
                      style={[
                        styles.selectorCell,
                        {
                          backgroundColor:
                            active ? segment.color :
                            below  ? alpha(tier.primary, 0.25) :
                                    'rgba(255,255,255,0.04)',
                          borderColor: active ? segment.color : surface.hairline,
                        },
                      ]}
                    >
                      <Text style={[styles.cellLabel, { color: active || below ? '#fff' : alpha('#fff', 0.5) }]}>
                        {n}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </HudCard>
        </View>

        {/* TAGS */}
        <SectionHeader index="02" title="What defined today" action="OPTIONAL"/>
        <View style={[styles.tagWrap, { paddingHorizontal: spacing.xl }]}>
          {mockCheckInTags.map(tg => {
            const active = selectedTags.includes(tg.id);
            return (
              <Pressable
                key={tg.id}
                onPress={() => toggleTag(tg.id)}
                style={[
                  styles.tag,
                  {
                    backgroundColor: active ? alpha(tier.primary, 0.18) : 'rgba(255,255,255,0.03)',
                    borderColor:     active ? tier.primary : alpha('#fff', 0.12),
                  },
                ]}
              >
                <Text style={[styles.tagLabel, { color: active ? '#fff' : alpha('#fff', 0.75) }]}>{tg.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* VOICE MEMO — not implemented yet; shown as a clearly disabled affordance */}
        <View style={{ paddingHorizontal: spacing.xl, marginTop: 16 }}>
          <HudCard>
            <View style={[styles.voiceRow, { opacity: 0.55 }]}>
              <View style={[styles.voiceIcon, { backgroundColor: alpha(tier.primary, 0.18), borderColor: alpha(tier.primary, 0.33) }]}>
                <Svg width={14} height={18} viewBox="0 0 14 18"><Path d="M7 1v10" stroke={tier.primary} strokeWidth={4} strokeLinecap="round"/><Path d="M1 9c0 3.3 2.7 6 6 6s6-2.7 6-6M7 15v2" stroke={tier.primary} strokeWidth={1.6} strokeLinecap="round"/></Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.voiceTitle}>Add voice memo</Text>
                <Text style={styles.voiceSub}>20s reflection · auto-transcribed</Text>
              </View>
              <View style={styles.soonBadge}>
                <Text style={styles.soonText}>SOON</Text>
              </View>
            </View>
          </HudCard>
        </View>
      </ScrollView>

      {/* BOTTOM CTA */}
      <View style={styles.ctaBar}>
        <LinearGradient
          colors={['transparent', alpha(surface.bg, 0.95)]}
          style={StyleSheet.absoluteFill}
        />
        <PrimaryCTA
          tier={tier}
          label={stepIndex === CATEGORY_ORDER.length - 1 ? (isFinalStep ? 'Submit Check-in' : 'Continue') : 'Continue'}
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
    <View style={shStyles.row}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={shStyles.idx}>{index}</Text>
        <Text style={shStyles.title}>{title.toUpperCase()}</Text>
      </View>
      {action && <Text style={shStyles.action}>{action}</Text>}
    </View>
  );
}

const shStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: 12,
  },
  idx:    { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  title:  { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', letterSpacing: 1.4, color: alpha('#fff', 0.85) },
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
  headerCap: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.6 },
  headerSub: { fontFamily: fonts.mono, fontSize: 11, color: '#fff', marginTop: 2, letterSpacing: 0.5 },

  stepBar: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: spacing.xl, paddingTop: 6, paddingBottom: 20,
  },
  stepSeg: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },

  heroBlock: { paddingHorizontal: spacing.xl, alignItems: 'center', marginBottom: 18 },
  heroIcon: {
    width: 72, height: 72, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  stepCount: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.6, marginBottom: 8 },
  heroQuestion: {
    fontFamily: fonts.displayBold, fontSize: 24, fontWeight: '600',
    letterSpacing: -0.4, color: '#fff', lineHeight: 28,
  },
  heroSubtitle: {
    fontFamily: fonts.display, fontSize: 12, color: surface.textTertiary, marginTop: 6,
  },

  scoreValue: {
    fontFamily: fonts.monoBold, fontSize: 72, fontWeight: '600',
    lineHeight: 72, letterSpacing: -2,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1, marginTop: 4,
  },
  statusLabel: { fontFamily: fonts.monoBold, fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  statusDesc: { fontFamily: fonts.display, fontSize: 12, color: surface.textSecondary, marginTop: 10, textAlign: 'center' },

  selector: { flexDirection: 'row', gap: 4, marginTop: 18, width: '100%' },
  selectorCell: {
    flex: 1, height: 38, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  cellLabel: { fontFamily: fonts.monoBold, fontSize: 13, fontWeight: '600' },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.pill, borderWidth: 1,
  },
  tagLabel: { fontFamily: fonts.display, fontSize: 12, fontWeight: '500' },

  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voiceIcon: {
    width: 36, height: 36, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  voiceTitle: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', color: '#fff' },
  voiceSub:   { fontFamily: fonts.display, fontSize: 11, color: surface.textTertiary, marginTop: 2 },
  soonBadge:  {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill, borderWidth: 1, borderColor: surface.hairline,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  soonText:   { fontFamily: fonts.mono, fontSize: 9, color: surface.textTertiary, letterSpacing: 1 },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    // Lift the button clear of the floating tab bar (bottom 28 + height 64) so it
    // is never hidden behind it, on web and mobile alike.
    paddingBottom: layout.tabBarBottom + layout.tabBarHeight + spacing.md,
  },
});
