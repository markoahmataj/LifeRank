// src/design-system/mockData.ts
// Typed mock data — drives the design reference screens.

import type {
  LifeScore,
  CategoryScore,
  Mission,
  CheckInTag,
  Diagnosis,
  UserBuild,
  ScorePoint,
  PersonalRecord,
  UserState,
  ShareCardConfig,
  SystemSignal,
  LRNotification,
  LogbookEntry,
  WeeklyReport,
  CalibrationResult,
  CategoryId,
} from './types';

/* ──────────────────────────────────────────────────────────────────────
   LIFE SCORE
   ──────────────────────────────────────────────────────────────────── */
export const mockLifeScore: LifeScore = {
  value:      8.4,
  delta:      0.3,
  tier:       'apex',
  nextRankAt: 9.0,
  streak:     47,
  pbScore:    8.6,
  lastCheckIn: '2026-05-27T06:42:00.000Z',
};

/* ──────────────────────────────────────────────────────────────────────
   CATEGORY SCORES
   ──────────────────────────────────────────────────────────────────── */
export const mockCategoryScores: CategoryScore[] = [
  { id: 'discipline',  value: 8.7, delta: +0.2, insight: 'Strongest pillar. Hold the protocol.' },
  { id: 'style',       value: 7.9, delta: +0.1, insight: 'Trending up slowly. Add one upgrade.' },
  { id: 'environment', value: 8.2, delta: +0.4, insight: 'New space is paying off.' },
  { id: 'money',       value: 8.1, delta: +0.3, insight: 'Stable. Review investment ladder.' },
  { id: 'career',      value: 8.9, delta: +0.5, insight: 'Fastest mover this week.' },
];

/* ──────────────────────────────────────────────────────────────────────
   MISSIONS
   ──────────────────────────────────────────────────────────────────── */
export const mockActiveMissions: Mission[] = [
  {
    id: 'OP-118',
    title: 'Iron Week',
    subtitle: '7-day · zero-compromise protocol',
    difficulty: 4,
    rewardScore: 0.4,
    rewardRP: 250,
    category: 'discipline',
    reason: 'Compound week of high-output blocks.',
    status: 'active',
    progress: 64,
    daysIn: 5,
    duration: 7,
    endsAt: '2026-05-31T23:59:00.000Z',
    tasks: [
      { id: 't1', label: 'Morning protocol — 6:00 AM',     done: true },
      { id: 't2', label: 'Deep work block — 90 min',        done: true },
      { id: 't3', label: 'Strength session — 45 min',       done: false },
      { id: 't4', label: 'Reading block — 30 min',          done: false },
    ],
  },
  {
    id: 'OP-204',
    title: 'Silent Mornings',
    subtitle: '14-day · no screens before 9am',
    difficulty: 3,
    rewardScore: 0.3,
    rewardRP: 150,
    category: 'environment',
    status: 'active',
    progress: 42,
    daysIn: 6,
    duration: 14,
  },
];

export const mockAvailableMissions: Mission[] = [
  {
    id: 'OP-301',
    title: 'The Cold Forge',
    subtitle: '30-day · cold exposure protocol',
    difficulty: 5,
    rewardScore: 1.2,
    rewardRP: 800,
    category: 'discipline',
    reason: 'You handle high stress — push the ceiling.',
    status: 'featured',
  },
  {
    id: 'OP-072',
    title: 'Iron Diet',
    subtitle: '21-day · macro discipline',
    difficulty: 3,
    rewardScore: 0.6,
    rewardRP: 320,
    category: 'discipline',
    status: 'available',
  },
  {
    id: 'OP-046',
    title: 'Reading Block',
    subtitle: '7-day · 30 minutes daily',
    difficulty: 2,
    rewardScore: 0.3,
    rewardRP: 100,
    category: 'career',
    status: 'available',
  },
  {
    id: 'OP-512',
    title: 'Sub-3-Hour Marathon',
    subtitle: 'Unlocks at Zenith tier',
    difficulty: 5,
    rewardScore: 2.5,
    rewardRP: 1500,
    category: 'discipline',
    status: 'locked',
    requiredTier: 'zenith',
  },
];

export const mockCompletedMissions: Mission[] = [
  {
    id: 'OP-088',
    title: 'Inbox Zero Week',
    subtitle: '7-day · daily inbox clear',
    difficulty: 2,
    rewardScore: 0.2,
    category: 'career',
    status: 'completed',
    progress: 100,
  },
];

/* ──────────────────────────────────────────────────────────────────────
   CHECK-IN TAGS
   ──────────────────────────────────────────────────────────────────── */
export const mockCheckInTags: CheckInTag[] = [
  { id: 'locked-in',   label: 'Locked in',       positive: true  },
  { id: 'on-routine',  label: 'On routine',      positive: true  },
  { id: 'cold-shower', label: 'Cold shower',     positive: true  },
  { id: 'deep-work',   label: 'Deep work',       positive: true  },
  { id: 'no-screens',  label: 'No screens AM',   positive: true  },
  { id: 'training',    label: 'Trained hard',    positive: true  },
  { id: 'skipped-am',  label: 'Skipped morning', positive: false },
  { id: 'off-plan',    label: 'Off plan',        positive: false },
];

export const CHECKIN_PROMPTS: Record<string, string> = {
  discipline:  'How was your discipline today?',
  style:       'How was your style execution?',
  environment: 'How is your environment serving you?',
  money:       'How was your money control today?',
  career:      'How was your career output today?',
};

/* ──────────────────────────────────────────────────────────────────────
   DIAGNOSIS
   ──────────────────────────────────────────────────────────────────── */
export const mockDiagnosis: Diagnosis = {
  strongest: { category: 'career',      delta: +0.5 },
  weakest:   { category: 'style',       delta: +0.1 },
  imbalance: { gap: 1.0, high: 'career', low: 'style' },
  narrative:
    'Career Progress is moving fastest this week (+0.5). ' +
    'Reinforce the deep-work block tomorrow morning to stack the momentum into a promotion window.',
  nextMissionId: 'OP-301',
};

/* ──────────────────────────────────────────────────────────────────────
   BUILD / ARCHETYPE
   ──────────────────────────────────────────────────────────────────── */
export const mockBuild: UserBuild = {
  id: 'operator',
  name: 'The Operator',
  tagline: 'Disciplined output above all',
  primary: ['discipline', 'career'],
  signature: {
    discipline:  0.95,
    career:      0.92,
    money:       0.78,
    environment: 0.72,
    style:       0.58,
  },
};

/* ──────────────────────────────────────────────────────────────────────
   TREND — 30 data points
   ──────────────────────────────────────────────────────────────────── */
export const mockTrend30D: ScorePoint[] = [
  7.1, 7.0, 7.2, 7.3, 7.2, 7.5, 7.6, 7.4, 7.6, 7.7,
  7.8, 7.7, 7.9, 8.0, 7.9, 8.0, 8.1, 8.0, 8.2, 8.1,
  8.0, 8.2, 8.3, 8.2, 8.3, 8.4, 8.3, 8.4, 8.3, 8.4,
].map((score, i) => {
  const d = new Date('2026-05-27T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - (29 - i));
  return { date: d.toISOString().slice(0, 10), score };
});

/* ──────────────────────────────────────────────────────────────────────
   PERSONAL RECORDS
   ──────────────────────────────────────────────────────────────────── */
export const mockPersonalRecords: PersonalRecord[] = [
  { label: 'LONGEST STREAK', value: '47d',  delta: '↑ from 31',           color: '#FF2D5C' },
  { label: 'HIGHEST SCORE',  value: '8.6',  delta: '14 Nov',              color: '#22D3EE' },
  { label: 'MISSIONS / MO',  value: '6',    delta: '↑ from 4',            color: '#C026D3' },
  { label: 'RANK PROMOS',    value: '2',    delta: 'Ascendant → Apex',    color: '#7C3AED' },
];

/* ──────────────────────────────────────────────────────────────────────
   SHARE
   ──────────────────────────────────────────────────────────────────── */
export const defaultShareConfig: ShareCardConfig = {
  layout: 'poster',
  format: 'story',
  showScore: true,
  showCategories: true,
  showStreak: true,
  showHandle: true,
  showQR: false,
};

export const SHARE_HEADLINES = {
  poster:  'I entered ranked mode for real life.',
  minimal: 'Life Score · 8.4',
  badge:   'Operation Complete · Iron Week',
} as const;

/* ──────────────────────────────────────────────────────────────────────
   USER
   ──────────────────────────────────────────────────────────────────── */
export const mockUser: UserState = {
  handle:      '@kai.os',
  displayName: 'Kai',
  initial:     'K',
  score:        mockLifeScore,
  build:        mockBuild,
  categories:   mockCategoryScores,
  activeMissions: mockActiveMissions,
  recentDiagnosis: mockDiagnosis,
};

/* ──────────────────────────────────────────────────────────────────────
   VITALS (kept for legacy references in design screens)
   ──────────────────────────────────────────────────────────────────── */
export const mockVitals: Array<{ label: string; value: string; dot: string }> = [
  { label: 'HRV',    value: '68ms', dot: '#34d399' },
  { label: 'Focus',  value: '92%',  dot: '#22D3EE' },
  { label: 'Energy', value: 'HI',   dot: '#FF2D5C' },
];

/* ──────────────────────────────────────────────────────────────────────
   QUICK ACTIONS
   ──────────────────────────────────────────────────────────────────── */
export const mockQuickActions = [
  { id: 'log-win',  label: 'Log Win',  color: '#FF2D5C' },
  { id: 'checkin',  label: 'Check-In', color: '#22D3EE' },
  { id: 'compete',  label: 'Compete',  color: '#C026D3' },
  { id: 'reflect',  label: 'Reflect',  color: '#7C3AED' },
] as const;

/* ──────────────────────────────────────────────────────────────────────
   SYSTEM SIGNALS
   ──────────────────────────────────────────────────────────────────── */
export const mockSystemSignals: SystemSignal[] = [
  {
    id: 'momentum',
    label: 'Momentum',
    value: 84,
    display: 'HI',
    color: '#34d399',
    derivation: '7-day Life-Score slope · +0.3 this week',
  },
  {
    id: 'control',
    label: 'Control',
    value: 92,
    display: '92',
    color: '#22D3EE',
    derivation: 'Check-in consistency · 12/14 last cycle',
  },
  {
    id: 'friction',
    label: 'Friction',
    value: 18,
    display: 'LOW',
    color: '#FF2D5C',
    derivation: 'Missed routines + abandoned missions',
  },
];

/* ──────────────────────────────────────────────────────────────────────
   NOTIFICATIONS
   ──────────────────────────────────────────────────────────────────── */
export const mockNotifications: LRNotification[] = [
  {
    id: 'n-1', kind: 'mission-reminder',
    title: 'Iron Week · Day 5/7',
    body: 'Strength session pending. 2 tasks remain before midnight.',
    at: '2026-05-27T10:00:00.000Z',
    cta: { label: 'Open Operation', to: 'mission-detail' },
    accent: '#FF2D5C',
  },
  {
    id: 'n-2', kind: 'streak-risk',
    title: 'Streak at risk',
    body: 'No check-in logged today. 47-day streak ends at 23:59.',
    at: '2026-05-27T18:30:00.000Z',
    cta: { label: 'Check-In Now', to: 'checkin' },
    accent: '#FBBF24',
  },
  {
    id: 'n-3', kind: 'mission-unlocked',
    title: 'New operation available',
    body: 'OP-301 · The Cold Forge — unlocked by Apex tier.',
    at: '2026-05-26T08:15:00.000Z',
    cta: { label: 'Inspect', to: 'mission-detail' },
    accent: '#22D3EE',
    read: true,
  },
  {
    id: 'n-4', kind: 'weekly-report',
    title: 'Weekly report ready',
    body: 'Week 48 telemetry compiled. +0.3 score · best week Q4.',
    at: '2026-05-25T06:00:00.000Z',
    cta: { label: 'Review Week', to: 'weekly-report' },
    accent: '#C026D3',
    read: true,
  },
  {
    id: 'n-5', kind: 'promotion',
    title: 'Promotion · Ascendant → Apex',
    body: 'You crossed 7.5. Tier V unlocked. New missions available.',
    at: '2026-05-18T07:42:00.000Z',
    cta: { label: 'View Rank', to: 'rank-promotion' },
    accent: '#FF2D5C',
    read: true,
  },
];

/* ──────────────────────────────────────────────────────────────────────
   LOGBOOK
   ──────────────────────────────────────────────────────────────────── */
export const mockLogbook: LogbookEntry[] = (() => {
  const entries: LogbookEntry[] = [];
  const today = new Date('2026-05-27T00:00:00Z');
  const scores = [8.4, 8.3, 8.4, 8.3, 8.2, 8.3, 8.2, 8.1, 8.0, 8.2, 8.1, 8.0, 7.9, 8.0];
  for (let i = 0; i < scores.length; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const lifeScore = scores[i];
    entries.push({
      date: d.toISOString().slice(0, 10),
      lifeScore,
      delta: i === scores.length - 1 ? 0 : +(lifeScore - scores[i + 1]).toFixed(1),
      categoryScores: mockCategoryScores.map(c => ({
        ...c,
        value: +(c.value + (Math.sin(i + c.id.length) * 0.3)).toFixed(1),
      })),
      tags: i % 3 === 0 ? ['locked-in', 'deep-work'] : i % 5 === 0 ? ['off-plan'] : ['on-routine'],
      note: i === 0 ? 'Iron Week Day 5. Strength block pending.' : undefined,
      completedMissionIds: i === 2 ? ['OP-088'] : undefined,
      rankTier: lifeScore >= 7.5 ? 'apex' : 'ascendant',
      streakDay: 47 - i,
    });
  }
  return entries;
})();

/* ──────────────────────────────────────────────────────────────────────
   WEEKLY REPORT
   ──────────────────────────────────────────────────────────────────── */
export const mockWeeklyReport: WeeklyReport = {
  weekNumber: 48,
  year: 2026,
  startDate: '2026-05-19',
  endDate:   '2026-05-25',
  startScore: 8.1,
  endScore:   8.4,
  delta:      0.3,
  strongest:  'career',
  weakest:    'style',
  completedMissions: 2,
  missedCheckIns:    0,
  rankStability:    'rising',
  recommendedFocus: 'style',
  narrative:
    "Career Progress drove this week's movement (+0.5). " +
    "Style remains the slowest pillar. Add one curated upgrade " +
    "next cycle to unblock the build.",
};

/* ──────────────────────────────────────────────────────────────────────
   CALIBRATION RESULT
   ──────────────────────────────────────────────────────────────────── */
export const mockCalibrationResult: CalibrationResult = {
  initialScore: 6.4,
  initialTier:  'operational',
  strongest:    { id: 'career',     value: 7.8, delta: 0 },
  weakest:      { id: 'style',      value: 5.1, delta: 0 },
  build:        mockBuild,
  firstMissionId: 'OP-046',
  narrative:
    'You enter at Operational · Tier III. Strong career signal, ' +
    'weak style execution. The system has assigned a 7-day reading ' +
    'protocol to compound the gain.',
};

/* ──────────────────────────────────────────────────────────────────────
   PROFILE
   ──────────────────────────────────────────────────────────────────── */
export const mockProfile = {
  handle:       '@kai.os',
  displayName:  'Kai',
  initial:      'K',
  joinedAt:     '2026-01-04',
  rankTier:     'apex' as const,
  buildId:      'operator' as const,
  personalBest: 8.6,
  longestStreak: 47,
  completedOperations: 23,
  favoriteCategory:    'discipline' as CategoryId,
  totalCheckIns: 186,
  rankPromotions: 2,
};

/* ──────────────────────────────────────────────────────────────────────
   MISSION DETAIL — rules
   ──────────────────────────────────────────────────────────────────── */
export const mockMissionRules: Record<string, string[]> = {
  'OP-118': [
    'Wake before 06:00 every day.',
    'No screens until the deep-work block ends.',
    'One strength session per day, 45 min minimum.',
    'No caffeine after 14:00.',
    'Reading block before sleep — 30 minutes.',
  ],
  'OP-204': [
    'No screens between 00:00–09:00.',
    'Phone outside the bedroom by 22:00.',
    'Mornings are for written planning only.',
  ],
  'OP-301': [
    'One cold exposure session daily — 3 minutes minimum.',
    'Track entry temperature and duration.',
    'Skipping a day resets streak but not progress.',
    'Failure to complete 25 of 30 days = mission failure.',
  ],
};

/* ──────────────────────────────────────────────────────────────────────
   COMPLETION / FAILURE SAMPLES
   ──────────────────────────────────────────────────────────────────── */
export const mockCompletionSample = {
  missionId: 'OP-118',
  title:     'Iron Week',
  category:  'discipline' as CategoryId,
  rewardScore: 0.4,
  rewardRP:    250,
  prevScore:   8.1,
  newScore:    8.4,
  prevTier:    'apex' as const,
  newTier:     'apex' as const,
  streakDays:  47,
  streakKept:  true,
};

export const mockFailureSample = {
  missionId: 'OP-204',
  title:     'Silent Mornings',
  category:  'environment' as CategoryId,
  missedDays: 3,
  scoreImpact: -0.2,
  streakBroken: false,
  recoveryMissionId: 'OP-046',
};

/* ──────────────────────────────────────────────────────────────────────
   RANK PROMOTION / DEMOTION SAMPLES
   ──────────────────────────────────────────────────────────────────── */
export const mockPromotionSample = {
  prevTier: 'ascendant' as const,
  newTier:  'apex' as const,
  prevScore: 7.4,
  newScore:  7.5,
  unlockedMissionIds: ['OP-301', 'OP-512'],
  narrative:
    'You cleared 7.5. Apex unlocks higher-stake operations. ' +
    'Difficulty floor rises — so does the ceiling.',
};

export const mockDemotionRiskSample = {
  currentTier: 'apex' as const,
  fallTo:      'ascendant' as const,
  currentScore: 7.6,
  fallAt:      7.5,
  recoveryMissionId: 'OP-118',
};
