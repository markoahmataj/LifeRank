// src/components/MissionCard.tsx
// Mission card — compact and hero variants.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import type { Mission, RankTier } from '../design-system/types';
import { HudCard } from './HudCard';
import { EnergyBar } from './EnergyBar';
import { CategoryGlyphIcon } from './CategoryGlyph';
import {
  categories, fonts, surface, radius, alpha, state,
} from '../design-system/tokens';

interface MissionCardProps {
  mission: Mission;
  tier: RankTier;
  variant?: 'compact' | 'hero';
  accentColor: string;
  onPress?: () => void;
  onToggleTask?: (taskId: string) => void;
}

export function MissionCard({
  mission,
  tier,
  variant = 'compact',
  accentColor,
  onPress,
  onToggleTask,
}: MissionCardProps) {
  const cat = categories[mission.category];
  const isLocked = mission.status === 'locked';
  const isActive = mission.status === 'active';
  const requiredDays  = mission.requiredDays ?? mission.duration;
  const daysCompleted = mission.daysCompleted ?? 0;

  return (
    <Pressable onPress={onPress}>
      <HudCard
        accentColor={accentColor}
        variant={isLocked ? 'default' : 'mission'}
        showTopEdge={variant === 'hero'}
        padding={{ x: 14, y: 14 }}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[
              styles.opTag,
              { borderColor: alpha(accentColor, 0.35), backgroundColor: alpha(accentColor, 0.1) },
            ]}>
              <Text style={[styles.opCode, { color: accentColor }]}>{mission.id}</Text>
            </View>
            <StatusTag status={mission.status} accentColor={accentColor}/>
          </View>
          <RewardStamp reward={mission.rewardScore} unit={cat.short} accentColor={accentColor}/>
        </View>

        {/* Title */}
        <Text style={[styles.title, isLocked && { opacity: 0.5 }]}>{mission.title}</Text>
        <Text style={styles.subtitle}>{mission.subtitle}</Text>

        {/* Reason (hero only) */}
        {variant === 'hero' && mission.reason && (
          <View style={[styles.reasonBox, { borderColor: alpha(accentColor, 0.3) }]}>
            <Text style={styles.reasonText}>{mission.reason}</Text>
          </View>
        )}

        {/* Meta row */}
        <View style={styles.metaRow}>
          <DifficultyPips level={mission.difficulty} color={accentColor}/>
          {isActive && requiredDays != null && (
            <Text style={styles.metaText}>DAY {daysCompleted}/{requiredDays}</Text>
          )}
          {isLocked && (
            <LockIcon color={surface.textMuted}/>
          )}
        </View>

        {/* Progress bar */}
        {mission.progress != null && (
          <View style={{ marginTop: 10 }}>
            <EnergyBar value={mission.progress} tier={tier} thickness={4} colors={[accentColor, tier.mid, tier.far]}/>
          </View>
        )}

        {/* Task checklist (hero only) */}
        {variant === 'hero' && mission.tasks && mission.tasks.length > 0 && (
          <View style={styles.taskList}>
            {mission.tasks.map(t => (
              <Pressable
                key={t.id}
                onPress={() => onToggleTask?.(t.id)}
                style={[styles.taskRow, { opacity: t.done ? 0.55 : 1 }]}
              >
                <View style={[
                  styles.checkbox,
                  t.done
                    ? { backgroundColor: accentColor, borderColor: accentColor }
                    : { borderColor: alpha('#fff', 0.2) },
                ]}>
                  {t.done && (
                    <Svg width={10} height={8} viewBox="0 0 10 8">
                      <Path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </Svg>
                  )}
                </View>
                <Text style={[styles.taskLabel, t.done && { textDecorationLine: 'line-through', color: surface.textTertiary }]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </HudCard>
    </Pressable>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function DifficultyPips({ level, color }: { level: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <View key={i} style={{
          width: 5, height: 5, borderRadius: 3,
          backgroundColor: i < level ? color : 'rgba(255,255,255,0.15)',
        }}/>
      ))}
    </View>
  );
}

function RewardStamp({ reward, unit, accentColor }: { reward: number; unit: string; accentColor: string }) {
  return (
    <View style={[styles.reward, { backgroundColor: alpha(accentColor, 0.14), borderColor: alpha(accentColor, 0.33) }]}>
      <Text style={[styles.rewardText, { color: accentColor }]}>+{reward.toFixed(1)} {unit}</Text>
    </View>
  );
}

function StatusTag({ status, accentColor }: { status: Mission['status']; accentColor: string }) {
  if (status === 'active') {
    return (
      <View style={styles.activeRow}>
        <View style={[styles.activeDot, { backgroundColor: accentColor }]}/>
        <Text style={[styles.activeLabel, { color: accentColor }]}>ACTIVE</Text>
      </View>
    );
  }
  if (status === 'featured') {
    return (
      <View style={styles.activeRow}>
        <View style={[styles.activeDot, { backgroundColor: '#22D3EE' }]}/>
        <Text style={[styles.activeLabel, { color: '#22D3EE' }]}>FEATURED</Text>
      </View>
    );
  }
  if (status === 'completed') {
    return (
      <View style={styles.activeRow}>
        <View style={[styles.activeDot, { backgroundColor: state.win }]}/>
        <Text style={[styles.activeLabel, { color: state.win }]}>COMPLETE</Text>
      </View>
    );
  }
  return null;
}

function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={14} viewBox="0 0 11 13">
      <Path d="M1 6h9v6H1z" stroke={color} strokeWidth={1.4} fill="none"/>
      <Path d="M3 6V4a2.5 2.5 0 015 0v2" stroke={color} strokeWidth={1.4} fill="none"/>
    </Svg>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  opTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  opCode: {
    fontFamily: fonts.monoBold,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  activeLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 1,
  },
  reward: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  rewardText: {
    fontFamily: fonts.monoBold,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: surface.textTertiary,
    marginTop: 4,
  },
  reasonBox: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  reasonText: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: surface.textSecondary,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  metaText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: surface.textTertiary,
    letterSpacing: 0.8,
  },
  taskList: {
    marginTop: 12,
    gap: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskLabel: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: '#fff',
    flex: 1,
  },
});
