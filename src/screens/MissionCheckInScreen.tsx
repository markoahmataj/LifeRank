// src/screens/MissionCheckInScreen.tsx
// Final step of the daily check-in (only shown when there are active missions).
// Asks "did you complete this today?" per active mission. Marking a mission done
// advances its protocol by one day at submit time. No fake progress.
// PORT: app/(tabs)/checkin.tsx

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import type { Mission, RankTier } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { HudCard } from '../components/HudCard';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';
import { categories, surface, spacing, fonts, alpha, radius, layout } from '../design-system/tokens';

export interface MissionCheckInScreenProps {
  tier: RankTier;
  missions: Mission[];
  /** missionId → done today */
  answers: Record<string, boolean>;
  streak?: number;
  onToggle: (missionId: string, done: boolean) => void;
  onBack?: () => void;
  onCancel?: () => void;
  onSubmit: () => void;
}

export function MissionCheckInScreen({
  tier, missions, answers, streak = 0, onToggle, onBack, onCancel, onSubmit,
}: MissionCheckInScreenProps) {
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

        {/* HERO */}
        <View style={styles.heroBlock}>
          <Text style={[styles.stepCount, { color: tier.primary }]}>ACTIVE OPERATIONS</Text>
          <Text style={styles.heroQuestion}>Did you hold the line today?</Text>
          <Text style={styles.heroSubtitle}>
            Marking an operation done advances it one day toward completion.
          </Text>
        </View>

        {/* MISSION LIST */}
        <View style={{ paddingHorizontal: spacing.xl, gap: 12 }}>
          {missions.map(m => {
            const cat = categories[m.category];
            const requiredDays = m.requiredDays ?? m.duration ?? 1;
            const daysCompleted = m.daysCompleted ?? 0;
            const done = answers[m.id] === true;
            return (
              <HudCard key={m.id} accentColor={cat.accent} padding={{ x: 16, y: 14 }}>
                <View style={styles.missionTop}>
                  <View style={[styles.catChip, { backgroundColor: alpha(cat.accent, 0.18), borderColor: alpha(cat.accent, 0.4) }]}>
                    <CategoryGlyphIcon glyph={cat.glyph} color={cat.accent} size={13}/>
                    <Text style={[styles.catLabel, { color: cat.accent }]}>{cat.name.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.dayCount}>
                    DAY {Math.min(requiredDays, daysCompleted + (done ? 1 : 0))} / {requiredDays}
                  </Text>
                </View>

                <Text style={styles.missionTitle}>{m.title}</Text>
                <Text style={styles.missionSub}>{m.subtitle}</Text>

                <View style={styles.toggleRow}>
                  <Pressable
                    onPress={() => onToggle(m.id, false)}
                    style={[
                      styles.toggleBtn,
                      !done
                        ? { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: surface.hairline }
                        : { backgroundColor: 'transparent', borderColor: surface.hairlineSoft },
                    ]}
                  >
                    <Text style={[styles.toggleLabel, { color: !done ? '#fff' : alpha('#fff', 0.5) }]}>NOT TODAY</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onToggle(m.id, true)}
                    style={[
                      styles.toggleBtn,
                      done
                        ? { backgroundColor: alpha(cat.accent, 0.2), borderColor: cat.accent }
                        : { backgroundColor: 'transparent', borderColor: surface.hairlineSoft },
                    ]}
                  >
                    <Text style={[styles.toggleLabel, { color: done ? '#fff' : alpha('#fff', 0.5) }]}>DONE TODAY</Text>
                  </Pressable>
                </View>
              </HudCard>
            );
          })}
        </View>
      </ScrollView>

      {/* BOTTOM CTA */}
      <View style={styles.ctaBar}>
        <LinearGradient colors={['transparent', alpha(surface.bg, 0.95)]} style={StyleSheet.absoluteFill}/>
        <PrimaryCTA
          tier={tier}
          label="Submit Check-in"
          onPress={onSubmit}
          icon={
            <Svg width={14} height={12} viewBox="0 0 14 12"><Path d="M1 6h11M8 1l4 5-4 5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>
          }
        />
      </View>
    </View>
  );
}

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

  heroBlock: { paddingHorizontal: spacing.xl, alignItems: 'center', marginBottom: 18, marginTop: 8 },
  stepCount: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.6, marginBottom: 8 },
  heroQuestion: {
    fontFamily: fonts.displayBold, fontSize: 24, fontWeight: '600',
    letterSpacing: -0.4, color: '#fff', lineHeight: 28, textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: fonts.display, fontSize: 12, color: surface.textTertiary, marginTop: 6, textAlign: 'center',
  },

  missionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
  },
  catLabel: { fontFamily: fonts.monoBold, fontSize: 9.5, fontWeight: '600', letterSpacing: 1 },
  dayCount: { fontFamily: fonts.monoBold, fontSize: 11, color: '#fff', letterSpacing: 0.5 },

  missionTitle: { fontFamily: fonts.displayBold, fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  missionSub: { fontFamily: fonts.display, fontSize: 12, color: surface.textTertiary, marginTop: 3 },

  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  toggleBtn: {
    flex: 1, height: 40, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleLabel: { fontFamily: fonts.monoBold, fontSize: 11, fontWeight: '600', letterSpacing: 1 },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl,
    paddingBottom: layout.tabBarBottom + layout.tabBarHeight + spacing.md,
  },
});
