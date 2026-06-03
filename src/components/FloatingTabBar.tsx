// src/components/FloatingTabBar.tsx
// Floating pill tab bar with 5 SVG icons. Absolute positioned at bottom.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import type { TabScreenName, RankTier } from '../design-system/types';
import { fonts, surface, radius, alpha } from '../design-system/tokens';

interface FloatingTabBarProps {
  active: TabScreenName;
  onChange: (id: TabScreenName) => void;
  tier: RankTier;
}

const TABS: Array<{ id: TabScreenName; label: string }> = [
  { id: 'home',     label: 'Home'     },
  { id: 'missions', label: 'Ops'      },
  { id: 'checkin',  label: 'Check-In' },
  { id: 'stats',    label: 'Stats'    },
  { id: 'share',    label: 'Share'    },
];

export function FloatingTabBar({ active, onChange, tier }: FloatingTabBarProps) {
  return (
    <View style={styles.container}>
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}/>
      <LinearGradient
        colors={[alpha(surface.bg, 0.65), alpha(surface.bg, 0.85)]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.border, { borderColor: surface.hairline }]}/>

      <View style={styles.row}>
        {TABS.map(tab => {
          const isActive = tab.id === active;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              style={styles.tabItem}
            >
              {isActive && (
                <LinearGradient
                  colors={[alpha(tier.primary, 0.22), alpha(tier.mid, 0.10)]}
                  style={styles.activeIndicator}
                />
              )}
              <TabIcon id={tab.id} active={isActive} color={isActive ? tier.primary : surface.textMuted}/>
              <Text style={[styles.label, { color: isActive ? tier.primary : surface.textMuted }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabIcon({ id, active, color }: { id: TabScreenName; active: boolean; color: string }) {
  const s = { stroke: color, strokeWidth: active ? 1.8 : 1.5, fill: 'none' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'home':
      return (
        <Svg width={20} height={20} viewBox="0 0 20 20">
          <Path d="M2 8L10 2l8 6v10H13v-5H7v5H2z" {...s}/>
        </Svg>
      );
    case 'missions':
      return (
        <Svg width={20} height={20} viewBox="0 0 20 20">
          <Path d="M3 5h14M3 10h10M3 15h7" {...s}/>
          <Circle cx={16} cy={13} r={3} {...s}/>
        </Svg>
      );
    case 'checkin':
      return (
        <Svg width={20} height={20} viewBox="0 0 20 20">
          <Circle cx={10} cy={10} r={7} {...s}/>
          <Path d="M7 10l2.5 2.5 4-5" {...s}/>
        </Svg>
      );
    case 'stats':
      return (
        <Svg width={20} height={20} viewBox="0 0 20 20">
          <Path d="M3 16V10M7 16V6M11 16V8M15 16V4" {...s}/>
          <Path d="M3 16h14" {...s}/>
        </Svg>
      );
    case 'share':
      return (
        <Svg width={20} height={20} viewBox="0 0 20 20">
          <Path d="M10 13V3M6 7l4-4 4 4" {...s}/>
          <Path d="M4 13v5h12v-5" {...s}/>
        </Svg>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    height: 64,
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  border: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radius.xxl,
    borderWidth: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 3,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radius.xxl,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
