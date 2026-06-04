// src/design-system/scoringModel.ts
// Pure scoring functions. Side-effect free and unit-testable.

import type {
  CategoryId,
  CategoryScore,
  LifeScore,
  Mission,
  RankTierId,
} from './types';
import { RANK_THRESHOLDS } from './tokens';

/* ──────────────────────────────────────────────────────────────────
   1. CATEGORY SCORE — EMA
   ────────────────────────────────────────────────────────────────── */
export const CATEGORY_SMOOTHING = 0.7;

export function updateCategoryScore(previous: number, todayRaw: number): number {
  const blended = previous * CATEGORY_SMOOTHING + todayRaw * (1 - CATEGORY_SMOOTHING);
  return clamp(round1(blended), 0, 10);
}

/* ──────────────────────────────────────────────────────────────────
   2. LIFE SCORE
   ────────────────────────────────────────────────────────────────── */
export interface LifeScoreInputs {
  categoryScores: CategoryScore[];
  streakDays: number;
  activeMissions: Mission[];
}

export function computeLifeScore(inputs: LifeScoreInputs): number {
  const base = mean(inputs.categoryScores.map(c => c.value));
  const consistency = consistencyModifier(inputs.streakDays);
  const mission     = missionModifier(inputs.activeMissions);
  return clamp(round1(base + consistency + mission), 0, 10);
}

export function consistencyModifier(streakDays: number): number {
  if (streakDays <= 0)  return 0;
  if (streakDays >= 90) return 0.40;
  if (streakDays >= 30) return 0.35 + ((streakDays - 30) / 60) * 0.05;
  return Math.min(0.35, streakDays * (0.35 / 30));
}

export function missionModifier(active: Mission[]): number {
  if (!active.length) return 0;
  const sum = active.reduce(
    (acc, m) => acc + Math.min(0.15, m.rewardScore * 0.3),
    0,
  );
  return Math.min(0.3, sum);
}

/* ──────────────────────────────────────────────────────────────────
   3. RP
   ────────────────────────────────────────────────────────────────── */
export const RP_REWARDS = {
  checkIn:         25,
  streakPerDay:    5,
  streakMilestone: { 7: 50, 30: 250, 100: 1000, 365: 5000 } as Record<number, number>,
  weeklyConsistencyBonus: 100,
  personalRecord:  75,
} as const;

export function rpForCheckIn(streakDay: number): number {
  let total = RP_REWARDS.checkIn + RP_REWARDS.streakPerDay;
  if (RP_REWARDS.streakMilestone[streakDay] != null) {
    total += RP_REWARDS.streakMilestone[streakDay];
  }
  return total;
}

export function rpForMissionComplete(m: Mission): number {
  return m.rewardRP ?? Math.round(m.rewardScore * 250);
}

/* ──────────────────────────────────────────────────────────────────
   4. TIER LOOKUP
   ────────────────────────────────────────────────────────────────── */
export function tierForScore(score: number): RankTierId {
  for (const r of RANK_THRESHOLDS) {
    if (score >= r.min && score < r.max) return r.tier;
  }
  return score <= 0 ? 'dormant' : 'zenith';
}

export const TIER_ORDER: RankTierId[] = [
  'unranked', 'dormant', 'unstable', 'operational',
  'ascendant', 'apex', 'mythic', 'zenith',
];

/** -1 if `next` is below `prev`, +1 if above, 0 if same. */
export function compareTiers(prev: RankTierId, next: RankTierId): -1 | 0 | 1 {
  const pi = TIER_ORDER.indexOf(prev);
  const ni = TIER_ORDER.indexOf(next);
  if (ni > pi) return 1;
  if (ni < pi) return -1;
  return 0;
}

/* ──────────────────────────────────────────────────────────────────
   5. STREAK PROTECTION
   ────────────────────────────────────────────────────────────────── */
export const STREAK_GRACE_MS = 24 * 60 * 60 * 1000;

export function isStreakAlive(
  lastCheckInISO: string | undefined,
  now: number = Date.now(),
): boolean {
  if (!lastCheckInISO) return false;
  const last = new Date(lastCheckInISO).getTime();
  return now - last < STREAK_GRACE_MS;
}

/* ──────────────────────────────────────────────────────────────────
   6. HELPERS
   ────────────────────────────────────────────────────────────────── */
function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/* ──────────────────────────────────────────────────────────────────
   7. applyCheckIn — convenience reducer helper
   ────────────────────────────────────────────────────────────────── */
export interface ApplyCheckInArgs {
  current: LifeScore;
  rawRatings: Record<CategoryId, number>;
  previousCategoryScores: CategoryScore[];
  activeMissions: Mission[];
  nowISO?: string;
}

export interface ApplyCheckInResult {
  next: LifeScore;
  nextCategoryScores: CategoryScore[];
  rpEarned: number;
}

export function applyCheckIn(args: ApplyCheckInArgs): ApplyCheckInResult {
  const nextCategoryScores: CategoryScore[] = args.previousCategoryScores.map(c => {
    const raw = args.rawRatings[c.id];
    const newValue = updateCategoryScore(c.value, raw);
    return { ...c, value: newValue, delta: round1(newValue - c.value) };
  });

  const alive = isStreakAlive(args.current.lastCheckIn);
  const nextStreak = alive ? args.current.streak + 1 : 1;

  const newScore = computeLifeScore({
    categoryScores: nextCategoryScores,
    streakDays:     nextStreak,
    activeMissions: args.activeMissions,
  });

  const next: LifeScore = {
    value:      newScore,
    delta:      round1(newScore - args.current.value),
    tier:       tierForScore(newScore),
    nextRankAt: nextPromotionScore(tierForScore(newScore)),
    streak:     nextStreak,
    pbScore:    Math.max(args.current.pbScore ?? 0, newScore),
    lastCheckIn: args.nowISO ?? new Date().toISOString(),
  };

  return {
    next,
    nextCategoryScores,
    rpEarned: rpForCheckIn(nextStreak),
  };
}

export function nextPromotionScore(tier: RankTierId): number {
  const order: RankTierId[] = [
    'dormant','unstable','operational','ascendant','apex','mythic','zenith',
  ];
  const i = order.indexOf(tier);
  const next = i >= 0 && i < order.length - 1 ? order[i + 1] : null;
  if (!next) return 10.0;
  return RANK_THRESHOLDS.find(r => r.tier === next)?.min ?? 10.0;
}
