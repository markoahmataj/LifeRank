// src/screens/ShareScreen.tsx
// Viral share/broadcast system.
// PORT: app/(tabs)/share.tsx

import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import type { CategoryScore, LifeScore, RankTier, ShareLayout, ShareFormat } from '../design-system/types';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { HudCard } from '../components/HudCard';
import { RankEmblem } from '../components/RankEmblem';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { CategoryGlyphIcon } from '../components/CategoryGlyph';

import {
  categories, getTier, surface, spacing, fonts, alpha, radius,
} from '../design-system/tokens';
import { defaultShareConfig } from '../design-system/mockData';
import type { LifeScore as LifeScoreType } from '../design-system/types';

const ZERO_SCORE: LifeScoreType = { value: 0, delta: 0, tier: 'dormant', nextRankAt: 3.0, streak: 0 };

export interface ShareScreenProps {
  tier?: RankTier;
  onBack?: () => void;
  onBroadcast?: () => void;
  onSendTo?: (channel: string) => void;
  score?: LifeScore;
  categoryScores?: CategoryScore[];
  handle?: string;
}

export function ShareScreen({
  tier = getTier('apex'),
  onBack,
  onBroadcast,
  onSendTo,
  score = ZERO_SCORE,
  categoryScores = [],
  handle = '@you',
}: ShareScreenProps) {
  const [layout, setLayout] = useState<ShareLayout>(defaultShareConfig.layout);
  const [format, setFormat] = useState<ShareFormat>(defaultShareConfig.format);
  const [toggles, setToggles] = useState({
    score:      defaultShareConfig.showScore,
    categories: defaultShareConfig.showCategories,
    streak:     defaultShareConfig.showStreak,
    handle:     defaultShareConfig.showHandle,
    qr:         defaultShareConfig.showQR,
  });

  const posterRef = useRef<View>(null);

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier}/>

      <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.iconBtn}>
            <Svg width={9} height={14} viewBox="0 0 9 14"><Path d="M7 1L1 7l6 6" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerCap}>BROADCAST</Text>
            <Text style={styles.headerTitle}>Share Status</Text>
          </View>
          <View style={{ width: 36 }}/>
        </View>

        {/* PREVIEW */}
        <View style={styles.previewWrap}>
          <View ref={posterRef} collapsable={false}>
            <SharePoster
              tier={tier}
              layout={layout}
              toggles={toggles}
              score={score}
              categoryScores={categoryScores}
              handle={handle}
            />
          </View>
        </View>

        {/* LAYOUT */}
        <SectionHeader index="01" title="Card Style" action="3 OPTIONS"/>
        <View style={[styles.padded, { flexDirection: 'row', gap: 10 }]}>
          {(['poster', 'minimal', 'badge'] as ShareLayout[]).map(v => {
            const active = layout === v;
            return (
              <Pressable
                key={v}
                onPress={() => setLayout(v)}
                style={[
                  styles.layoutBtn,
                  { borderColor: active ? tier.primary : surface.hairline, backgroundColor: active ? alpha(tier.primary, 0.08) : 'rgba(255,255,255,0.03)' },
                ]}
              >
                <View style={[styles.thumb, { backgroundColor: surface.bg, borderColor: surface.hairlineSoft }]}>
                  <ThumbVariant variant={v} tier={tier} score={score}/>
                </View>
                <Text style={[styles.layoutLabel, { color: active ? '#fff' : alpha('#fff', 0.65) }]}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* FORMAT */}
        <SectionHeader index="02" title="Format"/>
        <View style={[styles.padded, { flexDirection: 'row', gap: 8 }]}>
          {([
            { id: 'story',  ratio: '9:16',  desc: 'Story'  },
            { id: 'square', ratio: '1:1',   desc: 'Post'   },
            { id: 'wide',   ratio: '16:9',  desc: 'Banner' },
          ] as Array<{ id: ShareFormat; ratio: string; desc: string }>).map(f => {
            const active = format === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFormat(f.id)}
                style={[
                  styles.formatBtn,
                  { borderColor: active ? tier.primary : surface.hairline },
                ]}
              >
                {active && (
                  <LinearGradient
                    colors={[alpha(tier.primary, 0.18), alpha(tier.mid, 0.05)]}
                    style={[StyleSheet.absoluteFill, { borderRadius: 13 }]}
                  />
                )}
                <Text style={styles.formatRatio}>{f.ratio}</Text>
                <Text style={styles.formatDesc}>{f.desc}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* SEND TO */}
        <SectionHeader index="03" title="Send To"/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 10 }}>
          {[
            { id: 'ig',   label: 'Story',       glyph: 'IG' },
            { id: 'x',    label: 'X / Threads', glyph: 'X'  },
            { id: 'tt',   label: 'TikTok',      glyph: 'TT' },
            { id: 'link', label: 'Copy Link',   glyph: '⌘L' },
            { id: 'save', label: 'Save Image',  glyph: '↓'  },
          ].map(d => (
            <Pressable key={d.id} style={styles.sendBtn} onPress={() => onSendTo?.(d.id)}>
              <View style={[styles.sendIcon, { backgroundColor: alpha(tier.primary, 0.18), borderColor: alpha(tier.primary, 0.33) }]}>
                <Text style={styles.sendGlyph}>{d.glyph}</Text>
              </View>
              <Text style={styles.sendLabel}>{d.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* TOGGLES */}
        <SectionHeader index="04" title="Show On Card"/>
        <View style={[styles.padded, { gap: 8 }]}>
          <ToggleRow label="Life Score & Rank"   value={toggles.score}      onChange={v => setToggles(s => ({ ...s, score: v }))}      tier={tier}/>
          <ToggleRow label="Category breakdown"  value={toggles.categories} onChange={v => setToggles(s => ({ ...s, categories: v }))} tier={tier}/>
          <ToggleRow label="Streak counter"      value={toggles.streak}     onChange={v => setToggles(s => ({ ...s, streak: v }))}     tier={tier}/>
          <ToggleRow label="@handle"             value={toggles.handle}     onChange={v => setToggles(s => ({ ...s, handle: v }))}     tier={tier}/>
          <ToggleRow label="QR invite code"      value={toggles.qr}         onChange={v => setToggles(s => ({ ...s, qr: v }))}         tier={tier}/>
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <LinearGradient colors={['transparent', alpha(surface.bg, 0.95)]} style={StyleSheet.absoluteFill}/>
        <PrimaryCTA
          tier={tier}
          label="Broadcast"
          onPress={onBroadcast}
          icon={
            <Svg width={13} height={14} viewBox="0 0 13 14"><Path d="M6.5 9V1M3 4.5l3.5-3.5L10 4.5M1 9v3a1 1 0 001 1h9a1 1 0 001-1V9" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>
          }
        />
      </View>
    </View>
  );
}

/* ─── share poster ──────────────────────────────────────────────── */
interface PosterProps {
  tier: RankTier;
  layout: ShareLayout;
  toggles: { score: boolean; categories: boolean; streak: boolean; handle: boolean; qr: boolean };
  score: LifeScore;
  categoryScores: CategoryScore[];
  handle: string;
}

function SharePoster({ tier, layout, toggles, score, categoryScores, handle }: PosterProps) {
  return (
    <View style={[styles.poster, { width: 320, height: 400 }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: surface.bg }]}/>
      <LinearGradient
        colors={[alpha(tier.primary, 0.4), alpha(tier.far, 0.25), 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {layout === 'poster'  && <PosterLayout  tier={tier} toggles={toggles} score={score} categoryScores={categoryScores} handle={handle}/>}
      {layout === 'minimal' && <MinimalLayout tier={tier} toggles={toggles} score={score} handle={handle}/>}
      {layout === 'badge'   && <BadgeLayout   tier={tier} toggles={toggles} handle={handle}/>}
      {[
        { top: 8, left: 8,    rotate: '0deg'   },
        { top: 8, right: 8,   rotate: '90deg'  },
        { bottom: 8, right: 8, rotate: '180deg' },
        { bottom: 8, left: 8,  rotate: '270deg' },
      ].map((p, i) => (
        <View key={i} style={[
          styles.bracket,
          { borderTopColor: tier.primary, borderLeftColor: tier.primary,
            transform: [{ rotate: p.rotate }],
            top: p.top as any, bottom: p.bottom as any, left: p.left as any, right: p.right as any },
        ]}/>
      ))}
    </View>
  );
}

function PosterLayout({ tier, toggles, score, categoryScores, handle }: { tier: RankTier; toggles: PosterProps['toggles']; score: LifeScore; categoryScores: CategoryScore[]; handle: string }) {
  return (
    <>
      <View style={styles.posterTopBar}>
        <Text style={[styles.posterCap, { letterSpacing: 2 }]}>L · I · F · E  R · A · N · K</Text>
        <Text style={[styles.posterCap, { letterSpacing: 1 }]}>{new Date().toISOString().slice(0, 10)}</Text>
      </View>
      <View style={{ position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center' }}>
        <RankEmblem tier={tier} size={150} animated={false}/>
      </View>
      {toggles.score && (
        <View style={{ position: 'absolute', top: 200, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={[styles.posterCap, { letterSpacing: 2 }]}>LIFE SCORE</Text>
          <Text style={[styles.posterScore, { color: tier.primary }]}>{score.value.toFixed(1)}</Text>
          <Text style={[styles.posterTier, { color: tier.primary }]}>{tier.name} · {tier.sublabel}</Text>
        </View>
      )}
      {toggles.categories && (
        <View style={styles.posterCatRow}>
          {categoryScores.map(c => (
            <View key={c.id} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <CategoryGlyphIcon glyph={categories[c.id].glyph} color={alpha('#fff', 0.85)} size={14}/>
              <Text style={styles.posterCatScore}>{c.value.toFixed(1)}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.posterFoot}>
        {toggles.handle && <Text style={styles.posterHandle}>{handle}</Text>}
        {toggles.streak && <Text style={styles.posterMeta}>STREAK · {score.streak}D</Text>}
      </View>
    </>
  );
}

function MinimalLayout({ tier, toggles, score, handle }: { tier: RankTier; toggles: PosterProps['toggles']; score: LifeScore; handle: string }) {
  return (
    <>
      <Text style={[styles.posterCap, { position: 'absolute', top: 22, left: 22, letterSpacing: 2 }]}>LIFERANK</Text>
      {toggles.score && (
        <View style={{ position: 'absolute', top: 90, left: 22, right: 22 }}>
          <Text style={[styles.posterCap, { letterSpacing: 2, marginBottom: 4 }]}>LIFE SCORE</Text>
          <Text style={[styles.posterScoreXL, { color: tier.primary }]}>{score.value.toFixed(1)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <View style={{ width: 24, height: 1, backgroundColor: tier.primary }}/>
            <Text style={[styles.posterTier, { color: tier.primary }]}>{tier.name} · {tier.sublabel.replace('TIER ', '')}</Text>
          </View>
        </View>
      )}
      <View style={[styles.posterFoot, { justifyContent: 'space-between' }]}>
        {toggles.handle && <View><Text style={styles.posterHandle}>{handle}</Text>{toggles.streak && <Text style={styles.posterMeta}>{score.streak}-DAY STREAK</Text>}</View>}
        <Text style={[styles.posterMeta, { textAlign: 'right' }]}>{score.delta >= 0 ? '↑ +' : '↓ '}{score.delta.toFixed(1)}{'\n'}DELTA</Text>
      </View>
    </>
  );
}

function BadgeLayout({ tier, toggles, handle }: { tier: RankTier; toggles: PosterProps['toggles']; handle: string }) {
  return (
    <>
      <View style={{ position: 'absolute', top: 22, left: 22, right: 22, alignItems: 'center' }}>
        <Text style={[styles.posterCap, { letterSpacing: 2 }]}>OPERATION COMPLETE</Text>
        <Text style={styles.badgeTitle}>Mission Clear</Text>
      </View>
      <View style={{ position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center' }}>
        <RankEmblem tier={tier} size={170} animated={false} glyph="✓"/>
      </View>
      <View style={{ position: 'absolute', bottom: 70, left: 22, right: 22, alignItems: 'center' }}>
        <View style={[styles.rewardPill, { backgroundColor: alpha(tier.primary, 0.16), borderColor: alpha(tier.primary, 0.4) }]}>
          <Text style={[styles.rewardText, { color: tier.primary }]}>LIFERANK · OPERATIONS</Text>
        </View>
        <Text style={[styles.posterTier, { color: tier.primary, marginTop: 10 }]}>HELD · {tier.name} {tier.sublabel.replace('TIER ', '')}</Text>
      </View>
      <View style={[styles.posterFoot, { justifyContent: 'space-between' }]}>
        {toggles.handle && <Text style={styles.posterHandle}>{handle}</Text>}
        <Text style={styles.posterMeta}>LIFERANK</Text>
      </View>
    </>
  );
}

function ThumbVariant({ variant, tier, score }: { variant: ShareLayout; tier: RankTier; score: LifeScore }) {
  if (variant === 'poster') {
    return (
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center' }]}>
        <View style={[styles.thumbHex, { backgroundColor: tier.primary, marginTop: 8 }]}/>
        <Text style={styles.thumbScore}>{score.value.toFixed(1)}</Text>
      </View>
    );
  }
  if (variant === 'minimal') {
    return (
      <View style={[StyleSheet.absoluteFill, { padding: 6 }]}>
        <Text style={[styles.thumbScore, { marginTop: 16, color: '#fff' }]}>{score.value.toFixed(1)}</Text>
      </View>
    );
  }
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center' }]}>
      <View style={[styles.thumbBadge, { backgroundColor: tier.primary, marginTop: 14 }]}>
        <Text style={{ color: '#fff', fontFamily: fonts.displayBold, fontWeight: '700', fontSize: 11 }}>✓</Text>
      </View>
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

function ToggleRow({ label, value, onChange, tier }: { label: string; value: boolean; onChange: (v: boolean) => void; tier: RankTier }) {
  return (
    <HudCard padding={{ x: 14, y: 11 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 13, color: '#fff' }}>{label}</Text>
        <Pressable onPress={() => onChange(!value)} style={styles.switch}>
          {value ? (
            <LinearGradient
              colors={[tier.primary, tier.mid]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
            />
          ) : <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999 }]}/>}
          <View style={[styles.switchKnob, { left: value ? 19 : 3 }]}/>
        </Pressable>
      </View>
    </HudCard>
  );
}

/* ─── styles ─────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface.bg },
  padded: { paddingHorizontal: spacing.xl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.hero, paddingBottom: 12,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: surface.glassFill, borderWidth: 1, borderColor: surface.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCap: { fontFamily: fonts.mono, fontSize: 9.5, color: surface.textTertiary, letterSpacing: 1.6 },
  headerTitle: { fontFamily: fonts.displayBold, fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 2, letterSpacing: -0.2 },

  previewWrap: {
    marginHorizontal: spacing.xl, marginBottom: 16,
    paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed',
    alignItems: 'center',
  },

  poster: { borderRadius: 22, overflow: 'hidden', position: 'relative' },
  posterTopBar: { position: 'absolute', top: 18, left: 22, right: 22, flexDirection: 'row', justifyContent: 'space-between' },
  posterCap: { fontFamily: fonts.mono, fontSize: 9, color: alpha('#fff', 0.55), letterSpacing: 2 },
  posterScore: { fontFamily: fonts.monoBold, fontSize: 80, fontWeight: '600', lineHeight: 80, letterSpacing: -3, marginTop: 2 },
  posterScoreXL: { fontFamily: fonts.monoBold, fontSize: 140, fontWeight: '600', lineHeight: 120, letterSpacing: -6 },
  posterTier: { fontFamily: fonts.displayBold, fontSize: 14, fontWeight: '600', letterSpacing: 4 },
  posterCatRow: { position: 'absolute', bottom: 58, left: 22, right: 22, flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  posterCatScore: { fontFamily: fonts.mono, fontSize: 10, color: '#fff' },
  posterFoot: { position: 'absolute', bottom: 18, left: 22, right: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  posterHandle: { fontFamily: fonts.displayBold, fontSize: 11, fontWeight: '600', color: '#fff' },
  posterMeta:   { fontFamily: fonts.mono, fontSize: 9, color: alpha('#fff', 0.5), letterSpacing: 1 },
  badgeTitle:   { fontFamily: fonts.displayBold, fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginTop: 4 },
  rewardPill:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1 },
  rewardText:   { fontFamily: fonts.monoBold, fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  bracket: { position: 'absolute', width: 14, height: 14, borderTopWidth: 1.2, borderLeftWidth: 1.2, opacity: 0.5 },

  layoutBtn: { flex: 1, padding: 8, borderRadius: 14, borderWidth: 1 },
  thumb: { height: 60, borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  thumbHex: { width: 20, height: 20, borderRadius: 4 },
  thumbScore: { fontFamily: fonts.monoBold, fontSize: 14, fontWeight: '600', color: '#fff', alignSelf: 'center', marginTop: 4 },
  thumbBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  layoutLabel: { fontFamily: fonts.display, fontSize: 11, fontWeight: '500', marginTop: 6 },

  formatBtn: { flex: 1, paddingHorizontal: 6, paddingVertical: 10, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  formatRatio: { fontFamily: fonts.monoBold, fontSize: 14, fontWeight: '600', color: '#fff' },
  formatDesc:  { fontFamily: fonts.display, fontSize: 10, color: surface.textTertiary, marginTop: 2 },

  sendBtn: { width: 64, alignItems: 'center', gap: 6 },
  sendIcon: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sendGlyph: { fontFamily: fonts.monoBold, fontSize: 13, fontWeight: '600', color: '#fff' },
  sendLabel: { fontFamily: fonts.display, fontSize: 10.5, color: alpha('#fff', 0.7), letterSpacing: 0.2 },

  switch: { width: 38, height: 22, borderRadius: 999, position: 'relative', overflow: 'visible' },
  switchKnob: { position: 'absolute', top: 3, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff' },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 40,
  },
});
