// src/screens/NotificationsScreen.tsx
// Destination for the bell icon on Home. Tier-themed notification cards.
// PORT: app/notifications.tsx

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { LRNotification, RankTier } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { HudCard } from '../components/HudCard';
import { EmptyState } from '../components/EmptyState';

import {
  getTier, surface, spacing, fonts, alpha, radius,
} from '../design-system/tokens';

export interface NotificationsScreenProps {
  tier?: RankTier;
  notifications?: LRNotification[];
  onBack?: () => void;
  onSelect?: (n: LRNotification) => void;
}

export function NotificationsScreen({
  tier = getTier('apex'),
  notifications = [],
  onBack,
  onSelect,
}: NotificationsScreenProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.iconBtn}>
            <Svg width={9} height={14} viewBox="0 0 9 14"><Path d="M7 1L1 7l6 6" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerCap}>SIGNAL · INBOX</Text>
            <Text style={styles.headerSub}>{unreadCount > 0 ? `${unreadCount} unread` : 'All read'}</Text>
          </View>
          <View style={styles.unreadDot}>
            {unreadCount > 0 && <Text style={[styles.unreadCount, { color: tier.primary }]}>{unreadCount}</Text>}
          </View>
        </View>

        {notifications.length === 0 ? (
          <View style={[styles.padded, { marginTop: 40 }]}>
            <EmptyState
              tier={tier}
              status="STATUS · CLEAR"
              title="Inbox quiet."
              body="The system is monitoring. You'll hear from it when something changes."
            />
          </View>
        ) : (
          <View style={[styles.padded, { gap: 8 }]}>
            {notifications.map(n => (
              <NotificationCard key={n.id} n={n} onPress={() => onSelect?.(n)} tier={tier}/>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function NotificationCard({ n, onPress, tier }: { n: LRNotification; onPress: () => void; tier: RankTier }) {
  const accent = n.accent ?? tier.primary;
  const at = new Date(n.at);
  const timeLabel = formatRelative(at);
  return (
    <Pressable onPress={onPress}>
      <HudCard accentColor={accent} variant="default" showTopEdge={!n.read} padding={{ x: 14, y: 12 }}>
        <View style={styles.rowTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <KindIcon kind={n.kind} color={accent}/>
            <Text style={[styles.kindLabel, { color: accent }]}>{labelForKind(n.kind)}</Text>
            {!n.read && <View style={[styles.unread, { backgroundColor: accent }]}/>}
          </View>
          <Text style={styles.time}>{timeLabel}</Text>
        </View>
        <Text style={styles.title}>{n.title}</Text>
        <Text style={styles.body}>{n.body}</Text>
        {n.cta && (
          <View style={[styles.ctaPill, { borderColor: alpha(accent, 0.4), backgroundColor: alpha(accent, 0.08) }]}>
            <Text style={[styles.ctaLabel, { color: accent }]}>{n.cta.label.toUpperCase()}</Text>
            <Svg width={8} height={10} viewBox="0 0 8 10">
              <Path d="M2 1l4 4-4 4" stroke={accent} strokeWidth={1.5} strokeLinecap="round" fill="none"/>
            </Svg>
          </View>
        )}
      </HudCard>
    </Pressable>
  );
}

function KindIcon({ kind, color }: { kind: LRNotification['kind']; color: string }) {
  const s = { stroke: color, strokeWidth: 1.6, fill: 'none' as const };
  switch (kind) {
    case 'mission-reminder':
      return (
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path d="M2 4h10v8H2z" {...s}/><Path d="M5 2h4v2" {...s}/>
        </Svg>
      );
    case 'rank-warning':
    case 'streak-risk':
      return (
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path d="M7 1L13 12H1z" {...s} strokeLinejoin="round"/>
          <Path d="M7 6v2" stroke={color} strokeWidth={2} strokeLinecap="round"/>
        </Svg>
      );
    case 'weekly-report':
      return (
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path d="M2 12V5M6 12V2M10 12v-5M14 12v-3" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
        </Svg>
      );
    case 'mission-unlocked':
      return (
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path d="M2 7h10v6H2z" {...s}/><Path d="M4 7V4a3 3 0 016 0" {...s}/>
        </Svg>
      );
    case 'promotion':
      return (
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path d="M7 1l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" {...s} strokeLinejoin="round"/>
        </Svg>
      );
    case 'demotion':
      return (
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path d="M2 5l5 5 5-5" {...s} strokeLinecap="round"/>
        </Svg>
      );
  }
}

function labelForKind(k: LRNotification['kind']): string {
  const map: Record<LRNotification['kind'], string> = {
    'mission-reminder': 'MISSION',
    'rank-warning':     'RANK',
    'weekly-report':    'REPORT',
    'streak-risk':      'STREAK',
    'mission-unlocked': 'UNLOCKED',
    'promotion':        'PROMOTION',
    'demotion':         'DEMOTION',
  };
  return map[k];
}

function formatRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' }).toUpperCase();
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: surface.bg },
  padded: { paddingHorizontal: spacing.xl },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.hero, paddingBottom: 16 },
  iconBtn:     { width: 36, height: 36, borderRadius: 12, backgroundColor: surface.glassFill, borderWidth: 1, borderColor: surface.hairline, alignItems: 'center', justifyContent: 'center' },
  headerCap:   { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.6 },
  headerSub:   { fontFamily: fonts.displayBold, fontSize: 14, fontWeight: '600', color: '#fff', marginTop: 2 },
  unreadDot:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  unreadCount: { fontFamily: fonts.monoBold, fontSize: 16, fontWeight: '700' },

  rowTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kindLabel: { fontFamily: fonts.monoBold, fontSize: 9.5, fontWeight: '600', letterSpacing: 1.4 },
  unread:    { width: 5, height: 5, borderRadius: 3 },
  time:      { fontFamily: fonts.mono, fontSize: 10, color: surface.textTertiary, letterSpacing: 0.5 },
  title:     { fontFamily: fonts.displayBold, fontSize: 14, fontWeight: '600', color: '#fff', marginTop: 6, letterSpacing: -0.1 },
  body:      { fontFamily: fonts.display, fontSize: 12.5, color: surface.textSecondary, marginTop: 4, lineHeight: 17 },
  ctaPill:   {
    marginTop: 10, alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill, borderWidth: 1,
  },
  ctaLabel: { fontFamily: fonts.monoBold, fontSize: 10, fontWeight: '600', letterSpacing: 1 },
});
