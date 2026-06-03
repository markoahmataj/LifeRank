// src/screens/OnboardingScreen.tsx
// First screen a new user sees. Pre-calibration. Unranked emblem.
// PORT: app/(onboarding)/index.tsx

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { RankEmblem } from '../components/RankEmblem';
import { HudCard } from '../components/HudCard';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';

import {
  rankTiers, categories, CATEGORY_ORDER, surface, fonts, alpha, spacing, radius,
} from '../design-system/tokens';

export interface OnboardingScreenProps {
  onBegin?: () => void;
  onLearnMore?: () => void;
}

export function OnboardingScreen({ onBegin, onLearnMore }: OnboardingScreenProps) {
  const tier = rankTiers.unranked;

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier} showGrid intensity={0.85}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <Text style={styles.brand}>L · I · F · E   R · A · N · K</Text>
          <Text style={styles.versionTag}>v1.0 · PRE-RELEASE</Text>
        </View>

        {/* EMBLEM */}
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <RankEmblem tier={tier} size={220} animated/>
        </View>

        {/* UNRANKED LABEL */}
        <View style={{ alignItems: 'center', marginTop: 8, gap: 4 }}>
          <View style={styles.unrankedBadge}>
            <View style={styles.unrankedDot}/>
            <Text style={styles.unrankedLabel}>STATUS · UNRANKED</Text>
          </View>
        </View>

        {/* HEADLINE */}
        <View style={styles.headlineBlock}>
          <Text style={styles.headline}>
            Enter ranked mode{'\n'}
            <Text style={{ color: '#fff' }}>for real life.</Text>
          </Text>
          <Text style={styles.tagline}>
            A self-ranking operating system for high-performance users.{'\n'}
            Five domains. One score. Compounding daily.
          </Text>
        </View>

        {/* DOMAINS */}
        <View style={styles.domainSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIdx}>01</Text>
            <Text style={styles.sectionTitle}>FIVE CONTROLLABLE PILLARS</Text>
          </View>

          <View style={{ gap: 8, paddingHorizontal: spacing.xl }}>
            {CATEGORY_ORDER.map(id => {
              const c = categories[id];
              return (
                <HudCard key={id} padding={{ x: 14, y: 12 }} accentColor={c.accent} variant="mission">
                  <View style={styles.domainRow}>
                    <View style={[styles.domainIcon, {
                      backgroundColor: alpha(c.accent, 0.18),
                      borderColor: alpha(c.accent, 0.4),
                    }]}>
                      <CategoryGlyphIcon glyph={c.glyph} color={c.accent} size={18}/>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.domainName}>{c.name}</Text>
                      <Text style={styles.domainBlurb}>{DOMAIN_BLURBS[id]}</Text>
                    </View>
                    <Text style={[styles.domainCode, { color: c.accent }]}>{c.short}</Text>
                  </View>
                </HudCard>
              );
            })}
          </View>
        </View>

        {/* HOW IT WORKS */}
        <View style={styles.domainSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIdx}>02</Text>
            <Text style={styles.sectionTitle}>HOW THE LADDER WORKS</Text>
          </View>
          <View style={{ paddingHorizontal: spacing.xl }}>
            <HudCard padding={{ x: 16, y: 14 }}>
              {[
                ['CALIBRATE', 'A one-time baseline scan. The system reads where you are.'],
                ['CHECK-IN',  '60 seconds daily. Five sliders, one score.'],
                ['RANK UP',   'Cross score thresholds — Dormant → Apex → Zenith.'],
                ['OPERATE',   'The OS assigns operations to compound weak pillars.'],
              ].map(([k, v], i) => (
                <View key={k} style={[styles.howRow, i > 0 && { borderTopWidth: 1, borderTopColor: surface.hairlineSoft, paddingTop: 10, marginTop: 10 }]}>
                  <Text style={styles.howStep}>{String(i + 1).padStart(2, '0')}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.howKey}>{k}</Text>
                    <Text style={styles.howVal}>{v}</Text>
                  </View>
                </View>
              ))}
            </HudCard>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM CTAs */}
      <View style={styles.ctaBar}>
        <Pressable onPress={onLearnMore} style={[styles.ghost, { borderColor: surface.hairline }]}>
          <Text style={styles.ghostText}>HOW RANKING WORKS</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <PrimaryCTA
            tier={rankTiers.apex}
            label="Begin Calibration"
            onPress={onBegin}
            icon={
              <Svg width={14} height={12} viewBox="0 0 14 12">
                <Path d="M1 6h11M8 1l4 5-4 5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </Svg>
            }
          />
        </View>
      </View>
    </View>
  );
}

const DOMAIN_BLURBS: Record<string, string> = {
  discipline:  'Routine, focus, follow-through.',
  style:       'Aesthetic execution and self-presentation.',
  environment: 'The space and signal around you.',
  money:       'Spending control and capital direction.',
  career:      'Skill compounding and output trajectory.',
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.hero, paddingBottom: 8,
  },
  brand: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 2, color: alpha('#fff', 0.7) },
  versionTag: { fontFamily: fonts.mono, fontSize: 9, color: surface.textMuted, letterSpacing: 1 },

  unrankedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: alpha(rankTiers.unranked.primary, 0.4),
    backgroundColor: alpha(rankTiers.unranked.primary, 0.10),
  },
  unrankedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: rankTiers.unranked.primary },
  unrankedLabel: { fontFamily: fonts.monoBold, fontSize: 10, color: rankTiers.unranked.primary, letterSpacing: 1.4 },

  headlineBlock: { paddingHorizontal: spacing.xl, marginTop: 24, alignItems: 'center' },
  headline: {
    fontFamily: fonts.displayBold, fontSize: 30, fontWeight: '700',
    color: alpha('#fff', 0.55), letterSpacing: -0.8, lineHeight: 36,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: fonts.display, fontSize: 13, color: surface.textTertiary,
    lineHeight: 19, textAlign: 'center', marginTop: 14, paddingHorizontal: 6,
  },

  domainSection: { marginTop: 30 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.xl, marginBottom: 12,
  },
  sectionIdx: { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  sectionTitle: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', letterSpacing: 1.4, color: alpha('#fff', 0.85) },

  domainRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  domainIcon: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  domainName: { fontFamily: fonts.displayBold, fontSize: 14, fontWeight: '600', color: '#fff' },
  domainBlurb: { fontFamily: fonts.display, fontSize: 11.5, color: surface.textTertiary, marginTop: 2 },
  domainCode: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 0.8 },

  howRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  howStep: {
    fontFamily: fonts.monoBold, fontSize: 11, color: surface.textTertiary,
    letterSpacing: 1, width: 22, marginTop: 2,
  },
  howKey: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', color: '#fff', letterSpacing: 1 },
  howVal: { fontFamily: fonts.display, fontSize: 12, color: surface.textSecondary, marginTop: 3, lineHeight: 17 },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 40,
    flexDirection: 'row', gap: 10,
    backgroundColor: alpha(surface.bg, 0.6),
  },
  ghost: {
    height: 56, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  ghostText: {
    fontFamily: fonts.displayBold, fontSize: 11, fontWeight: '600',
    color: '#fff', letterSpacing: 1.4,
  },
});
