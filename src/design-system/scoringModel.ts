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
  /** @deprecated Missions no longer affect Life Score directly. Kept optional so
   *  existing callers compile; the value is IGNORED. Missions improve their
   *  owning category, and Life Score re-derives from categories. */
  activeMissions?: Mission[];
}

/**
 * Maximum bonus any modifier can add on top of the category mean. Reached only
 * at a 90-day streak. Missions and RP never contribute to Life Score.
 */
export const MAX_CONSISTENCY_BONUS = 0.4;

/**
 * THE single source of truth for Life Score.
 *
 *   Life Score = mean(category values) + consistency bonus,  clamped 0–10
 *
 * Category scores (0–10) are the source of truth. The only modifier is the
 * streak-based consistency bonus, capped at MAX_CONSISTENCY_BONUS (+0.4).
 *
 * Worked example: categories [5,7,8,6,8] → mean 6.8 → at most 7.2 with a full
 * streak. It is impossible to reach Zenith/10.0 from a 6.8 category mean.
 */
export function deriveLifeScoreFromCategories(
  categoryScores: CategoryScore[],
  ctx?: { streakDays?: number },
): number {
  const base = mean(categoryScores.map(c => c.value));
  const consistency = consistencyModifier(ctx?.streakDays ?? 0);
  return clamp(round1(base + consistency), 0, 10);
}

/** Back-compat wrapper. Delegates to deriveLifeScoreFromCategories and IGNORES
 *  activeMissions — missions never inflate Life Score. */
export function computeLifeScore(inputs: LifeScoreInputs): number {
  return deriveLifeScoreFromCategories(inputs.categoryScores, { streakDays: inputs.streakDays });
}

export function consistencyModifier(streakDays: number): number {
  if (streakDays <= 0)  return 0;
  if (streakDays >= 90) return MAX_CONSISTENCY_BONUS;
  if (streakDays >= 30) return 0.35 + ((streakDays - 30) / 60) * 0.05;
  return Math.min(0.35, streakDays * (0.35 / 30));
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
   3b. MISSION PROGRESSION — protocols, not instant buttons
   ────────────────────────────────────────────────────────────────── */

/** Days that must be completed before a mission can finish. Falls back to the
 *  content `duration`, then to 1 (a single-day mission). */
export function requiredDaysForMission(m: Mission): number {
  return m.requiredDays ?? m.duration ?? 1;
}

/** True when the mission has met its required completed-day count (or is a
 *  single-day mission). The only gate for completion. */
export function isMissionComplete(m: Mission): boolean {
  const required = requiredDaysForMission(m);
  if (required <= 1) return true;
  return (m.daysCompleted ?? 0) >= required;
}

/** 0–100 progress based on completed days vs required days. */
export function missionProgressPct(m: Mission): number {
  const required = requiredDaysForMission(m);
  if (required <= 1) return 100;
  return clamp(Math.round(((m.daysCompleted ?? 0) / required) * 100), 0, 100);
}

/**
 * Apply a completed mission's reward to its OWNING category (clamped 0–10) and
 * return the new category array. Life Score is then re-derived from these
 * categories — the reward never touches the global score directly.
 */
export function applyMissionRewardToCategories(
  categories: CategoryScore[],
  mission: Mission,
): CategoryScore[] {
  const reward = mission.rewardScore ?? 0;
  return categories.map(c => {
    if (c.id !== mission.category) return c;
    const newValue = clamp(round1(c.value + reward), 0, 10);
    return { ...c, value: newValue, delta: round1(newValue - c.value) };
  });
}

/**
 * Register one day of progress for a mission on `date` (YYYY-MM-DD). Idempotent
 * per date: marking the same day twice does not double-count. Returns the
 * updated mission (status/category reward are handled by the caller on
 * completion).
 */
export function advanceMissionDay(m: Mission, date: string): Mission {
  const dates = m.completedDates ?? [];
  if (dates.includes(date)) return m; // already counted today
  const completedDates = [...dates, date];
  const daysCompleted = completedDates.length;
  return {
    ...m,
    completedDates,
    daysCompleted,
    lastProgressDate: date,
    progress: missionProgressPct({ ...m, daysCompleted }),
  };
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

/* ──────────────────────────────────────────────────────────────────
   8. RECONCILIATION — self-heal inconsistent persisted state
   ────────────────────────────────────────────────────────────────── */

/**
 * Recompute a persisted LifeScore from its categories (the source of truth).
 * `value`, `tier`, `nextRankAt` and `pbScore` are re-derived; `streak`,
 * `delta`, and `lastCheckIn` are preserved. Used on hydration to self-heal
 * users whose stored score was inflated by the old mission-completion bug
 * (score = prevScore + rewardScore).
 */
export function reconcileScore(score: LifeScore, categories: CategoryScore[]): LifeScore {
  if (!categories.length) return score;
  const value = deriveLifeScoreFromCategories(categories, { streakDays: score.streak });
  const tier = tierForScore(value);
  return {
    ...score,
    value,
    tier,
    nextRankAt: nextPromotionScore(tier),
    pbScore: Math.max(score.pbScore ?? 0, value),
  };
}
