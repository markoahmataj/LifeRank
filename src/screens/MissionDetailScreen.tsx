// src/screens/MissionDetailScreen.tsx
// Full classified-operation file.
// PORT: app/mission/[id].tsx

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import type { Mission, MissionTask, RankTier } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { HudCard } from '../components/HudCard';
import { EnergyBar } from '../components/EnergyBar';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';

import {
  categories, getTier, surface, spacing, fonts, alpha, radius, state,
} from '../design-system/tokens';
import { mockActiveMissions, mockAvailableMissions, mockMissionRules } from '../design-system/mockData';

export interface MissionDetailScreenProps {
  tier?: RankTier;
  mission?: Mission;
  onBack?: () => void;
  onAccept?: (m: Mission) => void;
  onAbandon?: (m: Mission) => void;
  onToggleTask?: (taskId: string) => void;
  onComplete?: (m: Mission) => void;
  onContinue?: (m: Mission) => void;
  onViewResult?: (m: Mission) => void;
}

export function MissionDetailScreen({
  tier = getTier('apex'),
  mission = mockActiveMissions[0],
  onBack, onAccept, onAbandon, onToggleTask, onComplete, onContinue, onViewResult,
}: MissionDetailScreenProps) {
  const cat = categories[mission.category];
  const rules = mockMissionRules[mission.id] ?? [];

  const completedTasks = mission.tasks?.filter(t => t.done).length ?? 0;
  const totalTasks = mission.tasks?.length ?? 0;

  const isActive    = mission.status === 'active';
  const isLocked    = mission.status === 'locked';
  const isCompleted = mission.status === 'completed';
  const isReadyToComplete = isActive && (mission.progress ?? 0) >= 100;

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.iconBtn}>
            <Svg width={9} height={14} viewBox="0 0 9 14"><Path d="M7 1L1 7l6 6" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerCap}>OPERATION FILE</Text>
            <Text style={styles.headerSub}>{mission.id} · {mission.status.toUpperCase()}</Text>
          </View>
          <View style={{ width: 36 }}/>
        </View>

        {/* HERO */}
        <View style={[styles.padded, { marginBottom: 14 }]}>
          <HudCard accentColor={cat.accent} variant="mission" showTopEdge showCorners padding={{ x: 18, y: 18 }}>
            <View style={styles.metaRow}>
              <View style={[styles.catChip, { backgroundColor: alpha(cat.accent, 0.18), borderColor: alpha(cat.accent, 0.4) }]}>
                <CategoryGlyphIcon glyph={cat.glyph} color={cat.accent} size={14}/>
                <Text style={[styles.catLabel, { color: cat.accent }]}>{cat.name.toUpperCase()}</Text>
              </View>
              {isActive && (
                <View style={styles.activeRow}>
                  <View style={[styles.activeDot, { backgroundColor: cat.accent }]}/>
                  <Text style={[styles.activeLabel, { color: cat.accent }]}>ACTIVE</Text>
                </View>
              )}
              {isLocked && (
                <View style={styles.activeRow}>
                  <Svg width={11} height={13} viewBox="0 0 11 13"><Path d="M1 6h9v6H1z" stroke={alpha('#fff', 0.5)} strokeWidth={1.4} fill="none"/><Path d="M3 6V4a2.5 2.5 0 015 0v2" stroke={alpha('#fff', 0.5)} strokeWidth={1.4} fill="none"/></Svg>
                  <Text style={[styles.activeLabel, { color: alpha('#fff', 0.6) }]}>LOCKED</Text>
                </View>
              )}
              {isCompleted && (
                <View style={styles.activeRow}>
                  <View style={[styles.activeDot, { backgroundColor: state.win }]}/>
                  <Text style={[styles.activeLabel, { color: state.win }]}>COMPLETED</Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>{mission.title}</Text>
            <Text style={styles.subtitle}>{mission.subtitle}</Text>

            <View style={styles.statsGrid}>
              <Stat label="DIFFICULTY" value={'■'.repeat(mission.difficulty) + '□'.repeat(5 - mission.difficulty)}/>
              <Stat label="SCORE"      value={`+${mission.rewardScore.toFixed(1)}`}/>
              <Stat label="RP"         value={`+${mission.rewardRP ?? Math.round(mission.rewardScore * 250)}`}/>
              <Stat label="DURATION"   value={`${mission.duration ?? '—'}D`}/>
              {isActive && (
                <Stat label="DAYS LEFT" value={`${(mission.duration ?? 0) - (mission.daysIn ?? 0)}D`}/>
              )}
            </View>
          </HudCard>
        </View>

        {/* WHY ASSIGNED */}
        {mission.reason && (
          <View style={[styles.padded, { marginBottom: 14 }]}>
            <HudCard accentColor={tier.accent} padding={{ x: 14, y: 12 }}>
              <Text style={[styles.smallCap, { color: tier.accent, marginBottom: 4 }]}>WHY ASSIGNED</Text>
              <Text style={styles.reason}>{mission.reason}</Text>
            </HudCard>
          </View>
        )}

        {/* CHECKLIST */}
        {mission.tasks && mission.tasks.length > 0 && (
          <>
            <SectionHeader index="02" title="Checklist" action={`${completedTasks}/${totalTasks}`}/>
            <View style={styles.padded}>
              <HudCard padding={{ x: 16, y: 14 }}>
                {mission.tasks.map((task, i) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    accent={cat.accent}
                    onToggle={() => onToggleTask?.(task.id)}
                    isLast={i === mission.tasks!.length - 1}
                  />
                ))}
                <View style={{ marginTop: 8 }}>
                  <EnergyBar value={(completedTasks / Math.max(1, totalTasks)) * 100} tier={tier} thickness={5}/>
                </View>
              </HudCard>
            </View>
          </>
        )}

        {/* RULES */}
        {rules.length > 0 && (
          <>
            <SectionHeader index="03" title="Rules of Engagement"/>
            <View style={styles.padded}>
              <HudCard padding={{ x: 16, y: 14 }}>
                {rules.map((rule, i) => (
                  <View key={i} style={[styles.ruleRow, i > 0 && { borderTopWidth: 1, borderTopColor: surface.hairlineSoft, paddingTop: 10, marginTop: 10 }]}>
                    <Text style={styles.ruleIdx}>{String(i + 1).padStart(2, '0')}</Text>
                    <Text style={styles.ruleText}>{rule}</Text>
                  </View>
                ))}
              </HudCard>
            </View>
          </>
        )}

        {/* LOCKED REQUIREMENT */}
        {isLocked && mission.requiredTier && (
          <View style={[styles.padded, { marginTop: 18 }]}>
            <HudCard accentColor={state.hold} padding={{ x: 16, y: 14 }}>
              <Text style={[styles.smallCap, { color: state.hold, marginBottom: 4 }]}>UNLOCK REQUIREMENT</Text>
              <Text style={styles.reason}>
                Requires {mission.requiredTier.toUpperCase()} tier.{'\n'}
                Cross the score threshold to gain access.
              </Text>
            </HudCard>
          </View>
        )}
      </ScrollView>

      {/* CTA BAR */}
      <View style={styles.ctaBar}>
        <LinearGradient colors={['transparent', alpha(surface.bg, 0.95)]} style={StyleSheet.absoluteFill}/>
        {isActive && (
          <>
            <Pressable onPress={() => onAbandon?.(mission)} style={[styles.ghost, { borderColor: alpha(state.break, 0.45) }]}>
              <Text style={[styles.ghostText, { color: state.break }]}>ABANDON</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <PrimaryCTA
                tier={tier}
                label={isReadyToComplete ? 'Mark Complete' : 'Continue Operation'}
                onPress={() => {
                  if (isReadyToComplete) {
                    onComplete?.(mission);
                  } else {
                    onContinue?.(mission);
                  }
                }}
              />
            </View>
          </>
        )}
        {!isActive && !isLocked && !isCompleted && (
          <View style={{ flex: 1 }}>
            <PrimaryCTA tier={tier} label="Accept Operation" onPress={() => onAccept?.(mission)}/>
          </View>
        )}
        {isLocked && (
          <View style={{ flex: 1 }}>
            <PrimaryCTA tier={tier} label="Cross Threshold to Unlock" disabled/>
          </View>
        )}
        {isCompleted && (
          <View style={{ flex: 1 }}>
            <PrimaryCTA tier={tier} label="View Result" onPress={() => onViewResult?.(mission)}/>
          </View>
        )}
      </View>
    </View>
  );
}

function TaskRow({ task, accent, onToggle, isLast }: { task: MissionTask; accent: string; onToggle?: () => void; isLast: boolean }) {
  return (
    <Pressable onPress={onToggle} style={[styles.taskRow, !isLast && { marginBottom: 8 }, { opacity: task.done ? 0.55 : 1 }]}>
      <View style={[styles.checkbox, task.done
        ? { backgroundColor: accent, borderColor: accent }
        : { borderColor: alpha('#fff', 0.18) }]}>
        {task.done && (
          <Svg width={10} height={8} viewBox="0 0 10 8">
            <Path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        )}
      </View>
      <Text style={[styles.taskLabel, task.done && { textDecorationLine: 'line-through', color: surface.textTertiary }]}>
        {task.label}
      </Text>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: 18, marginBottom: 12 },
  idx: { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  title: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', letterSpacing: 1.4, color: alpha('#fff', 0.85) },
  action: { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 0.8 },
});

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
  headerSub: { fontFamily: fonts.mono, fontSize: 11, color: '#fff', marginTop: 2, letterSpacing: 0.5 },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1,
  },
  catLabel: { fontFamily: fonts.monoBold, fontSize: 9.5, fontWeight: '600', letterSpacing: 1 },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeDot: { width: 5, height: 5, borderRadius: 3 },
  activeLabel: { fontFamily: fonts.monoBold, fontSize: 10, fontWeight: '600', letterSpacing: 1 },

  title: { fontFamily: fonts.displayBold, fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.6, lineHeight: 30 },
  subtitle: { fontFamily: fonts.display, fontSize: 13, color: surface.textTertiary, marginTop: 6, lineHeight: 18 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  stat: {
    minWidth: '30%', flexGrow: 1,
    paddingVertical: 10, paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: surface.hairlineSoft,
    borderRadius: 12, gap: 4, alignItems: 'flex-start',
  },
  statLabel: { fontFamily: fonts.mono, fontSize: 9, color: surface.textTertiary, letterSpacing: 1 },
  statValue: { fontFamily: fonts.monoBold, fontSize: 13, color: '#fff', fontWeight: '600' },

  smallCap: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.2, fontWeight: '600', color: surface.textTertiary },
  reason: { fontFamily: fonts.display, fontSize: 12.5, color: alpha('#fff', 0.85), lineHeight: 18 },

  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 18, height: 18, borderRadius: 6, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  taskLabel: { fontFamily: fonts.display, fontSize: 13, color: '#fff', flex: 1 },

  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  ruleIdx: { fontFamily: fonts.monoBold, fontSize: 11, color: surface.textTertiary, letterSpacing: 1, width: 22, marginTop: 2 },
  ruleText: { flex: 1, fontFamily: fonts.display, fontSize: 12.5, color: alpha('#fff', 0.85), lineHeight: 17 },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 40,
    flexDirection: 'row', gap: 10,
  },
  ghost: {
    height: 56, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  ghostText: { fontFamily: fonts.displayBold, fontSize: 11, fontWeight: '600', letterSpacing: 1.4 },
});
