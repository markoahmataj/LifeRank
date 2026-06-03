// src/screens/SettingsPrivacyScreen.tsx
// Settings + privacy + future-state placeholders. Premium tone — no
// generic gray rows.
// PORT: app/settings.tsx

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { RankTier, UserSettings } from '../design-system/types';
import { DEFAULT_USER_SETTINGS } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { HudCard } from '../components/HudCard';

import {
  getTier, surface, spacing, fonts, alpha, radius, state,
} from '../design-system/tokens';

export interface SettingsPrivacyScreenProps {
  tier?: RankTier;
  onBack?: () => void;
  handle?: string;
  displayName?: string;
  tierLabel?: string;
  buildName?: string;
  settings?: UserSettings;
  onToggleSetting?: (key: keyof UserSettings, value: boolean) => void;
  onResetCalibration?: () => void;
  onDeleteLocalData?: () => void;
  onExportData?: () => void;
  onSignOut?: () => void;
}

export function SettingsPrivacyScreen({
  tier = getTier('apex'),
  onBack,
  handle = '@you',
  displayName = 'You',
  tierLabel,
  buildName = 'Unassigned',
  settings = DEFAULT_USER_SETTINGS,
  onToggleSetting,
  onResetCalibration,
  onDeleteLocalData,
  onExportData,
  onSignOut,
}: SettingsPrivacyScreenProps) {
  const resolvedTierLabel = tierLabel ?? `${tier.name} · ${tier.sublabel.replace('TIER ', '')}`;
  const set = (key: keyof UserSettings, value: boolean) => onToggleSetting?.(key, value);

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
            <Text style={styles.headerCap}>SYSTEM</Text>
            <Text style={styles.headerSub}>Settings & Privacy</Text>
          </View>
          <View style={{ width: 36 }}/>
        </View>

        {/* IDENTITY */}
        <Section num="01" title="Identity">
          <Row label="Handle"       value={handle}             hint="The signature on share cards."/>
          <Row label="Display Name" value={displayName}/>
          <Row label="Tier"         value={resolvedTierLabel}  valueColor={tier.primary}/>
          <Row label="Build"        value={buildName}/>
        </Section>

        {/* PRIVACY */}
        <Section num="02" title="Share Privacy">
          <ToggleRow
            label="Hide Life Score on share cards"
            hint="Posters render with score blurred."
            value={!settings.shareScoreVisible}
            onChange={(v) => set('shareScoreVisible', !v)}
            tier={tier}
          />
          <ToggleRow
            label="Hide category breakdown"
            hint="Removes the 5-pillar mini row."
            value={!settings.shareCategoriesVisible}
            onChange={(v) => set('shareCategoriesVisible', !v)}
            tier={tier}
          />
        </Section>

        {/* NOTIFICATIONS */}
        <Section num="03" title="Notifications">
          <ToggleRow label="Mission reminders" value={settings.notifMissionReminder} onChange={(v) => set('notifMissionReminder', v)} tier={tier}/>
          <ToggleRow label="Streak at risk"    value={settings.notifStreakRisk}      onChange={(v) => set('notifStreakRisk', v)}      tier={tier}/>
          <ToggleRow label="Weekly report"     value={settings.notifWeeklyReport}    onChange={(v) => set('notifWeeklyReport', v)}    tier={tier}/>
          <ToggleRow label="Rank changes"      value={settings.notifRankChange}      onChange={(v) => set('notifRankChange', v)}      tier={tier}/>
        </Section>

        {/* HEALTH INTEGRATION — LOCKED */}
        <Section num="04" title="Health Integration">
          <View style={styles.lockedBanner}>
            <Svg width={14} height={16} viewBox="0 0 11 13">
              <Path d="M1 6h9v6H1z" stroke={alpha('#fff', 0.5)} strokeWidth={1.4} fill="none"/>
              <Path d="M3 6V4a2.5 2.5 0 015 0v2" stroke={alpha('#fff', 0.5)} strokeWidth={1.4} fill="none"/>
            </Svg>
            <View style={{ flex: 1 }}>
              <Text style={styles.lockedHead}>Apple Health · Health Connect</Text>
              <Text style={styles.lockedBody}>
                Real biometric signals (HRV, sleep, energy) integrate post-MVP.
                Until then, System Signals are computed from your check-ins.
              </Text>
              <View style={styles.comingSoonRibbon}>
                <Text style={styles.comingSoonLabel}>COMING LATER</Text>
              </View>
            </View>
          </View>
        </Section>

        {/* DATA */}
        <Section num="05" title="Data">
          <ActionRow
            label="Export data"
            sub="All check-ins, missions, scores · JSON"
            tier={tier}
            onPress={onExportData}
          />
          <ActionRow
            label="Reset calibration"
            sub="Re-run the baseline scan. Score history preserved."
            tier={tier}
            onPress={onResetCalibration}
          />
          <ActionRow
            label="Delete local data"
            sub="Wipe device cache. Cannot be undone."
            tier={tier}
            destructive
            onPress={onDeleteLocalData}
          />
        </Section>

        {/* ACCOUNT */}
        <Section num="06" title="Account">
          <ActionRow
            label="Sign out"
            sub="End this session. Your data stays safe in the cloud."
            tier={tier}
            destructive
            onPress={onSignOut}
          />
        </Section>

        {/* ABOUT */}
        <Section num="07" title="About">
          <Row label="Version"        value="1.0.0 · MVP"/>
          <Row label="Build channel"  value="ALPHA"/>
          <Row label="Terms"          value="View"/>
          <Row label="Privacy policy" value="View"/>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingBottom: 18 }}>
      <View style={styles.secHead}>
        <Text style={styles.secIdx}>{num}</Text>
        <Text style={styles.secTitle}>{title.toUpperCase()}</Text>
      </View>
      <View style={[styles.padded, { gap: 8 }]}>{children}</View>
    </View>
  );
}

function Row({ label, value, valueColor, hint }: { label: string; value: string; valueColor?: string; hint?: string }) {
  return (
    <HudCard padding={{ x: 14, y: 12 }}>
      <View style={styles.rowHead}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
      </View>
      {hint && <Text style={styles.rowHint}>{hint}</Text>}
    </HudCard>
  );
}

function ToggleRow({ label, hint, value, onChange, tier }: {
  label: string; hint?: string; value: boolean; onChange: (v: boolean) => void; tier: RankTier;
}) {
  return (
    <HudCard padding={{ x: 14, y: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.rowLabel}>{label}</Text>
          {hint && <Text style={styles.rowHint}>{hint}</Text>}
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: 'rgba(255,255,255,0.12)', true: tier.primary }}
          thumbColor="#fff"
        />
      </View>
    </HudCard>
  );
}

function ActionRow({ label, sub, tier, destructive, onPress }: {
  label: string; sub: string; tier: RankTier; destructive?: boolean; onPress?: () => void;
}) {
  const accent = destructive ? state.break : tier.primary;
  return (
    <Pressable onPress={onPress}>
      <HudCard padding={{ x: 14, y: 12 }} accentColor={accent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: accent }]}>{label.toUpperCase()}</Text>
            <Text style={styles.rowHint}>{sub}</Text>
          </View>
          <Svg width={6} height={10} viewBox="0 0 6 10">
            <Path d="M1 1l4 4-4 4" stroke={alpha('#fff', 0.4)} strokeWidth={1.5} strokeLinecap="round" fill="none"/>
          </Svg>
        </View>
      </HudCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: surface.bg },
  padded: { paddingHorizontal: spacing.xl },

  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.hero, paddingBottom: 16 },
  iconBtn:   { width: 36, height: 36, borderRadius: 12, backgroundColor: surface.glassFill, borderWidth: 1, borderColor: surface.hairline, alignItems: 'center', justifyContent: 'center' },
  headerCap: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.6 },
  headerSub: { fontFamily: fonts.displayBold, fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 2 },

  secHead:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.xl, marginTop: 18, marginBottom: 10 },
  secIdx:   { fontFamily: fonts.mono, fontSize: 10, color: surface.textMuted, letterSpacing: 1 },
  secTitle: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', letterSpacing: 1.4, color: alpha('#fff', 0.85) },

  rowHead:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontFamily: fonts.displayBold, fontSize: 13, fontWeight: '600', color: '#fff' },
  rowValue: { fontFamily: fonts.mono, fontSize: 12, color: surface.textSecondary },
  rowHint:  { fontFamily: fonts.display, fontSize: 11.5, color: surface.textTertiary, marginTop: 4, lineHeight: 16 },

  lockedBanner: {
    flexDirection: 'row', gap: 12,
    padding: 14, borderRadius: radius.lg, borderWidth: 1,
    borderStyle: 'dashed', borderColor: surface.hairline,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  lockedHead: { fontFamily: fonts.displayBold, fontSize: 14, fontWeight: '600', color: '#fff' },
  lockedBody: { fontFamily: fonts.display, fontSize: 12, color: surface.textTertiary, lineHeight: 17, marginTop: 4 },
  comingSoonRibbon: {
    marginTop: 10, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: surface.hairlineSoft,
  },
  comingSoonLabel: { fontFamily: fonts.monoBold, fontSize: 9, color: alpha('#fff', 0.65), letterSpacing: 1.4 },
});
