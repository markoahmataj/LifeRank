// src/store/AppContext.tsx
// React Context + useReducer — global app state.
// No third-party state library. Persists to AsyncStorage on every change.

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  LifeScore,
  CategoryScore,
  Mission,
  LogbookEntry,
  UserBuild,
  CategoryId,
  RankTierId,
  UserSettings,
} from '../design-system/types';
import { DEFAULT_USER_SETTINGS } from '../design-system/types';
import { applyCheckIn, tierForScore, nextPromotionScore, rpForMissionComplete, deriveLifeScoreFromCategories, reconcileScore, requiredDaysForMission, isMissionComplete, applyMissionRewardToCategories, advanceMissionDay, type ApplyCheckInResult } from '../design-system/scoringModel';
import * as Storage from '../storage/appStorage';
import { supabase } from '../lib/supabase';
import * as Sync from '../services/liferankSync';
import { CATEGORY_ORDER } from '../design-system/tokens';
import { mockBuild } from '../design-system/mockData';

/* ──────────────────────────────────────────────────────────────────────
   STATE SHAPE
   ──────────────────────────────────────────────────────────────────── */
export interface AppState {
  /** False = show onboarding. True = show main app. */
  isCalibrated: boolean;
  isHydrated: boolean;
  handle: string;
  displayName: string;
  initial: string;
  joinedAt?: string;
  score: LifeScore;
  categories: CategoryScore[];
  activeMissions: Mission[];
  completedMissions: Mission[];
  build: UserBuild;
  rp: number;
  logbook: LogbookEntry[];
  settings: UserSettings;
}

const INITIAL_SCORE: LifeScore = {
  value: 0,
  delta: 0,
  tier: 'dormant',
  nextRankAt: 3.0,
  streak: 0,
};

const initialState: AppState = {
  isCalibrated: false,
  isHydrated: false,
  handle: '@you',
  displayName: 'You',
  initial: 'Y',
  joinedAt: undefined,
  score: INITIAL_SCORE,
  categories: CATEGORY_ORDER.map(id => ({ id, value: 5, delta: 0 })),
  activeMissions: [],
  completedMissions: [],
  build: mockBuild,
  rp: 0,
  logbook: [],
  settings: DEFAULT_USER_SETTINGS,
};

/* ──────────────────────────────────────────────────────────────────────
   ACTIONS
   ──────────────────────────────────────────────────────────────────── */
export type AppAction =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'CALIBRATE'; payload: { score: LifeScore; categories: CategoryScore[]; build: UserBuild; handle: string; displayName: string } }
  | { type: 'SUBMIT_CHECKIN'; payload: { rawRatings: Record<CategoryId, number>; tags?: string[]; note?: string; missionDaily?: Record<string, boolean> } }
  | { type: 'ACCEPT_MISSION'; payload: Mission }
  | { type: 'ABANDON_MISSION'; payload: { missionId: string } }
  | { type: 'COMPLETE_MISSION'; payload: { missionId: string } }
  | { type: 'TOGGLE_MISSION_TASK'; payload: { missionId: string; taskId: string } }
  | { type: 'ADD_RP'; payload: number }
  | { type: 'ADD_LOGBOOK_ENTRY'; payload: LogbookEntry }
  | { type: 'SET_HANDLE'; payload: string }
  | { type: 'SET_DISPLAY_NAME'; payload: string }
  | { type: 'SET_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'RESET' };

/* ──────────────────────────────────────────────────────────────────────
   CHECK-IN BUILDER — shared by the reducer and the submitCheckIn helper so
   both produce identical results. Enforces one check-in per calendar day:
   a same-day re-submission EDITS today's entry in place rather than adding a
   new one, and does not re-increment the streak or re-award RP.
   ──────────────────────────────────────────────────────────────────── */
interface CheckInOutcome {
  /** next / nextCategoryScores / rpEarned all reflect FINAL post-mission values. */
  result: ApplyCheckInResult;
  entry: LogbookEntry;
  rpEarned: number;
  isResubmit: boolean;
  prevScore: number;
  prevTier: RankTierId;
  nextLogbook: LogbookEntry[];
  nextRp: number;
  nextActiveMissions: Mission[];
  nextCompletedMissions: Mission[];
  /** Missions that finished during THIS submission (for mission_events + UI). */
  newlyCompletedMissions: Mission[];
}

const round1 = (v: number): number => Math.round(v * 10) / 10;

/**
 * Advance active-mission progress for a single day's check-in.
 *
 * - A mission marked done today advances by one day (idempotent per date via
 *   completedDates) and completes when it reaches requiredDays.
 * - `newlyCompleted` finished during THIS submit; their reward is not yet in the
 *   categories, so it is always applied.
 * - `alreadyToday` finished earlier today (e.g. a manual completion). Whether to
 *   re-apply their reward depends on the baseline the caller is recomputing from
 *   (see buildCheckIn), so they are returned separately.
 */
function processCheckInMissions(
  active: Mission[],
  completed: Mission[],
  missionDaily: Record<string, boolean> | undefined,
  today: string,
): {
  nextActive: Mission[];
  nextCompleted: Mission[];
  alreadyToday: Mission[];
  newlyCompleted: Mission[];
} {
  const newlyCompleted: Mission[] = [];
  const nextActive: Mission[] = [];

  for (const m of active) {
    const doneToday = missionDaily?.[m.id] === true;
    const advanced = doneToday ? advanceMissionDay(m, today) : m;
    if (doneToday && isMissionComplete(advanced)) {
      newlyCompleted.push({ ...advanced, status: 'completed' as const });
    } else {
      nextActive.push(advanced);
    }
  }

  const alreadyToday = completed.filter(m => (m.completedDates ?? []).includes(today));

  const nextCompleted = [
    ...completed,
    ...newlyCompleted.filter(nc => !completed.some(c => c.id === nc.id)),
  ];

  return { nextActive, nextCompleted, alreadyToday, newlyCompleted };
}

function buildCheckIn(
  state: AppState,
  payload: { rawRatings: Record<CategoryId, number>; tags?: string[]; note?: string; missionDaily?: Record<string, boolean> },
): CheckInOutcome {
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = state.logbook[0]?.date === today ? state.logbook[0] : undefined;
  // A same-day re-submission edits today's CHECK-IN entry. A mission-only entry
  // for today (a completion logged before any check-in) is replaced by this first
  // real check-in, so streak/RP still apply normally rather than being skipped.
  const isResubmit = !!todayEntry && todayEntry.source !== 'mission';

  // The state this check-in is applied against. On a same-day edit we use the
  // snapshot from *before* today's first check-in (the previous logbook entry)
  // so the category EMA and streak are never applied twice.
  const priorEntry = isResubmit ? state.logbook[1] : undefined;
  const baselineCategories = priorEntry ? priorEntry.categoryScores : state.categories;
  const prevScore = priorEntry ? priorEntry.lifeScore : state.score.value;
  const prevTier = priorEntry ? priorEntry.rankTier : state.score.tier;

  // For a re-submission, hold the streak steady. applyCheckIn increments from
  // current.streak when the last check-in is within the grace window, so feed
  // it streak-1 to land back on the same number.
  const baselineScore: LifeScore = isResubmit
    ? { ...state.score, value: prevScore, streak: Math.max(0, state.score.streak - 1) }
    : state.score;

  // 1. Category EMA + streak from the raw ratings (life score recomputed below).
  const ema = applyCheckIn({
    current: baselineScore,
    rawRatings: payload.rawRatings,
    previousCategoryScores: baselineCategories,
    activeMissions: state.activeMissions,
  });

  // 2. Advance active-mission progress for today and collect category rewards.
  const { nextActive, nextCompleted, alreadyToday, newlyCompleted } =
    processCheckInMissions(state.activeMissions, state.completedMissions, payload.missionDaily, today);

  // Which mission rewards to apply to the EMA categories:
  //  - First check-in of the day: the baseline is `state.categories`, which already
  //    contains any reward applied earlier today (e.g. a manual completion). Only
  //    apply rewards for missions completing right now.
  //  - Re-submission: the baseline is the PRIOR day's snapshot (pre-today), so all
  //    of today's mission rewards must be re-applied or they would be dropped.
  const rewardMissions = isResubmit
    ? [...newlyCompleted, ...alreadyToday]
    : [...newlyCompleted];

  // 3. Apply mission rewards on top of the EMA categories, then re-derive score.
  const finalCategories = rewardMissions.reduce(
    (cats, m) => applyMissionRewardToCategories(cats, m),
    ema.nextCategoryScores,
  );
  const lifeValue = deriveLifeScoreFromCategories(finalCategories, { streakDays: ema.next.streak });
  const finalTier = tierForScore(lifeValue);
  const finalScore: LifeScore = {
    ...ema.next,
    value: lifeValue,
    delta: round1(lifeValue - prevScore),
    tier: finalTier,
    nextRankAt: nextPromotionScore(finalTier),
    pbScore: Math.max(ema.next.pbScore ?? 0, lifeValue),
  };

  // 4. RP: check-in RP only on the first submission of the day; mission-completion
  //    RP whenever a mission newly completes (idempotent — completed missions leave
  //    the active list and can't re-complete).
  const checkinRP = isResubmit ? 0 : ema.rpEarned;
  const missionRP = newlyCompleted.reduce((sum, m) => sum + rpForMissionComplete(m), 0);
  const rpEarned = checkinRP + missionRP;

  const result: ApplyCheckInResult = {
    next: finalScore,
    nextCategoryScores: finalCategories,
    rpEarned,
  };

  // Merge mission-completion ids onto the day's entry (preserve any already there).
  const completedIds = Array.from(new Set([
    ...(todayEntry?.completedMissionIds ?? []),
    ...newlyCompleted.map(m => m.id),
  ]));

  const entry: LogbookEntry = {
    date: today,
    lifeScore: finalScore.value,
    delta: finalScore.delta,
    categoryScores: finalCategories,
    tags: payload.tags ?? [],
    note: payload.note,
    rankTier: finalScore.tier,
    streakDay: finalScore.streak,
    completedMissionIds: completedIds.length ? completedIds : undefined,
    missionDaily: payload.missionDaily,
    source: 'checkin',
  };

  // Replace today's existing entry (a check-in re-submit or a mission-only entry);
  // otherwise prepend a fresh one.
  const nextLogbook = todayEntry
    ? [entry, ...state.logbook.slice(1)]
    : [entry, ...state.logbook];

  return {
    result,
    entry,
    rpEarned,
    isResubmit,
    prevScore,
    prevTier,
    nextLogbook,
    nextRp: state.rp + rpEarned,
    nextActiveMissions: nextActive,
    nextCompletedMissions: nextCompleted,
    newlyCompletedMissions: newlyCompleted,
  };
}

/* ──────────────────────────────────────────────────────────────────────
   REDUCER
   ──────────────────────────────────────────────────────────────────── */
function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE': {
      const merged: AppState = { ...state, ...action.payload, isHydrated: true };
      // Life Score is derived from categories. Reconcile on load so any user
      // whose stored score was inflated by the old mission bug self-heals; the
      // write-through effect then persists the corrected score/tier.
      if (merged.categories && merged.categories.length) {
        merged.score = reconcileScore(merged.score, merged.categories);
      }
      return merged;
    }

    case 'CALIBRATE': {
      const { score, categories, build, handle, displayName } = action.payload;
      return {
        ...state,
        isCalibrated: true,
        score,
        categories,
        build,
        handle,
        displayName,
        initial: displayName.charAt(0).toUpperCase(),
      };
    }

    case 'SUBMIT_CHECKIN': {
      const { result, nextLogbook, nextRp, nextActiveMissions, nextCompletedMissions } = buildCheckIn(state, action.payload);
      return {
        ...state,
        score: result.next,
        categories: result.nextCategoryScores,
        activeMissions: nextActiveMissions,
        completedMissions: nextCompletedMissions,
        rp: nextRp,
        logbook: nextLogbook,
      };
    }

    case 'ACCEPT_MISSION':
      return {
        ...state,
        // Accepting STARTS a protocol; it does not touch Life Score and cannot be
        // completed until requiredDays of progress are logged.
        activeMissions: [
          ...state.activeMissions,
          {
            ...action.payload,
            status: 'active',
            daysIn: 0,
            daysCompleted: 0,
            progress: 0,
            requiredDays: requiredDaysForMission(action.payload),
            completedDates: [],
          },
        ],
      };

    case 'ABANDON_MISSION':
      return {
        ...state,
        activeMissions: state.activeMissions.filter(m => m.id !== action.payload.missionId),
      };

    case 'COMPLETE_MISSION': {
      const mission = state.activeMissions.find(m => m.id === action.payload.missionId);
      if (!mission) {
        return {
          ...state,
          activeMissions: state.activeMissions.filter(m => m.id !== action.payload.missionId),
        };
      }
      // Gate: a multi-day protocol can only finish once requiredDays are met.
      // Defensive — the Mission Detail CTA already enforces this. No-op otherwise.
      if (!isMissionComplete(mission)) {
        return state;
      }

      const prevScore  = state.score.value;
      const rewardRP    = rpForMissionComplete(mission);
      // Reward goes to the OWNING CATEGORY (clamped 0–10); Life Score then
      // re-derives from categories. The global score is never bumped directly.
      const nextCategories = applyMissionRewardToCategories(state.categories, mission);
      const newScore    = deriveLifeScoreFromCategories(nextCategories, { streakDays: state.score.streak });
      const newTier     = tierForScore(newScore);
      const newDelta    = Math.round((newScore - prevScore) * 10) / 10;
      const newPbScore  = Math.max(state.score.pbScore ?? 0, newScore);
      const alreadyDone = state.completedMissions.some(m => m.id === action.payload.missionId);

      // Record the completion in the day's progression history (logbook).
      const today = new Date().toISOString().slice(0, 10);
      const todayEntry = state.logbook[0]?.date === today ? state.logbook[0] : undefined;
      let nextLogbook = state.logbook;
      if (todayEntry) {
        const ids = todayEntry.completedMissionIds ?? [];
        if (!ids.includes(mission.id)) {
          nextLogbook = [
            { ...todayEntry, completedMissionIds: [...ids, mission.id], categoryScores: nextCategories },
            ...state.logbook.slice(1),
          ];
        }
      } else {
        // No check-in yet today — write a lightweight mission-only entry so the
        // completion still appears in the logbook. The day's first check-in
        // replaces it (carrying these ids forward) via buildCheckIn.
        const synthetic: LogbookEntry = {
          date: today,
          lifeScore: newScore,
          delta: 0,
          categoryScores: nextCategories,
          tags: [],
          rankTier: newTier,
          streakDay: state.score.streak,
          completedMissionIds: [mission.id],
          source: 'mission',
        };
        nextLogbook = [synthetic, ...state.logbook];
      }

      return {
        ...state,
        categories: nextCategories,
        activeMissions: state.activeMissions.filter(m => m.id !== action.payload.missionId),
        completedMissions: alreadyDone
          ? state.completedMissions
          : [...state.completedMissions, { ...mission, status: 'completed' as const }],
        score: {
          ...state.score,
          value:      newScore,
          delta:      newDelta,
          tier:       newTier,
          nextRankAt: nextPromotionScore(newTier),
          pbScore:    newPbScore,
        },
        rp: state.rp + rewardRP,
        logbook: nextLogbook,
      };
    }

    case 'TOGGLE_MISSION_TASK':
      return {
        ...state,
        activeMissions: state.activeMissions.map(m => {
          if (m.id !== action.payload.missionId) return m;
          const tasks = m.tasks?.map(t =>
            t.id === action.payload.taskId ? { ...t, done: !t.done } : t,
          );
          const done = tasks?.filter(t => t.done).length ?? 0;
          const total = tasks?.length ?? 1;
          return { ...m, tasks, progress: Math.round((done / total) * 100) };
        }),
      };

    case 'ADD_RP':
      return { ...state, rp: state.rp + action.payload };

    case 'ADD_LOGBOOK_ENTRY':
      return { ...state, logbook: [action.payload, ...state.logbook] };

    case 'SET_HANDLE':
      return { ...state, handle: action.payload };

    case 'SET_DISPLAY_NAME':
      return {
        ...state,
        displayName: action.payload,
        initial: action.payload.charAt(0).toUpperCase(),
      };

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'RESET':
      return { ...initialState, isHydrated: true };

    default:
      return state;
  }
}

/* ──────────────────────────────────────────────────────────────────────
   CONTEXT
   ──────────────────────────────────────────────────────────────────── */
export interface SubmitCheckInResult {
  prevScore: number;
  prevTier: RankTierId;
  newScore: number;
  newTier: RankTierId;
  result: ApplyCheckInResult;
  /** The logbook entry written for today (new or edited). */
  entry: LogbookEntry;
  /** RP awarded by this submission (0 on a same-day re-submission). */
  rpEarned: number;
  /** True when this edited an existing same-day check-in. */
  isResubmit: boolean;
  /** Missions that finished as a result of this check-in (for mission_events). */
  newlyCompletedMissions: Mission[];
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // convenience helpers
  submitCheckIn: (rawRatings: Record<CategoryId, number>, meta?: { tags?: string[]; note?: string; missionDaily?: Record<string, boolean> }) => SubmitCheckInResult;
  acceptMission: (mission: Mission) => void;
  abandonMission: (missionId: string) => void;
  completeMission: (missionId: string) => void;
  toggleMissionTask: (missionId: string, taskId: string) => void;
  calibrate: (args: { score: LifeScore; categories: CategoryScore[]; build: UserBuild; handle: string; displayName: string }) => void;
  setSettings: (patch: Partial<UserSettings>) => void;
  updateProfile: (patch: { handle?: string; displayName?: string }) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

/* ──────────────────────────────────────────────────────────────────────
   PROVIDER
   ──────────────────────────────────────────────────────────────────── */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Latest state, readable inside async callbacks without re-subscribing.
  const stateRef = useRef(state);
  stateRef.current = state;

  // True once remote data has been applied — prevents a slow local hydrate
  // from clobbering remote ("remote always wins on login").
  const remoteAppliedRef = useRef(false);
  // Gates write-through to Supabase until the initial session/remote
  // reconciliation has run, so we never push stale local data up on launch.
  const syncEnabledRef = useRef(false);

  // ── Hydrate from local cache on mount (fast paint) ──────────────────
  useEffect(() => {
    (async () => {
      const [
        isCalibrated,
        score,
        categories,
        activeMissions,
        completedMissions,
        logbook,
        handle,
        displayName,
        build,
        rp,
        settings,
        joinedAt,
      ] = await Promise.all([
        Storage.getIsCalibrated(),
        Storage.getLifeScore(),
        Storage.getCategoryScores(),
        Storage.getActiveMissions(),
        Storage.getCompletedMissions(),
        Storage.getLogbook(),
        Storage.getHandle(),
        Storage.getDisplayName(),
        Storage.getUserBuild(),
        Storage.getRP(),
        Storage.getUserSettings(),
        Storage.getJoinedAt(),
      ]);

      // Remote already won this race — don't overwrite it with local cache.
      if (remoteAppliedRef.current) return;

      dispatch({
        type: 'HYDRATE',
        payload: {
          isCalibrated,
          ...(score && { score }),
          ...(categories && { categories }),
          ...(activeMissions && { activeMissions }),
          ...(completedMissions && { completedMissions }),
          ...(logbook && { logbook }),
          ...(handle && { handle }),
          ...(displayName && {
            displayName,
            initial: displayName.charAt(0).toUpperCase(),
          }),
          ...(build && { build }),
          ...(settings && { settings }),
          rp,
          ...(joinedAt && { joinedAt }),
        },
      });
    })();
  }, []);

  // ── Auth lifecycle: pull remote on login, clear local on logout ─────
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        await Storage.clearAllAppData();
        remoteAppliedRef.current = false;
        dispatch({ type: 'RESET' });
        return;
      }

      const userId = session?.user.id;
      if (userId && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        console.log('[AUTH_USER]', { userId, event, provider: session?.user.app_metadata?.provider });
        const [remote, profile] = await Promise.all([
          Sync.fetchRemoteState(userId),
          Sync.fetchProfile(userId),
        ]);

        // For web OAuth users, profile creation happens here (not in AuthProvider
        // which only handles the native flows). Safe to call on every sign-in —
        // ensureProfile is idempotent and returns early when the row already exists.
        if (!profile && session) {
          const meta = session.user.user_metadata ?? {};
          const provider = (session.user.app_metadata?.provider ?? 'google') as 'google' | 'apple';
          await Sync.ensureProfile({
            userId,
            displayName: String(meta.full_name ?? meta.name ?? 'LifeRanker'),
            providerName: provider,
            avatarUrl: (meta.avatar_url ?? meta.picture ?? null) as string | null,
          });
        }

        if (remote) {
          // Remote wins. Overlay it onto local state and cache it.
          remoteAppliedRef.current = true;
          console.log('[HYDRATED_FROM_REMOTE]', {
            userId,
            isCalibrated: remote.isCalibrated,
            score: remote.score.value,
            logbookEntries: remote.logbook.length,
            activeMissions: remote.activeMissions.length,
            handle: profile?.handle,
          });
          dispatch({
            type: 'HYDRATE',
            payload: {
              isCalibrated: remote.isCalibrated,
              score: remote.score,
              categories: remote.categories,
              activeMissions: remote.activeMissions,
              completedMissions: remote.completedMissions,
              ...(remote.build && { build: remote.build }),
              rp: remote.rp,
              logbook: remote.logbook,
              ...(remote.settings && { settings: remote.settings }),
              ...(profile && {
                handle: profile.handle,
                displayName: profile.displayName,
                initial: profile.displayName.charAt(0).toUpperCase(),
                joinedAt: profile.joinedAt,
              }),
            },
          });
        } else if (stateRef.current.isCalibrated) {
          // No remote row yet but we have local data — migrate it up once.
          console.log('[HYDRATED_FROM_LOCAL]', { userId, reason: 'no remote row, migrating local state' });
          Sync.migrateLocalToRemote(stateRef.current);
        }
      }

      // From here on, local mutations may write through to Supabase.
      syncEnabledRef.current = true;
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Persist on every state change (local cache + remote snapshot) ───
  useEffect(() => {
    if (!state.isHydrated) return;
    Storage.setIsCalibrated(state.isCalibrated);
    Storage.setLifeScore(state.score);
    Storage.setCategoryScores(state.categories);
    Storage.setActiveMissions(state.activeMissions);
    Storage.setCompletedMissions(state.completedMissions);
    Storage.setHandle(state.handle);
    Storage.setDisplayName(state.displayName);
    Storage.setUserBuild(state.build);
    Storage.setRP(state.rp);
    Storage.setLogbook(state.logbook);
    Storage.setUserSettings(state.settings);
    if (state.joinedAt) Storage.setJoinedAt(state.joinedAt);

    // Write-through to Supabase (fire-and-forget). Gated so the initial
    // hydrate doesn't push stale local data over fresh remote data.
    if (syncEnabledRef.current) {
      Sync.syncLifeState(state);
    }
  }, [state]);

  // ── Convenience helpers ──────────────────────────────────────────────
  const submitCheckIn = useCallback(
    (rawRatings: Record<CategoryId, number>, meta?: { tags?: string[]; note?: string; missionDaily?: Record<string, boolean> }): SubmitCheckInResult => {
      const outcome = buildCheckIn(state, { rawRatings, tags: meta?.tags, note: meta?.note, missionDaily: meta?.missionDaily });
      dispatch({ type: 'SUBMIT_CHECKIN', payload: { rawRatings, tags: meta?.tags, note: meta?.note, missionDaily: meta?.missionDaily } });
      return {
        prevScore: outcome.prevScore,
        prevTier: outcome.prevTier,
        newScore: outcome.result.next.value,
        newTier: outcome.result.next.tier,
        result: outcome.result,
        entry: outcome.entry,
        rpEarned: outcome.rpEarned,
        isResubmit: outcome.isResubmit,
        newlyCompletedMissions: outcome.newlyCompletedMissions,
      };
    },
    [state],
  );

  const acceptMission = useCallback((mission: Mission) => {
    dispatch({ type: 'ACCEPT_MISSION', payload: mission });
  }, []);

  const abandonMission = useCallback((missionId: string) => {
    dispatch({ type: 'ABANDON_MISSION', payload: { missionId } });
  }, []);

  const completeMission = useCallback((missionId: string) => {
    const snapshot = stateRef.current;
    dispatch({ type: 'COMPLETE_MISSION', payload: { missionId } });
    // If today's check-in row already exists, mirror the completion onto it so it
    // survives a remote reload. (The reducer covers local state + the no-check-in
    // case; that synthetic entry reconciles into the cloud on the next check-in.)
    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = snapshot.logbook[0]?.date === today ? snapshot.logbook[0] : undefined;
    if (todayEntry && todayEntry.source !== 'mission') {
      const ids = todayEntry.completedMissionIds ?? [];
      if (!ids.includes(missionId)) {
        Sync.updateCheckinCompletedMissions(today, [...ids, missionId]);
      }
    }
  }, []);

  const toggleMissionTask = useCallback((missionId: string, taskId: string) => {
    dispatch({ type: 'TOGGLE_MISSION_TASK', payload: { missionId, taskId } });
  }, []);

  const calibrate = useCallback((args: Parameters<AppContextValue['calibrate']>[0]) => {
    dispatch({ type: 'CALIBRATE', payload: args });
  }, []);

  const setSettings = useCallback((patch: Partial<UserSettings>) => {
    dispatch({ type: 'SET_SETTINGS', payload: patch });
    // Push the full, patched settings object to Supabase (fire-and-forget).
    Sync.upsertSettings({ ...stateRef.current.settings, ...patch });
  }, []);

  // Edit identity (display name / handle). Updates local state immediately
  // (persisted to AsyncStorage by the write-through effect) and pushes to the
  // existing profiles table — no schema change.
  const updateProfile = useCallback((patch: { handle?: string; displayName?: string }) => {
    if (patch.displayName != null) dispatch({ type: 'SET_DISPLAY_NAME', payload: patch.displayName });
    if (patch.handle != null) dispatch({ type: 'SET_HANDLE', payload: patch.handle });
    Sync.updateProfile(patch);
  }, []);

  const reset = useCallback(() => {
    // Clear local cache + remote data, but keep the auth session.
    Sync.clearRemoteData();
    Storage.clearAllAppData().then(() => dispatch({ type: 'RESET' }));
  }, []);

  return (
    <AppContext.Provider value={{
      state, dispatch,
      submitCheckIn, acceptMission, abandonMission, completeMission,
      toggleMissionTask, calibrate, setSettings, updateProfile, reset,
    }}>
      {children}
    </AppContext.Provider>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   HOOKS
   ──────────────────────────────────────────────────────────────────── */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

export function useAppState(): AppState {
  return useApp().state;
}
