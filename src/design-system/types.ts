// src/design-system/types.ts
// LifeRank type contracts. Imported across components, screens, and mock data.

/* ──────────────────────────────────────────────────────────────────────
   RANK
   ──────────────────────────────────────────────────────────────────── */

export type RankTierId =
  | 'unranked'      // pre-calibration
  | 'dormant'       // 0.0–2.9
  | 'unstable'      // 3.0–4.9
  | 'operational'   // 5.0–6.4
  | 'ascendant'     // 6.5–7.4
  | 'apex'          // 7.5–8.9
  | 'mythic'        // 9.0–9.5
  | 'zenith';       // 9.6–10.0

export interface RankTier {
  id: RankTierId;
  name: string;                // 'APEX'
  sublabel: string;            // 'TIER V'
  primary: string;             // hex — emblem center, primary CTA
  mid: string;                 // hex — gradient midstop
  far: string;                 // hex — gradient far stop
  accent: string;              // hex — secondary highlight
  glow1: string;               // rgba — top atmospheric glow
  glow2: string;               // rgba — second glow layer
  glow3: string;               // rgba — bottom glow
  barGlow: string;             // rgba — energy-bar drop shadow
  /** Short psychological description shown on rank detail + onboarding. */
  description: string;
  /** Copy shown to user when poised for promotion. */
  promotionCopy: string;
  /** Copy shown on demotion warning. */
  demotionCopy: string;
}

export interface RankMovementEvent {
  prevTier: RankTierId;
  newTier: RankTierId;
  /** -1 demotion, 0 hold, +1 promotion */
  direction: -1 | 0 | 1;
  prevScore: number;
  newScore: number;
  unlockedMissionIds?: string[];
}

export type StreakEventKind =
  | 'protected'        // user checked in just in time
  | 'broken'           // streak ended
  | 'milestone';       // 7 / 30 / 100 / 365 day mark

export interface StreakEvent {
  kind: StreakEventKind;
  /** Days at the moment of the event. */
  days: number;
  /** For 'broken' — what the streak was before. */
  previousDays?: number;
}

/* ──────────────────────────────────────────────────────────────────────
   CATEGORIES
   ──────────────────────────────────────────────────────────────────── */

export type CategoryId =
  | 'discipline'
  | 'style'
  | 'environment'
  | 'money'
  | 'career';

export type CategoryGlyph =
  | 'crosshair'
  | 'diamond'
  | 'node'
  | 'chart'
  | 'ascent';

export interface CategoryDescriptor {
  id: CategoryId;
  name: string;
  short: string;        // 3-letter code (DSC, STL...)
  accent: string;       // hex hue
  glyph: CategoryGlyph;
}

export interface CategoryScore {
  id: CategoryId;
  value: number;        // 0–10
  delta: number;        // delta vs previous check-in
  insight?: string;     // short sharp diagnostic line
}

/* ──────────────────────────────────────────────────────────────────────
   LIFE SCORE
   ──────────────────────────────────────────────────────────────────── */

export interface LifeScore {
  value: number;        // 0–10, one decimal
  delta: number;        // weekly movement
  tier: RankTierId;
  /** Score required to promote to the next tier. */
  nextRankAt: number;
  /** Days of unbroken check-in streak. */
  streak: number;
  /** Personal best score this quarter. */
  pbScore?: number;
  /** ISO timestamp of last check-in. */
  lastCheckIn?: string;
}

/* ──────────────────────────────────────────────────────────────────────
   CHECK-IN
   ──────────────────────────────────────────────────────────────────── */

export type CheckInTagId =
  | 'locked-in'
  | 'on-routine'
  | 'cold-shower'
  | 'deep-work'
  | 'no-screens'
  | 'training'
  | 'skipped-am'
  | 'off-plan';

export interface CheckInTag {
  id: CheckInTagId;
  label: string;
  positive: boolean;     // affects scoring contribution
}

export interface CheckInAnswer {
  category: CategoryId;
  score: number;         // 1–10
  tags: CheckInTagId[];
  voiceNoteUri?: string; // future
  textNote?: string;
}

export interface CheckInSession {
  startedAt: string;     // ISO
  answers: CheckInAnswer[];
  completed: boolean;
}

export interface ScoreSegment {
  min: number;
  max: number;
  label: string;
  desc: string;
  color: string;
}

/* ──────────────────────────────────────────────────────────────────────
   MISSIONS
   ──────────────────────────────────────────────────────────────────── */

export type MissionDifficulty = 1 | 2 | 3 | 4 | 5;

export type MissionStatus =
  | 'active'        // accepted, in progress
  | 'available'     // visible, not yet accepted
  | 'featured'      // visible + curated for the user
  | 'completed'    // done
  | 'failed'       // expired without completion
  | 'locked';      // gated behind tier/score

export interface MissionTask {
  id: string;
  label: string;
  done: boolean;
}

export interface Mission {
  id: string;               // 'OP-204'
  title: string;            // 'Silent Mornings'
  subtitle: string;         // '14-day · no screens before 9am'
  description?: string;
  difficulty: MissionDifficulty;
  /** Score reward on completion. */
  rewardScore: number;
  /** Optional XP/RP integer reward for ladder progression. */
  rewardRP?: number;
  /** Bound category — informs accent color. */
  category: CategoryId;
  /** Why the OS recommended this mission. */
  reason?: string;
  status: MissionStatus;
  /** 0–100. */
  progress?: number;
  tasks?: MissionTask[];
  /** Days. */
  duration?: number;
  /** Day count out of duration. */
  daysIn?: number;
  /** Tier required to unlock. */
  requiredTier?: RankTierId;
  endsAt?: string;          // ISO
}

/* ──────────────────────────────────────────────────────────────────────
   RESULTS / DIAGNOSIS
   ──────────────────────────────────────────────────────────────────── */

export interface RankMovement {
  prevScore: number;
  newScore: number;
  prevTier: RankTierId;
  newTier: RankTierId;
  promoted: boolean;
}

export interface Diagnosis {
  /** Strongest movement this check-in. */
  strongest: { category: CategoryId; delta: number };
  /** Weakest / regressed area. */
  weakest:   { category: CategoryId; delta: number };
  /** Imbalance warning if largest gap > threshold. */
  imbalance?: { gap: number; high: CategoryId; low: CategoryId };
  /** AI/OS narrative — 1–2 short sentences. */
  narrative: string;
  /** Recommended next mission id. */
  nextMissionId?: string;
}

/* ──────────────────────────────────────────────────────────────────────
   BUILD / ARCHETYPE
   ──────────────────────────────────────────────────────────────────── */

export type UserBuildId =
  | 'operator'        // balanced discipline + career
  | 'aesthete'        // style + environment heavy
  | 'monk'            // discipline + reflection
  | 'capital'         // money + career
  | 'broadcaster'     // career + style
  | 'wildcard';       // novel / outlier distribution

export interface UserBuild {
  id: UserBuildId;
  name: string;                // 'The Operator'
  tagline: string;             // 'Disciplined output above all'
  /** Categories that define this build. */
  primary: CategoryId[];
  /** Bar 0-1 telling user how dominant each category is in their build. */
  signature: Record<CategoryId, number>;
}

/* ──────────────────────────────────────────────────────────────────────
   STATS / TELEMETRY
   ──────────────────────────────────────────────────────────────────── */

export type StatRange = 'W' | 'M' | '3M' | 'Y' | 'ALL';

export interface StatDelta {
  label: string;
  value: string;
  delta?: string;
  color?: string;
}

export interface ScorePoint {
  date: string;     // ISO date
  score: number;
}

export interface PersonalRecord {
  label: string;
  value: string;
  delta: string;
  color: string;
}

/* ──────────────────────────────────────────────────────────────────────
   SHARE
   ──────────────────────────────────────────────────────────────────── */

export type ShareLayout = 'poster' | 'minimal' | 'badge';
export type ShareFormat = 'story' | 'square' | 'wide';

export interface ShareCardConfig {
  layout: ShareLayout;
  format: ShareFormat;
  showScore: boolean;
  showCategories: boolean;
  showStreak: boolean;
  showHandle: boolean;
  showQR: boolean;
  /** Optional headline override — defaults vary per layout. */
  headline?: string;
}

/* ──────────────────────────────────────────────────────────────────────
   APP SCREENS
   ──────────────────────────────────────────────────────────────────── */

export type AppScreenName =
  | 'onboarding'
  | 'calibration'
  | 'calibration-results'
  | 'home'
  | 'checkin'
  | 'results'
  | 'missions'
  | 'mission-detail'
  | 'mission-complete'
  | 'mission-failed'
  | 'rank-promotion'
  | 'rank-demotion'
  | 'category-detail'
  | 'logbook'
  | 'stats'
  | 'share'
  | 'profile'
  | 'settings'
  | 'notifications'
  | 'weekly-report'
  | 'styleguide';

export type TabScreenName = 'home' | 'missions' | 'checkin' | 'stats' | 'share';

/* ──────────────────────────────────────────────────────────────────────
   SYSTEM SIGNALS
   ──────────────────────────────────────────────────────────────────── */

export type SystemSignalId = 'momentum' | 'control' | 'friction';

export interface SystemSignal {
  id: SystemSignalId;
  label: string;
  value: number;
  display: string;
  color: string;
  derivation: string;
}

/* ──────────────────────────────────────────────────────────────────────
   NOTIFICATIONS
   ──────────────────────────────────────────────────────────────────── */

export type LRNotificationKind =
  | 'mission-reminder'
  | 'rank-warning'
  | 'weekly-report'
  | 'streak-risk'
  | 'mission-unlocked'
  | 'promotion'
  | 'demotion';

export interface LRNotification {
  id: string;
  kind: LRNotificationKind;
  title: string;
  body: string;
  at: string;
  cta?: { label: string; to: AppScreenName };
  read?: boolean;
  accent?: string;
}

/* ──────────────────────────────────────────────────────────────────────
   LOGBOOK ENTRY
   ──────────────────────────────────────────────────────────────────── */

export interface LogbookEntry {
  date: string;          // ISO date 'YYYY-MM-DD'
  lifeScore: number;
  delta: number;
  categoryScores: CategoryScore[];
  tags: string[];
  note?: string;
  completedMissionIds?: string[];
  rankTier: RankTierId;
  streakDay: number;
}

/* ──────────────────────────────────────────────────────────────────────
   WEEKLY REPORT
   ──────────────────────────────────────────────────────────────────── */

export interface WeeklyReport {
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  startScore: number;
  endScore: number;
  delta: number;
  strongest: CategoryId;
  weakest: CategoryId;
  completedMissions: number;
  missedCheckIns: number;
  rankStability: 'rising' | 'holding' | 'falling' | 'volatile';
  recommendedFocus: CategoryId;
  narrative: string;
}

/* ──────────────────────────────────────────────────────────────────────
   CALIBRATION
   ──────────────────────────────────────────────────────────────────── */

export interface CalibrationAnswer {
  category: CategoryId;
  score: number;
  tags: string[];
}

export interface CalibrationResult {
  initialScore: number;
  initialTier: RankTierId;
  strongest: CategoryScore;
  weakest: CategoryScore;
  build: UserBuild;
  firstMissionId: string;
  narrative: string;
}

/* ──────────────────────────────────────────────────────────────────────
   USER SETTINGS — privacy + notification toggles (cloud-persisted)
   Maps to the `user_settings` Supabase table.
   ──────────────────────────────────────────────────────────────────── */

export interface UserSettings {
  shareScoreVisible: boolean;
  shareCategoriesVisible: boolean;
  notifMissionReminder: boolean;
  notifStreakRisk: boolean;
  notifWeeklyReport: boolean;
  notifRankChange: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  shareScoreVisible: true,
  shareCategoriesVisible: true,
  notifMissionReminder: true,
  notifStreakRisk: true,
  notifWeeklyReport: true,
  notifRankChange: true,
};

/* ──────────────────────────────────────────────────────────────────────
   USER
   ──────────────────────────────────────────────────────────────────── */

export interface UserState {
  handle: string;
  displayName: string;
  initial: string;
  score: LifeScore;
  build: UserBuild;
  categories: CategoryScore[];
  activeMissions: Mission[];
  recentDiagnosis?: Diagnosis;
}
