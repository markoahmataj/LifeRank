// src/design-system/tokens.ts
// LifeRank design tokens. Pure data — safe to import anywhere.

import type {
  RankTierId,
  CategoryId,
  RankTier,
  CategoryDescriptor,
  ScoreSegment,
} from './types';

/* ──────────────────────────────────────────────────────────────────────
   1. SURFACE / NEUTRAL COLORS
   ──────────────────────────────────────────────────────────────────── */
export const surface = {
  bg:           '#07070b',
  bgElevated:   '#0a0a10',
  glassFill:    'rgba(255,255,255,0.045)',
  glassFillAlt: 'rgba(255,255,255,0.015)',
  hairline:     'rgba(255,255,255,0.08)',
  hairlineSoft: 'rgba(255,255,255,0.06)',
  divider:      'rgba(255,255,255,0.04)',
  textPrimary:  '#ffffff',
  textSecondary:'rgba(255,255,255,0.7)',
  textTertiary: 'rgba(255,255,255,0.5)',
  textMuted:    'rgba(255,255,255,0.35)',
  textInverse:  '#0a0a10',
} as const;

/* ──────────────────────────────────────────────────────────────────────
   2. STATE COLORS
   ──────────────────────────────────────────────────────────────────── */
export const state = {
  win:    '#34d399',
  break:  '#f87171',
  hold:   '#FBBF24',
  signal: '#22D3EE',
} as const;

/* ──────────────────────────────────────────────────────────────────────
   3. RANK TIER SIGNATURES
   ──────────────────────────────────────────────────────────────────── */
export const rankTiers: Record<RankTierId, RankTier> = {
  unranked: {
    id: 'unranked',
    name: 'UNRANKED',
    sublabel: 'PRE-CALIBRATION',
    primary: '#6B7280',
    mid:     '#4B5563',
    far:     '#374151',
    accent:  '#9CA3AF',
    glow1:   'rgba(107, 114, 128, 0.30)',
    glow2:   'rgba(75, 85, 99, 0.22)',
    glow3:   'rgba(55, 65, 81, 0.16)',
    barGlow: 'rgba(107, 114, 128, 0.45)',
    description: 'System offline. No baseline detected.',
    promotionCopy: 'Complete calibration to enter the ladder.',
    demotionCopy:  '',
  },
  dormant: {
    id: 'dormant',
    name: 'DORMANT',
    sublabel: 'TIER I',
    primary: '#7B6E63',
    mid:     '#5C4B3D',
    far:     '#3A2E25',
    accent:  '#C2A78A',
    glow1:   'rgba(123, 110, 99, 0.32)',
    glow2:   'rgba(92, 75, 61, 0.24)',
    glow3:   'rgba(58, 46, 37, 0.16)',
    barGlow: 'rgba(194, 167, 138, 0.50)',
    description: 'The system is silent. Hold position. Rebuild routine.',
    promotionCopy: 'Stabilize first. Every check-in is a signal.',
    demotionCopy:  'You are at the floor. Only ascent remains.',
  },
  unstable: {
    id: 'unstable',
    name: 'UNSTABLE',
    sublabel: 'TIER II',
    primary: '#F87171',
    mid:     '#B45253',
    far:     '#7C2D2E',
    accent:  '#FCA5A5',
    glow1:   'rgba(248, 113, 113, 0.32)',
    glow2:   'rgba(180, 82, 83, 0.22)',
    glow3:   'rgba(124, 45, 46, 0.16)',
    barGlow: 'rgba(248, 113, 113, 0.55)',
    description: 'High volatility. Streaks fracture. Protect the floor.',
    promotionCopy: 'String 3 stable days. Volatility drops, rank rises.',
    demotionCopy:  'One more break and you fall to Dormant.',
  },
  operational: {
    id: 'operational',
    name: 'OPERATIONAL',
    sublabel: 'TIER III',
    primary: '#FBBF24',
    mid:     '#D97706',
    far:     '#9A3412',
    accent:  '#FCD34D',
    glow1:   'rgba(251, 191, 36, 0.32)',
    glow2:   'rgba(217, 119, 6, 0.22)',
    glow3:   'rgba(154, 52, 18, 0.16)',
    barGlow: 'rgba(251, 191, 36, 0.55)',
    description: 'Functional. The baseline is held. Now compound it.',
    promotionCopy: 'Push past the routine ceiling. Ascendant is one step up.',
    demotionCopy:  'Slipping back to Unstable. Reinforce the protocol.',
  },
  ascendant: {
    id: 'ascendant',
    name: 'ASCENDANT',
    sublabel: 'TIER IV',
    primary: '#22D3EE',
    mid:     '#3B82F6',
    far:     '#7C3AED',
    accent:  '#A78BFA',
    glow1:   'rgba(34, 211, 238, 0.34)',
    glow2:   'rgba(59, 130, 246, 0.30)',
    glow3:   'rgba(124, 58, 237, 0.22)',
    barGlow: 'rgba(34, 211, 238, 0.55)',
    description: 'Above baseline. The compound curve is starting.',
    promotionCopy: 'Apex is in sight. Sharpen the weakest pillar.',
    demotionCopy:  'Holding the line. One bad cycle is recoverable.',
  },
  apex: {
    id: 'apex',
    name: 'APEX',
    sublabel: 'TIER V',
    primary: '#FF2D5C',
    mid:     '#C026D3',
    far:     '#7C3AED',
    accent:  '#22D3EE',
    glow1:   'rgba(255, 45, 92, 0.42)',
    glow2:   'rgba(192, 38, 211, 0.30)',
    glow3:   'rgba(124, 58, 237, 0.18)',
    barGlow: 'rgba(255, 45, 92, 0.60)',
    description: 'High-performance class. The system is yours to push.',
    promotionCopy: 'Mythic waits at 9.0. Stack months of consistency.',
    demotionCopy:  'Drift below 7.5 and Ascendant pulls you back.',
  },
  mythic: {
    id: 'mythic',
    name: 'MYTHIC',
    sublabel: 'TIER VI',
    primary: '#FFD166',
    mid:     '#FF8E3C',
    far:     '#FF3D71',
    accent:  '#FFD166',
    glow1:   'rgba(255, 142, 60, 0.42)',
    glow2:   'rgba(255, 61, 113, 0.32)',
    glow3:   'rgba(255, 209, 102, 0.18)',
    barGlow: 'rgba(255, 142, 60, 0.60)',
    description: 'Rarefied. Less than 1% of the ladder lives here.',
    promotionCopy: 'Zenith demands near-perfect 30-day cycles.',
    demotionCopy:  'A single weak week can return you to Apex.',
  },
  zenith: {
    id: 'zenith',
    name: 'ZENITH',
    sublabel: 'TIER VII',
    primary: '#F5F5F5',
    mid:     '#A5F3FC',
    far:     '#C4B5FD',
    accent:  '#FFFFFF',
    glow1:   'rgba(245, 245, 245, 0.38)',
    glow2:   'rgba(165, 243, 252, 0.28)',
    glow3:   'rgba(196, 181, 253, 0.20)',
    barGlow: 'rgba(245, 245, 245, 0.55)',
    description: 'Peak class. The system runs you. You run the system.',
    promotionCopy: 'You are at the top. Now defend the position.',
    demotionCopy:  'Zenith is fragile. Two off-cycles and you fall to Mythic.',
  },
} as const;

export const DEFAULT_TIER: RankTierId = 'apex';

/* ──────────────────────────────────────────────────────────────────────
   4. RANK THRESHOLDS
   ──────────────────────────────────────────────────────────────────── */
export const RANK_THRESHOLDS: Array<{ tier: RankTierId; min: number; max: number }> = [
  { tier: 'dormant',     min: 0.0, max: 3.0 },
  { tier: 'unstable',    min: 3.0, max: 5.0 },
  { tier: 'operational', min: 5.0, max: 6.5 },
  { tier: 'ascendant',   min: 6.5, max: 7.5 },
  { tier: 'apex',        min: 7.5, max: 9.0 },
  { tier: 'mythic',      min: 9.0, max: 9.6 },
  { tier: 'zenith',      min: 9.6, max: 10.1 },
];

/* ──────────────────────────────────────────────────────────────────────
   5. CATEGORIES
   ──────────────────────────────────────────────────────────────────── */
export const categories: Record<CategoryId, CategoryDescriptor> = {
  discipline: {
    id: 'discipline',
    name: 'Discipline',
    short: 'DSC',
    accent: '#FF2D5C',
    glyph: 'crosshair',
  },
  style: {
    id: 'style',
    name: 'Style',
    short: 'STL',
    accent: '#C026D3',
    glyph: 'diamond',
  },
  environment: {
    id: 'environment',
    name: 'Environment',
    short: 'ENV',
    accent: '#22D3EE',
    glyph: 'node',
  },
  money: {
    id: 'money',
    name: 'Money Control',
    short: 'MNY',
    accent: '#7C3AED',
    glyph: 'chart',
  },
  career: {
    id: 'career',
    name: 'Career Progress',
    short: 'CAR',
    accent: '#FF8E3C',
    glyph: 'ascent',
  },
} as const;

export const CATEGORY_ORDER: CategoryId[] = [
  'discipline', 'style', 'environment', 'money', 'career',
];

/* ──────────────────────────────────────────────────────────────────────
   6. SCORE SEGMENT LABELS
   ──────────────────────────────────────────────────────────────────── */
export const SCORE_SEGMENTS: ScoreSegment[] = [
  { min: 1,  max: 3,  label: 'COLLAPSED',    desc: 'Reset day. Streak holds. Recover.',  color: '#f87171' },
  { min: 4,  max: 5,  label: 'UNSTABLE',     desc: 'Routine slipped. Pull it back.',      color: '#FBBF24' },
  { min: 6,  max: 7,  label: 'OPERATIONAL',  desc: 'Held the line. Standard day.',        color: '#FBBF24' },
  { min: 8,  max: 8,  label: 'LOCKED-IN',    desc: 'Pushed past comfort. Solid output.', color: '#34d399' },
  { min: 9,  max: 9,  label: 'APEX-CLASS',   desc: 'On the edge of promotion territory.', color: '#FF2D5C' },
  { min: 10, max: 10, label: 'ZENITH-CLASS', desc: 'Peak performance. Rare day.',         color: '#22D3EE' },
];

/* ──────────────────────────────────────────────────────────────────────
   7. SPACING
   ──────────────────────────────────────────────────────────────────── */
export const spacing = {
  xxs: 2,
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
  xxxl: 40,
  hero: 60,
} as const;

/* ──────────────────────────────────────────────────────────────────────
   8. BORDER RADIUS
   ──────────────────────────────────────────────────────────────────── */
export const radius = {
  none:  0,
  xs:    6,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    22,
  xxl:   28,
  pill:  999,
} as const;

/* ──────────────────────────────────────────────────────────────────────
   9. TYPOGRAPHY
   ──────────────────────────────────────────────────────────────────── */
export const fonts = {
  display:     'SpaceGrotesk_500Medium',
  displayBold: 'SpaceGrotesk_700Bold',
  mono:        'JetBrainsMono_500Medium',
  monoBold:    'JetBrainsMono_700Bold',
} as const;

export const type = {
  metricXL: {
    fontFamily: fonts.mono,
    fontSize: 64,
    fontWeight: '600' as const,
    letterSpacing: -2,
    lineHeight: 64,
  },
  metricLG: {
    fontFamily: fonts.mono,
    fontSize: 36,
    fontWeight: '600' as const,
    letterSpacing: -1,
    lineHeight: 36,
  },
  titleLG: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  titleMD: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  body: {
    fontFamily: fonts.display,
    fontSize: 13.5,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 19,
  },
  bodySmall: {
    fontFamily: fonts.display,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  label: {
    fontFamily: fonts.displayBold,
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    lineHeight: 16,
  },
  caption: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    lineHeight: 14,
  },
  micro: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: '500' as const,
    letterSpacing: 1,
    lineHeight: 12,
  },
} as const;

/* ──────────────────────────────────────────────────────────────────────
   10. SHADOWS / GLOWS
   ──────────────────────────────────────────────────────────────────── */
export const shadow = {
  cardLift: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 18 },
    shadowOpacity: 0.6,
    shadowRadius:  40,
    elevation:     12,
  },
  tabBar: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 18 },
    shadowOpacity: 0.6,
    shadowRadius:  40,
    elevation:     20,
  },
  glowApex:   { color: '#FF2D5C', spread: 30, opacity: 0.40 },
  glowSignal: { color: '#22D3EE', spread: 20, opacity: 0.35 },
  glowWin:    { color: '#34d399', spread: 14, opacity: 0.45 },
} as const;

/* ──────────────────────────────────────────────────────────────────────
   11. MOTION
   ──────────────────────────────────────────────────────────────────── */
export const motion = {
  duration: {
    micro:   150,
    quick:   240,
    reveal:  500,
    rankUp:  800,
    ambient: 3600,
    orbit:   28000,
  },
  easing: {
    standard:    [0.2, 0.7, 0.2, 1] as const,
    out:         [0.16, 1, 0.3, 1] as const,
    inOut:       [0.65, 0, 0.35, 1] as const,
  },
} as const;

/* ──────────────────────────────────────────────────────────────────────
   12. LAYOUT
   ──────────────────────────────────────────────────────────────────── */
export const layout = {
  screenPaddingX: 20,
  cardPaddingX:   16,
  cardPaddingY:   16,
  tabBarHeight:   64,
  tabBarBottom:   28,
} as const;

/* ──────────────────────────────────────────────────────────────────────
   13. HELPERS
   ──────────────────────────────────────────────────────────────────── */
export function getTier(id: RankTierId): RankTier {
  return rankTiers[id];
}

export function tierForScore(score: number): RankTierId {
  for (const r of RANK_THRESHOLDS) {
    if (score >= r.min && score < r.max) return r.tier;
  }
  if (score <= 0) return 'dormant';
  return 'zenith';
}

export function nextTier(id: RankTierId): RankTierId | null {
  const order: RankTierId[] = [
    'dormant','unstable','operational','ascendant','apex','mythic','zenith',
  ];
  const i = order.indexOf(id);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : null;
}

export function previousTier(id: RankTierId): RankTierId | null {
  const order: RankTierId[] = [
    'dormant','unstable','operational','ascendant','apex','mythic','zenith',
  ];
  const i = order.indexOf(id);
  return i > 0 ? order[i - 1] : null;
}

export function promotionScore(id: RankTierId): number | null {
  const next = nextTier(id);
  if (!next) return null;
  const row = RANK_THRESHOLDS.find(r => r.tier === next);
  return row ? row.min : null;
}

export function segmentForScore(score: number): ScoreSegment {
  return (
    SCORE_SEGMENTS.find(s => score >= s.min && score <= s.max)
    ?? SCORE_SEGMENTS[2]
  );
}

export function alpha(hex: string, a: number): string {
  if (hex.startsWith('rgba')) return hex;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return `rgba(${r},${g},${b},${a})`;
}
