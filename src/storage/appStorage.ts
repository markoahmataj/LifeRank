// src/storage/appStorage.ts
// AsyncStorage CRUD layer. All app persistence goes through here.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LifeScore, CategoryScore, Mission, LogbookEntry, UserBuild, UserSettings } from '../design-system/types';
import { DEFAULT_USER_SETTINGS } from '../design-system/types';

/* ──────────────────────────────────────────────────────────────────────
   KEYS
   ──────────────────────────────────────────────────────────────────── */
const KEYS = {
  IS_CALIBRATED:       'lr:isCalibrated',
  LIFE_SCORE:          'lr:lifeScore',
  CATEGORY_SCORES:     'lr:categoryScores',
  ACTIVE_MISSIONS:     'lr:activeMissions',
  COMPLETED_MISSIONS:  'lr:completedMissions',
  LOGBOOK:             'lr:logbook',
  USER_HANDLE:         'lr:handle',
  USER_DISPLAY_NAME:   'lr:displayName',
  USER_BUILD:          'lr:build',
  USER_SETTINGS:       'lr:userSettings',
  RP:                  'lr:rp',
  JOINED_AT:           'lr:joinedAt',
} as const;

/* ──────────────────────────────────────────────────────────────────────
   GENERIC HELPERS
   ──────────────────────────────────────────────────────────────────── */
async function getJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function setJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[AppStorage] setJson failed', key, e);
  }
}

async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

/* ──────────────────────────────────────────────────────────────────────
   CALIBRATION FLAG
   ──────────────────────────────────────────────────────────────────── */
export async function getIsCalibrated(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.IS_CALIBRATED);
  return v === 'true';
}

export async function setIsCalibrated(v: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.IS_CALIBRATED, String(v));
}

/* ──────────────────────────────────────────────────────────────────────
   LIFE SCORE
   ──────────────────────────────────────────────────────────────────── */
export async function getLifeScore(): Promise<LifeScore | null> {
  return getJson<LifeScore>(KEYS.LIFE_SCORE);
}

export async function setLifeScore(score: LifeScore): Promise<void> {
  return setJson(KEYS.LIFE_SCORE, score);
}

/* ──────────────────────────────────────────────────────────────────────
   CATEGORY SCORES
   ──────────────────────────────────────────────────────────────────── */
export async function getCategoryScores(): Promise<CategoryScore[] | null> {
  return getJson<CategoryScore[]>(KEYS.CATEGORY_SCORES);
}

export async function setCategoryScores(scores: CategoryScore[]): Promise<void> {
  return setJson(KEYS.CATEGORY_SCORES, scores);
}

/* ──────────────────────────────────────────────────────────────────────
   ACTIVE MISSIONS
   ──────────────────────────────────────────────────────────────────── */
export async function getActiveMissions(): Promise<Mission[] | null> {
  return getJson<Mission[]>(KEYS.ACTIVE_MISSIONS);
}

export async function setActiveMissions(missions: Mission[]): Promise<void> {
  return setJson(KEYS.ACTIVE_MISSIONS, missions);
}

/* ──────────────────────────────────────────────────────────────────────
   COMPLETED MISSIONS
   ──────────────────────────────────────────────────────────────────── */
export async function getCompletedMissions(): Promise<Mission[] | null> {
  return getJson<Mission[]>(KEYS.COMPLETED_MISSIONS);
}

export async function setCompletedMissions(missions: Mission[]): Promise<void> {
  return setJson(KEYS.COMPLETED_MISSIONS, missions);
}

/* ──────────────────────────────────────────────────────────────────────
   LOGBOOK
   ──────────────────────────────────────────────────────────────────── */
export async function getLogbook(): Promise<LogbookEntry[] | null> {
  return getJson<LogbookEntry[]>(KEYS.LOGBOOK);
}

export async function appendLogbookEntry(entry: LogbookEntry): Promise<void> {
  const existing = (await getLogbook()) ?? [];
  // Prepend so newest is first
  await setJson(KEYS.LOGBOOK, [entry, ...existing]);
}

export async function setLogbook(entries: LogbookEntry[]): Promise<void> {
  return setJson(KEYS.LOGBOOK, entries);
}

/* ──────────────────────────────────────────────────────────────────────
   USER IDENTITY
   ──────────────────────────────────────────────────────────────────── */
export async function getHandle(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.USER_HANDLE);
}

export async function setHandle(handle: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_HANDLE, handle);
}

export async function getDisplayName(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.USER_DISPLAY_NAME);
}

export async function setDisplayName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_DISPLAY_NAME, name);
}

export async function getUserBuild(): Promise<UserBuild | null> {
  return getJson<UserBuild>(KEYS.USER_BUILD);
}

export async function setUserBuild(build: UserBuild): Promise<void> {
  return setJson(KEYS.USER_BUILD, build);
}

export async function getJoinedAt(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.JOINED_AT);
}

export async function setJoinedAt(value: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.JOINED_AT, value);
}

/* ──────────────────────────────────────────────────────────────────────
   RP TOTAL
   ──────────────────────────────────────────────────────────────────── */
export async function getRP(): Promise<number> {
  const v = await AsyncStorage.getItem(KEYS.RP);
  return v != null ? parseInt(v, 10) : 0;
}

export async function setRP(amount: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.RP, String(amount));
}

export async function addRP(amount: number): Promise<number> {
  const current = await getRP();
  const next = current + amount;
  await AsyncStorage.setItem(KEYS.RP, String(next));
  return next;
}

/* ──────────────────────────────────────────────────────────────────────
   USER SETTINGS
   ──────────────────────────────────────────────────────────────────── */
export async function getUserSettings(): Promise<UserSettings | null> {
  const stored = await getJson<Partial<UserSettings>>(KEYS.USER_SETTINGS);
  if (!stored) return null;
  // Merge over defaults so newly-added fields stay populated.
  return { ...DEFAULT_USER_SETTINGS, ...stored };
}

export async function setUserSettings(settings: UserSettings): Promise<void> {
  return setJson(KEYS.USER_SETTINGS, settings);
}

/* ──────────────────────────────────────────────────────────────────────
   NUKE — clear all app data (dev / reset)
   ──────────────────────────────────────────────────────────────────── */
export async function clearAllAppData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
