// src/screens/MissionsScreen.tsx
// "Mission Control." — list of operations.
// PORT: app/(tabs)/missions.tsx

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';

import type { Mission, RankTier } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { HudCard } from '../components/HudCard';
import { MissionCard } from '../components/MissionCard';
import { EnergyBar } from '../components/EnergyBar';

import {
  categories, getTier, surface, spacing, fonts, alpha, radius,
} from '../design-system/tokens';
import { mockAvailableMissions } from '../design-system/mockData';

type MissionFilter = 'active' | 'available' | 'completed';

export interface MissionsScreenProps {
  tier?: RankTier;
  onBack?: () => void;
  onMissionPress?: (id: string) => void;
  activeMissions?: Mission[];
  availableMissions?: Mission[];
  completedMissions?: Mission[];
}

export function MissionsScreen({
  tier = getTier('apex'),
  onBack,
  onMissionPress,
  activeMissions,
  availableMissions,
  completedMissions,
}: MissionsScreenProps) {
  const [filter, setFilter] = useState<MissionFilter>('active');

  const active    = activeMissions    ?? [];
  const available = availableMissions ?? mockAvailableMissions;
  const completed = completedMissions ?? [];

  const featured =
    active[0]
    ?? available.find(m => m.status === 'featured')
    ?? available[0];
  const list = useMemo<Mission[]>(() => {
    if (filter === 'active')    return active;
    if (filter === 'available') return available;
    return completed;
  }, [filter, active, available, completed]);

  const counts = {
    active:    active.length,
    available: available.length,
    completed: completed.length,
  };

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
            <Text style={styles.headerCap}>MISSION CONTROL</Text>
            <Text style={styles.headerTitle}>Operations</Text>
          </View>
          <Pressable style={[styles.iconBtn, { backgroundColor: alpha(tier.primary, 0.18), borderColor: alpha(tier.primary, 0.33) }]}>
            <Svg width={14} height={14} viewBox="0 0 14 14"><Path d="M7 1v12M1 7h12" stroke={tier.primary} strokeWidth={1.8} strokeLinecap="round"/></Svg>
          </Pressable>
        </View>

        {/* FEATURED HERO */}
        <Pressable
          onPress={() => featured && onMissionPress?.(featured.id)}
          style={{ paddingHorizontal: spacing.xl }}
        >
          <HudCard accentColor={tier.primary} variant="mission" showTopEdge padding={{ x: 16, y: 16 }}>
            {/* angled line texture */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 360 220">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Line key={i} x1={-80 + i * 40} y1={0} x2={120 + i * 40} y2={220}
                        stroke="#fff" strokeOpacity={0.06} strokeWidth={0.5}/>
                ))}
              </Svg>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaLeft}>
                <EqIcon color={tier.primary}/>
                <Text style={[styles.opStatusLabel, { color: tier.primary }]}>
                  {featured.status === 'active' ? `ACTIVE · DAY ${featured.daysIn}/${featured.duration}` : 'FEATURED'}
                </Text>
              </View>
              <View style={[styles.reward, { backgroundColor: alpha(tier.primary, 0.14), borderColor: alpha(tier.primary, 0.33) }]}>
                <Text style={[styles.rewardText, { color: tier.primary }]}>+{featured.rewardScore} SCORE</Text>
              </View>
            </View>

            <Text style={styles.heroLabel}>Operation</Text>
            <Text style={[styles.heroTitle, { color: tier.primary }]}>{featured.title.toUpperCase()}</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <Difficulty color={tier.primary} level={featured.difficulty}/>
              <Text style={styles.heroMeta}>·</Text>
              <Text style={styles.heroMeta}>
                {featured.tasks
                  ? `${featured.tasks.filter(t => t.done).length}/${featured.tasks.length} TASKS`
                  : `${featured.duration ?? '—'}D PROTOCOL`}
              </Text>
              <Text style={styles.heroMeta}>·</Text>
              <Text style={styles.heroMeta}>{featured.daysIn ? `DAY ${featured.daysIn}/${featured.duration}` : 'READY'}</Text>
            </View>

            <View style={{ marginTop: 14 }}>
              <EnergyBar value={featured.progress ?? 0} tier={tier} thickness={6}/>
            </View>
          </HudCard>
        </Pressable>

        {/* FILTER PILLS */}
        <View style={[styles.filterRow, { paddingHorizontal: spacing.xl }]}>
          {(['active', 'available', 'completed'] as MissionFilter[]).map(f => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? alpha(tier.primary, 0.18) : 'rgba(255,255,255,0.03)',
                    borderColor:     active ? tier.primary : alpha('#fff', 0.12),
                  },
                ]}
              >
                <Text style={[styles.filterLabel, { color: active ? '#fff' : alpha('#fff', 0.65) }]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
                <View style={[styles.countBadge, { backgroundColor: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)' }]}>
                  <Text style={[styles.countText, { color: active ? '#fff' : alpha('#fff', 0.6) }]}>{counts[f]}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* MISSION LIST */}
        <SectionHeader index="02" title={filter === 'active' ? 'Also Active' : filter === 'available' ? 'Available Operations' : 'Completed'}/>
        <View style={[styles.padded, { gap: 10 }]}>
          {list.map(m => (
            <MissionCard
              key={m.id}
              mission={m}
              tier={tier}
              variant="compact"
              accentColor={categories[m.category].accent}
              onPress={() => onMissionPress?.(m.id)}
            />
          ))}
        </View>
      </ScrollView>
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

function EqIcon({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 12 }}>
      {[0.4, 1, 0.6, 1, 0.4].map((h, i) => (
        <View key={i} style={{ width: 2, height: 12 * h, backgroundColor: color, borderRadius: 1 }}/>
      ))}
    </View>
  );
}

function Difficulty({ color, level }: { color: string; level: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[0,1,2,3,4].map(i => (
        <View key={i} style={{
          width: 5, height: 5, borderRadius: 3,
          backgroundColor: i < level ? color : 'rgba(255,255,255,0.15)',
        }}/>
      ))}
    </View>
  );
}

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

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  opStatusLabel: { fontFamily: fonts.monoBold, fontSize: 10, fontWeight: '600', letterSpacing: 1.4 },
  reward: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  rewardText: { fontFamily: fonts.monoBold, fontSize: 9.5, fontWeight: '600', letterSpacing: 0.4 },

  heroLabel: { fontFamily: fonts.displayBold, fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.8, lineHeight: 30, marginBottom: 4 },
  heroTitle: { fontFamily: fonts.displayBold, fontSize: 36, fontWeight: '700', letterSpacing: -1, lineHeight: 36 },
  heroMeta:  { fontFamily: fonts.mono, fontSize: 12, color: alpha('#fff', 0.7), letterSpacing: 0.5 },

  filterRow: { flexDirection: 'row', gap: 8, paddingTop: 14, paddingBottom: 6 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.pill, borderWidth: 1,
  },
  filterLabel: { fontFamily: fonts.display, fontSize: 12, fontWeight: '500' },
  countBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  countText: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 0.4 },
});
