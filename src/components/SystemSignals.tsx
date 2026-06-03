// src/components/SystemSignals.tsx
// Row of StatChips + optional "Health Signals · Coming Later" ribbon.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { SystemSignal } from '../design-system/types';
import { StatChip } from './StatChip';
import { fonts, surface, alpha } from '../design-system/tokens';

interface SystemSignalsProps {
  signals: SystemSignal[];
  showLockedHealthRibbon?: boolean;
  onSignalPress?: (id: SystemSignal['id']) => void;
}

export function SystemSignals({
  signals,
  showLockedHealthRibbon = false,
}: SystemSignalsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.chipRow}>
        {signals.map(s => (
          <StatChip
            key={s.id}
            label={s.label}
            value={s.display}
            dotColor={s.color}
          />
        ))}
      </View>

      {showLockedHealthRibbon && (
        <View style={styles.ribbon}>
          <View style={[styles.dot, { backgroundColor: surface.textMuted }]}/>
          <Text style={styles.ribbonLabel}>HEALTH SIGNALS · COMING LATER</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    width: '100%',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: surface.hairlineSoft,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  ribbonLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: surface.textMuted,
    letterSpacing: 1.2,
  },
});
