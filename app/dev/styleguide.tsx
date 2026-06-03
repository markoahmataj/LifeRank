// app/dev/styleguide.tsx
// Dev-only style guide / component showcase.

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { surface, fonts, spacing, alpha } from '@/src/design-system/tokens';

export default function StyleGuideRoute() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>STYLE GUIDE</Text>
        <Text style={styles.sub}>Component showcase for LifeRank</Text>
        <Text style={styles.note}>Access from dev builds only.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: surface.bg },
  content: { paddingTop: 80, paddingHorizontal: spacing.xl },
  title:   { fontFamily: fonts.displayBold, fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  sub:     { fontFamily: fonts.display, fontSize: 14, color: surface.textSecondary, marginTop: 8 },
  note:    { fontFamily: fonts.mono, fontSize: 11, color: surface.textTertiary, marginTop: 16, letterSpacing: 0.5 },
});
