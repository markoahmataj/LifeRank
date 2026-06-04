// src/services/liferankSync.ts
// Cloud sync layer. Supabase is the source of truth; AsyncStorage is a
// write-through cache (handled in AppContext). These functions push local
// state up and pull remote state down.
//
// All write helpers are fire-and-forget safe: they no-op when Supabase is
// not configured or there is no session, and they swallow errors with a
// console.warn so a failed sync never breaks the local app experience.

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  LifeScore,
  CategoryScore,
  Mission,
  LogbookEntry,
  UserBuild,
  UserSettings,
  RankTierId,
} from '../design-system/types';
import type { AppState } from '../store/AppContext';

/* ──────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────── */
async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/* ──────────────────────────────────────────────────────────────────────
   Profile bootstrap (first login)
   ──────────────────────────────────────────────────────────────────── */
export interface EnsureProfileParams {
  userId: string;
  displayName: string;
  providerName: 'google' | 'apple';
  avatarUrl?: string | null;
}

function slugifyHandle(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 16);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `@${base || 'ranker'}.${suffix}`;
}

/**
 * Returns the existing profile row, or creates one (plus a default
 * user_settings row) if this is the user's first login. Returns null when
 * Supabase is not configured.
 */
export async function ensureProfile(
  params: EnsureProfileParams,
): Promise<{ created: boolean; handle: string; displayName: string } | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: existing, error } = await supabase
      .from('profiles')
      .select('id, handle, display_name')
      .eq('id', params.userId)
      .maybeSingle();

    if (error) {
      console.error('[PROFILE_FETCH_ERROR]', error);
      throw error;
    }

    if (existing) {
      console.log('[PROFILE_FETCH_SUCCESS]', { userId: params.userId, created: false, handle: existing.handle });
      return {
        created: false,
        handle: existing.handle,
        displayName: existing.display_name,
      };
    }

    const handle = slugifyHandle(params.displayName);
    const { error: insertError } = await supabase.from('profiles').insert({
      id: params.userId,
      handle,
      display_name: params.displayName,
      provider_name: params.providerName,
      avatar_url: params.avatarUrl ?? null,
    });
    if (insertError) {
      console.error('[PROFILE_FETCH_ERROR] profile insert failed', insertError);
      throw insertError;
    }

    // Seed default settings alongside the new profile.
    await supabase
      .from('user_settings')
      .insert({ id: params.userId })
      .then(({ error: settingsError }) => {
        if (settingsError) {
          console.error('[SETTINGS_FETCH_ERROR] default settings insert failed', settingsError);
        } else {
          console.log('[SETTINGS_FETCH_SUCCESS]', { userId: params.userId });
        }
      });

    console.log('[PROFILE_FETCH_SUCCESS]', { userId: params.userId, created: true, handle });
    return { created: true, handle, displayName: params.displayName };
  } catch (e) {
    console.error('[PROFILE_FETCH_ERROR]', e);
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────────────
   life_state — current snapshot upsert
   ──────────────────────────────────────────────────────────────────── */
export async function syncLifeState(state: AppState): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  console.log('[LIFESTATE_SYNC_START]', { userId, isCalibrated: state.isCalibrated });
  try {
    const { error } = await supabase.from('life_state').upsert(
      {
        user_id: userId,
        is_calibrated: state.isCalibrated,
        score: state.score.value,
        delta: state.score.delta,
        tier: state.score.tier,
        next_rank_at: state.score.nextRankAt,
        streak: state.score.streak,
        pb_score: state.score.pbScore ?? null,
        last_checkin: state.score.lastCheckIn ?? null,
        rp: state.rp,
        categories: state.categories,
        build: state.build ?? null,
        active_missions: state.activeMissions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (error) {
      console.error('[LIFESTATE_SYNC_ERROR]', error);
      throw error;
    }
    console.log('[LIFESTATE_SYNC_SUCCESS]', { userId });
  } catch (e) {
    console.error('[LIFESTATE_SYNC_ERROR]', e);
  }
}

/* ──────────────────────────────────────────────────────────────────────
   checkins — one row per user per day (UPSERT on conflict)
   ──────────────────────────────────────────────────────────────────── */
export async function insertCheckin(entry: LogbookEntry, rpEarned: number): Promise<void> {
  const userId = await currentUserId();
  if (!userId) {
    console.warn('[CHECKIN_SYNC_ERROR] No authenticated user — skipping checkin write');
    return;
  }
  console.log('[CHECKIN_SYNC_START]', { userId, date: entry.date, lifeScore: entry.lifeScore });
  try {
    // Upsert, NOT plain insert — enforces one check-in per (user_id, date).
    // A second submission on the same calendar day updates the existing row.
    const { error } = await supabase.from('checkins').upsert(
      {
        user_id: userId,
        date: entry.date,
        life_score: entry.lifeScore,
        delta: entry.delta,
        rank_tier: entry.rankTier,
        streak_day: entry.streakDay,
        category_scores: entry.categoryScores,
        tags: entry.tags ?? [],
        note: entry.note ?? null,
        completed_mission_ids: entry.completedMissionIds ?? [],
        rp_earned: rpEarned,
      },
      { onConflict: 'user_id,date' },
    );
    if (error) {
      console.error('[CHECKIN_SYNC_ERROR]', error);
      throw error;
    }
    console.log('[CHECKIN_SYNC_SUCCESS]', { date: entry.date });
  } catch (e) {
    console.error('[CHECKIN_SYNC_ERROR]', e);
  }
}

/* ──────────────────────────────────────────────────────────────────────
   mission_events — append-only lifecycle log
   ──────────────────────────────────────────────────────────────────── */
export type MissionEventType = 'accepted' | 'completed' | 'failed' | 'abandoned';

export interface MissionEventPayload {
  missionId: string;
  eventType: MissionEventType;
  missionSnapshot?: Mission | null;
  rpEarned?: number;
  scoreImpact?: number;
}

export async function insertMissionEvent(
  userId: string,
  event: MissionEventPayload,
): Promise<void> {
  if (!isSupabaseConfigured || !userId) {
    console.warn('[MISSION_SYNC_ERROR] Supabase not configured or no userId');
    return;
  }
  console.log('[MISSION_SYNC_START]', { userId, missionId: event.missionId, eventType: event.eventType });
  try {
    const { error } = await supabase.from('mission_events').insert({
      user_id: userId,
      mission_id: event.missionId,
      event_type: event.eventType,
      mission_snapshot: event.missionSnapshot ?? null,
      rp_earned: event.rpEarned ?? 0,
      score_impact: event.scoreImpact ?? 0,
    });
    if (error) {
      console.error('[MISSION_SYNC_ERROR]', error);
      throw error;
    }
    console.log('[MISSION_SYNC_SUCCESS]', { missionId: event.missionId, eventType: event.eventType });
  } catch (e) {
    console.error('[MISSION_SYNC_ERROR]', e);
  }
}

/* ──────────────────────────────────────────────────────────────────────
   user_settings — privacy + notification toggles
   ──────────────────────────────────────────────────────────────────── */
export async function upsertSettings(settings: UserSettings): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  try {
    const { error } = await supabase.from('user_settings').upsert(
      {
        id: userId,
        share_score_visible: settings.shareScoreVisible,
        share_categories_visible: settings.shareCategoriesVisible,
        notif_mission_reminder: settings.notifMissionReminder,
        notif_streak_risk: settings.notifStreakRisk,
        notif_weekly_report: settings.notifWeeklyReport,
        notif_rank_change: settings.notifRankChange,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
    if (error) throw error;
  } catch (e) {
    console.error('[SETTINGS_SYNC_ERROR] upsertSettings failed', e);
  }
}

/* ──────────────────────────────────────────────────────────────────────
   fetchRemoteState — pull life_state + recent checkins (+ settings)
   ──────────────────────────────────────────────────────────────────── */
export interface RemoteState {
  isCalibrated: boolean;
  score: LifeScore;
  categories: CategoryScore[];
  activeMissions: Mission[];
  completedMissions: Mission[];
  build: UserBuild | null;
  rp: number;
  logbook: LogbookEntry[];
  settings: UserSettings | null;
  updatedAt: string | null;
}

const CHECKIN_FETCH_LIMIT = 120;

export async function fetchRemoteState(userId: string): Promise<RemoteState | null> {
  if (!isSupabaseConfigured || !userId) return null;
  try {
    const { data: life, error: lifeError } = await supabase
      .from('life_state')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (lifeError) {
      console.error('[LIFESTATE_FETCH_ERROR]', { userId, error: lifeError });
      throw lifeError;
    }
    if (!life) {
      console.log('[LIFESTATE_FETCH]', { userId, found: false });
      return null; // No remote data yet — caller should migrate.
    }
    console.log('[LIFESTATE_FETCH]', { userId, found: true, isCalibrated: life.is_calibrated, score: life.score });

    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(CHECKIN_FETCH_LIMIT);
    if (checkinsError) throw checkinsError;

    const { data: missionEvents, error: missionEventsError } = await supabase
      .from('mission_events')
      .select('mission_id, mission_snapshot')
      .eq('user_id', userId)
      .eq('event_type', 'completed')
      .order('created_at', { ascending: false })
      .limit(100);
    if (missionEventsError) {
      console.error('[MISSION_EVENTS_FETCH_ERROR]', { userId, error: missionEventsError });
    } else {
      console.log('[MISSION_EVENTS_FETCH_SUCCESS]', { userId, count: missionEvents?.length ?? 0 });
    }

    const seenMissionIds = new Set<string>();
    const completedMissions: Mission[] = [];
    for (const event of missionEvents ?? []) {
      if (!event.mission_snapshot || seenMissionIds.has(event.mission_id)) continue;
      seenMissionIds.add(event.mission_id);
      completedMissions.push({ ...(event.mission_snapshot as Mission), status: 'completed' });
    }

    const { data: settingsRow, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (settingsError) {
      console.error('[SETTINGS_FETCH_ERROR]', { userId, error: settingsError });
    } else {
      console.log('[SETTINGS_FETCH_SUCCESS]', { userId, found: !!settingsRow });
    }

    const score: LifeScore = {
      value: Number(life.score),
      delta: Number(life.delta),
      tier: life.tier as RankTierId,
      nextRankAt: Number(life.next_rank_at),
      streak: life.streak,
      pbScore: life.pb_score != null ? Number(life.pb_score) : undefined,
      lastCheckIn: life.last_checkin ?? undefined,
    };

    const logbook: LogbookEntry[] = (checkins ?? []).map((r) => ({
      date: r.date,
      lifeScore: Number(r.life_score),
      delta: Number(r.delta),
      categoryScores: (r.category_scores ?? []) as CategoryScore[],
      tags: (r.tags ?? []) as string[],
      note: r.note ?? undefined,
      completedMissionIds: r.completed_mission_ids ?? undefined,
      rankTier: r.rank_tier as RankTierId,
      streakDay: r.streak_day,
    }));

    const settings: UserSettings | null = settingsRow
      ? {
          shareScoreVisible: settingsRow.share_score_visible,
          shareCategoriesVisible: settingsRow.share_categories_visible,
          notifMissionReminder: settingsRow.notif_mission_reminder,
          notifStreakRisk: settingsRow.notif_streak_risk,
          notifWeeklyReport: settingsRow.notif_weekly_report,
          notifRankChange: settingsRow.notif_rank_change,
        }
      : null;

    const result: RemoteState = {
      isCalibrated: life.is_calibrated,
      score,
      categories: (life.categories ?? []) as CategoryScore[],
      activeMissions: (life.active_missions ?? []) as Mission[],
      completedMissions,
      build: (life.build ?? null) as UserBuild | null,
      rp: life.rp,
      logbook,
      settings,
      updatedAt: life.updated_at ?? null,
    };
    console.log('[HYDRATED_FROM_REMOTE]', { userId, isCalibrated: result.isCalibrated, checkins: logbook.length });
    return result;
  } catch (e) {
    console.error('[HYDRATED_FROM_REMOTE] fetchRemoteState failed', e);
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────────────
   fetchProfile — identity (handle / display name)
   ──────────────────────────────────────────────────────────────────── */
export interface RemoteProfile {
  handle: string;
  displayName: string;
  providerName: string;
  avatarUrl: string | null;
  joinedAt: string;
}

export async function fetchProfile(userId: string): Promise<RemoteProfile | null> {
  if (!isSupabaseConfigured || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      handle: data.handle,
      displayName: data.display_name,
      providerName: data.provider_name,
      avatarUrl: data.avatar_url ?? null,
      joinedAt: data.joined_at,
    };
  } catch (e) {
    console.error('[PROFILE_FETCH_ERROR] fetchProfile failed', e);
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────────────
   clearRemoteData — used by "Reset calibration" / "Delete local data"
   Deletes the user's data rows but keeps the profile + auth session.
   ──────────────────────────────────────────────────────────────────── */
export async function clearRemoteData(): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  try {
    await supabase.from('checkins').delete().eq('user_id', userId);
    await supabase.from('mission_events').delete().eq('user_id', userId);
    await supabase.from('life_state').delete().eq('user_id', userId);
  } catch (e) {
    console.error('[CLEAR_REMOTE_ERROR] clearRemoteData failed', e);
  }
}

/* ──────────────────────────────────────────────────────────────────────
   migrateLocalToRemote — first login with local-only data
   ──────────────────────────────────────────────────────────────────── */
export async function migrateLocalToRemote(state: AppState): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  try {
    await syncLifeState(state);
    // Push the local logbook up as checkin rows (deduped by date via upsert).
    for (const entry of state.logbook) {
      await insertCheckin(entry, 0);
    }
  } catch (e) {
    console.error('[MIGRATE_LOCAL_ERROR] migrateLocalToRemote failed', e);
  }
}
