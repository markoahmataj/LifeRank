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
import { applyCheckIn, type ApplyCheckInResult } from '../design-system/scoringModel';
import * as Storage from '../storage/appStorage';
import { supabase } from '../lib/supabase';
import * as Sync from '../services/liferankSync';
import {
  mockLifeScore,
  mockCategoryScores,
  mockActiveMissions,
  mockBuild,
} from '../design-system/mockData';

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
  score: LifeScore;
  categories: CategoryScore[];
  activeMissions: Mission[];
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
  score: INITIAL_SCORE,
  categories: mockCategoryScores.map(c => ({ ...c, value: 5, delta: 0 })),
  activeMissions: [],
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
  | { type: 'SUBMIT_CHECKIN'; payload: { rawRatings: Record<CategoryId, number>; tags?: string[]; note?: string } }
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
  result: ApplyCheckInResult;
  entry: LogbookEntry;
  rpEarned: number;
  isResubmit: boolean;
  prevScore: number;
  prevTier: RankTierId;
  nextLogbook: LogbookEntry[];
  nextRp: number;
}

function buildCheckIn(
  state: AppState,
  payload: { rawRatings: Record<CategoryId, number>; tags?: string[]; note?: string },
): CheckInOutcome {
  const today = new Date().toISOString().slice(0, 10);
  const isResubmit = state.logbook[0]?.date === today;

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

  const result = applyCheckIn({
    current: baselineScore,
    rawRatings: payload.rawRatings,
    previousCategoryScores: baselineCategories,
    activeMissions: state.activeMissions,
  });

  const rpEarned = isResubmit ? 0 : result.rpEarned;

  const entry: LogbookEntry = {
    date: today,
    lifeScore: result.next.value,
    delta: result.next.delta,
    categoryScores: result.nextCategoryScores,
    tags: payload.tags ?? [],
    note: payload.note,
    rankTier: result.next.tier,
    streakDay: result.next.streak,
  };

  const nextLogbook = isResubmit
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
  };
}

/* ──────────────────────────────────────────────────────────────────────
   REDUCER
   ──────────────────────────────────────────────────────────────────── */
function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, isHydrated: true };

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
      const { result, nextLogbook, nextRp } = buildCheckIn(state, action.payload);
      return {
        ...state,
        score: result.next,
        categories: result.nextCategoryScores,
        rp: nextRp,
        logbook: nextLogbook,
      };
    }

    case 'ACCEPT_MISSION':
      return {
        ...state,
        activeMissions: [
          ...state.activeMissions,
          { ...action.payload, status: 'active', daysIn: 0, progress: 0 },
        ],
      };

    case 'ABANDON_MISSION':
      return {
        ...state,
        activeMissions: state.activeMissions.filter(m => m.id !== action.payload.missionId),
      };

    case 'COMPLETE_MISSION':
      return {
        ...state,
        activeMissions: state.activeMissions.filter(m => m.id !== action.payload.missionId),
      };

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
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // convenience helpers
  submitCheckIn: (rawRatings: Record<CategoryId, number>, meta?: { tags?: string[]; note?: string }) => SubmitCheckInResult;
  acceptMission: (mission: Mission) => void;
  abandonMission: (missionId: string) => void;
  completeMission: (missionId: string) => void;
  toggleMissionTask: (missionId: string, taskId: string) => void;
  calibrate: (args: { score: LifeScore; categories: CategoryScore[]; build: UserBuild; handle: string; displayName: string }) => void;
  setSettings: (patch: Partial<UserSettings>) => void;
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
        logbook,
        handle,
        displayName,
        build,
        rp,
        settings,
      ] = await Promise.all([
        Storage.getIsCalibrated(),
        Storage.getLifeScore(),
        Storage.getCategoryScores(),
        Storage.getActiveMissions(),
        Storage.getLogbook(),
        Storage.getHandle(),
        Storage.getDisplayName(),
        Storage.getUserBuild(),
        Storage.getRP(),
        Storage.getUserSettings(),
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
          ...(logbook && { logbook }),
          ...(handle && { handle }),
          ...(displayName && {
            displayName,
            initial: displayName.charAt(0).toUpperCase(),
          }),
          ...(build && { build }),
          ...(settings && { settings }),
          rp,
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
        const [remote, profile] = await Promise.all([
          Sync.fetchRemoteState(userId),
          Sync.fetchProfile(userId),
        ]);

        if (remote) {
          // Remote wins. Overlay it onto local state and cache it.
          remoteAppliedRef.current = true;
          dispatch({
            type: 'HYDRATE',
            payload: {
              isCalibrated: remote.isCalibrated,
              score: remote.score,
              categories: remote.categories,
              activeMissions: remote.activeMissions,
              ...(remote.build && { build: remote.build }),
              rp: remote.rp,
              logbook: remote.logbook,
              ...(remote.settings && { settings: remote.settings }),
              ...(profile && {
                handle: profile.handle,
                displayName: profile.displayName,
                initial: profile.displayName.charAt(0).toUpperCase(),
              }),
            },
          });
        } else if (stateRef.current.isCalibrated) {
          // No remote row yet but we have local data — migrate it up once.
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
    Storage.setHandle(state.handle);
    Storage.setDisplayName(state.displayName);
    Storage.setUserBuild(state.build);
    Storage.setRP(state.rp);
    Storage.setLogbook(state.logbook);
    Storage.setUserSettings(state.settings);

    // Write-through to Supabase (fire-and-forget). Gated so the initial
    // hydrate doesn't push stale local data over fresh remote data.
    if (syncEnabledRef.current) {
      Sync.syncLifeState(state);
    }
  }, [state]);

  // ── Convenience helpers ──────────────────────────────────────────────
  const submitCheckIn = useCallback(
    (rawRatings: Record<CategoryId, number>, meta?: { tags?: string[]; note?: string }): SubmitCheckInResult => {
      const outcome = buildCheckIn(state, { rawRatings, tags: meta?.tags, note: meta?.note });
      dispatch({ type: 'SUBMIT_CHECKIN', payload: { rawRatings, tags: meta?.tags, note: meta?.note } });
      return {
        prevScore: outcome.prevScore,
        prevTier: outcome.prevTier,
        newScore: outcome.result.next.value,
        newTier: outcome.result.next.tier,
        result: outcome.result,
        entry: outcome.entry,
        rpEarned: outcome.rpEarned,
        isResubmit: outcome.isResubmit,
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
    dispatch({ type: 'COMPLETE_MISSION', payload: { missionId } });
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

  const reset = useCallback(() => {
    // Clear local cache + remote data, but keep the auth session.
    Sync.clearRemoteData();
    Storage.clearAllAppData().then(() => dispatch({ type: 'RESET' }));
  }, []);

  return (
    <AppContext.Provider value={{
      state, dispatch,
      submitCheckIn, acceptMission, abandonMission, completeMission,
      toggleMissionTask, calibrate, setSettings, reset,
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
