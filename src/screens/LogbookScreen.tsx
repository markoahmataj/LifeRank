// src/screens/LogbookScreen.tsx
// History of daily check-ins. Calendar header + list of entries with
// expandable detail. Includes an empty state for fresh installs.
// PORT: app/logbook.tsx

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { LogbookEntry, RankTier } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { HudCard } from '../components/HudCard';
import { EmptyState } from '../components/EmptyState';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';

import {
  categories, getTier, surface, spacing, fonts, alpha, radius, state,
} from '../design-system/tokens';

export interface LogbookScreenProps {
  tier?: RankTier;
  entries?: LogbookEntry[];
  onBack?: () => void;
  onSelectDay?: (date: string) => void;
}

export function LogbookScreen({
  tier = getTier('apex'),
  entries = [],
  onBack,
  onSelectDay,
}: LogbookScreenProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(entries[0]?.date ?? null);

  const strip = entries.slice(0, 14).reverse();

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.iconBtn}>
            <Svg width={9} height={14} viewBox="0 0 9 14"><Path d="M7 1L1 7l6 6" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerCap}>LOGBOOK</Text>
            <Text style={styles.headerSub}>History · {entries.length} entries</Text>
          </View>
          <View style={{ width: 36 }}/>
        </View>

        {entries.length === 0 ? (
          <View style={[styles.padded, { marginTop: 40 }]}>
            <EmptyState
              tier={tier}
              status="STATUS · OFFLINE"
              title="No telemetry yet."
              body="Complete your first check-in to begin recording. The logbook tracks every cycle."
              cta={{ label: 'Begin Calibration' }}
            />
          </View>
        ) : (
          <>
            {/* 14-DAY STRIP */}
            <View style={[styles.padded, { marginBottom: 14 }]}>
              <HudCard padding={{ x: 12, y: 12 }}>
                <View style={styles.stripHeader}>
                  <Text style={styles.smallCap}>14-DAY STRIP</Text>
                  <Text style={[styles.smallCap, { color: alpha('#fff', 0.55) }]}>AVG {avg(strip.map(e => e.lifeScore))}</Text>
                </View>
                <View style={styles.strip}>
                  {strip.map(e => {
                    const heightPct = (e.lifeScore / 10) * 100;
                    const isExpanded = expandedDate === e.date;
                    return (
                      <Pressable key={e.date} onPress={() => setExpandedDate(e.date)} style={styles.stripCell}>
                        <View style={[styles.stripBar, {
                          height: `${heightPct}%` as any,
                          backgroundColor: isExpanded ? tier.primary : alpha(tier.primary, 0.4),
                        }]}/>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.stripDates}>
                  <Text style={styles.stripDateLabel}>14D AGO</Text>
                  <Text style={styles.stripDateLabel}>TODAY</Text>
                </View>
              </HudCard>
            </View>

            {/* LIST */}
            <SectionHeader index="02" title={`Entries · ${entries.length}`}/>
            <View style={[styles.padded, { gap: 8 }]}>
              {entries.map(entry => {
                const expanded = expandedDate === entry.date;
                return (
                  <LogbookEntryCard
                    key={entry.date}
                    entry={entry}
                    expanded={expanded}
                    onPress={() => setExpandedDate(expanded ? null : entry.date)}
                    tier={tier}
                  />
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function LogbookEntryCard({
  entry, expanded, onPress, tier,
}: {
  entry: LogbookEntry; expanded: boolean; onPress: () => void; tier: RankTier;
}) {
  const date = new Date(entry.date);
  const dateStr = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit' });
  const deltaTone = entry.delta > 0 ? state.win : entry.delta < 0 ? state.break : surface.textSecondary;

  return (
    <Pressable onPress={onPress}>
      <HudCard padding={{ x: 14, y: 12 }}>
        <View style={styles.entryHead}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.dateChip, { borderColor: alpha(tier.primary, 0.33) }]}>
              <Text style={styles.dateDay}>{date.getDate().toString().padStart(2, '0')}</Text>
              <Text style={styles.dateMon}>{date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.entryWeekday}>{dateStr.toUpperCase()}</Text>
              <Text style={styles.entryStreak}>STREAK · DAY {entry.streakDay}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.entryScore, { color: tier.primary }]}>{entry.lifeScore.toFixed(1)}</Text>
            {entry.delta !== 0 && (
              <Text style={[styles.entryDelta, { color: deltaTone }]}>
                {entry.delta > 0 ? '+' : ''}{entry.delta.toFixed(1)}
              </Text>
            )}
          </View>
        </View>

        {expanded && (
          <View style={styles.entryDetail}>
            <View style={styles.catGrid}>
              {entry.categoryScores.map(c => {
                const cat = categories[c.id];
                return (
                  <View key={c.id} style={styles.catCell}>
                    <CategoryGlyphIcon glyph={cat.glyph} color={cat.accent} size={14}/>
                    <Text style={styles.catScore}>{c.value.toFixed(1)}</Text>
                  </View>
                );
              })}
            </View>

            {entry.tags.length > 0 && (
              <View style={styles.tagRow}>
                {entry.tags.map(t => (
                  <View key={t} style={[styles.tagPill, { borderColor: alpha(tier.primary, 0.33) }]}>
                    <Text style={styles.tagLabel}>{t}</Text>
                  </View>
                ))}
              </View>
            )}

            {entry.note && (
              <View style={styles.noteBox}>
                <Text style={styles.smallCap}>NOTE</Text>
                <Text style={styles.noteText}>{entry.note}</Text>
              </View>
            )}

            {entry.completedMissionIds && entry.completedMissionIds.length > 0 && (
              <View style={styles.missionRow}>
                <Text style={styles.smallCap}>COMPLETED OPERATIONS</Text>
                {entry.completedMissionIds.map(id => (
                  <Text key={id} style={styles.missionItem}>· {id}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </HudCard>
    </Pressable>
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
  row:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.xl, marginTop: 18, marginBottom: 12 },
  idx:   { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  title: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', letterSpacing: 1.4, color: alpha('#fff', 0.85) },
});

function avg(xs: number[]): string {
  if (!xs.length) return '—';
  return (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1);
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: surface.bg },
  padded: { paddingHorizontal: spacing.xl },

  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.hero, paddingBottom: 16 },
  iconBtn:   { width: 36, height: 36, borderRadius: 12, backgroundColor: surface.glassFill, borderWidth: 1, borderColor: surface.hairline, alignItems: 'center', justifyContent: 'center' },
  headerCap: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.6 },
  headerSub: { fontFamily: fonts.displayBold, fontSize: 14, fontWeight: '600', color: '#fff', marginTop: 2 },

  stripHeader:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  smallCap:      { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.2 },
  strip:         { flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 3 },
  stripCell:     { flex: 1, height: '100%', justifyContent: 'flex-end' },
  stripBar:      { borderRadius: 2, minHeight: 2 },
  stripDates:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  stripDateLabel:{ fontFamily: fonts.mono, fontSize: 9, color: surface.textMuted, letterSpacing: 0.8 },

  entryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateChip:  { width: 44, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dateDay:   { fontFamily: fonts.monoBold, fontSize: 16, fontWeight: '700', color: '#fff', lineHeight: 17 },
  dateMon:   { fontFamily: fonts.mono, fontSize: 8, color: surface.textTertiary, letterSpacing: 1 },
  entryWeekday: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', color: '#fff', letterSpacing: 0.5 },
  entryStreak:  { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1, marginTop: 2 },
  entryScore:   { fontFamily: fonts.monoBold, fontSize: 22, fontWeight: '600', letterSpacing: -0.5 },
  entryDelta:   { fontFamily: fonts.mono, fontSize: 10, marginTop: 2 },

  entryDetail: { marginTop: 14, gap: 12 },
  catGrid:     { flexDirection: 'row', gap: 10 },
  catCell:     {
    flex: 1, paddingVertical: 8, paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: surface.hairlineSoft,
    borderRadius: 8, alignItems: 'center', gap: 4,
  },
  catScore: { fontFamily: fonts.monoBold, fontSize: 11, color: '#fff' },

  tagRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
  tagLabel:{ fontFamily: fonts.display, fontSize: 11, color: alpha('#fff', 0.85) },

  noteBox:  { gap: 4 },
  noteText: { fontFamily: fonts.display, fontSize: 12.5, color: alpha('#fff', 0.85), lineHeight: 17 },

  missionRow:  { gap: 4 },
  missionItem: { fontFamily: fonts.mono, fontSize: 11, color: surface.textSecondary, letterSpacing: 0.5 },
});
