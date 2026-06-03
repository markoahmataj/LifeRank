// src/components/CategoryStatCard.tsx
// Individual category score card used in the home screen grid.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

import type { CategoryDescriptor, CategoryScore, RankTier } from '../design-system/types';
import { HudCard } from './HudCard';
import { EnergyBar } from './EnergyBar';
import { CategoryGlyphIcon } from './CategoryGlyph';
import { fonts, surface, radius, alpha, state } from '../design-system/tokens';

interface CategoryStatCardProps {
  category: CategoryDescriptor;
  score: CategoryScore;
  tier: RankTier;
  fullWidth?: boolean;
  onPress?: () => void;
}

export function CategoryStatCard({
  category,
  score,
  tier,
  fullWidth = false,
  onPress,
}: CategoryStatCardProps) {
  const positive = score.delta >= 0;
  const deltaColor = positive ? state.win : state.break;

  return (
    <Pressable onPress={onPress} style={fullWidth ? styles.full : styles.half}>
      <HudCard accentColor={category.accent} variant="mission" padding={{ x: 14, y: 14 }}>
        {/* Corner radial glow */}
        <Svg
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
        >
          <Defs>
            <RadialGradient id={`cg-${category.id}`} cx="100%" cy="0%" r="70%">
              <Stop offset="0%" stopColor={category.accent} stopOpacity={0.18}/>
              <Stop offset="100%" stopColor={category.accent} stopOpacity={0}/>
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#cg-${category.id})`}/>
        </Svg>

        {/* Icon chip */}
        <View style={[
          styles.iconChip,
          { backgroundColor: alpha(category.accent, 0.18), borderColor: alpha(category.accent, 0.4) },
        ]}>
          <CategoryGlyphIcon glyph={category.glyph} color={category.accent} size={18}/>
        </View>

        {/* Delta badge */}
        <View style={[styles.deltaBadge, {
          backgroundColor: positive ? alpha(state.win, 0.14) : alpha(state.break, 0.14),
          borderColor:     positive ? alpha(state.win, 0.4)  : alpha(state.break, 0.4),
        }]}>
          <Text style={[styles.deltaText, { color: deltaColor }]}>
            {positive ? '+' : ''}{score.delta.toFixed(1)}
          </Text>
        </View>

        {/* Category name */}
        <Text style={styles.name}>{category.name}</Text>

        {/* Score */}
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreValue, { color: category.accent }]}>
            {score.value.toFixed(1)}
          </Text>
          <Text style={styles.scoreUnit}>/10</Text>
        </View>

        {/* Bar */}
        <View style={{ marginTop: 10 }}>
          <EnergyBar
            value={score.value * 10}
            tier={tier}
            thickness={4}
            colors={[category.accent, tier.mid, category.accent]}
          />
        </View>
      </HudCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  half: { flex: 1 },
  full: { flex: 1 },
  iconChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  deltaBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  deltaText: {
    fontFamily: fonts.monoBold,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: surface.textTertiary,
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 4,
  },
  scoreValue: {
    fontFamily: fonts.monoBold,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  scoreUnit: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: surface.textMuted,
  },
});
