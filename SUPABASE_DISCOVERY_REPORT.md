# LifeRank — Supabase Auth + Database Discovery Report
> Generated: 2026-05-30 · Revised: 2026-05-30 · Scope: full codebase inspection before any Supabase work begins
> Status: READ-ONLY analysis. No code was modified. No packages installed.
> Revision notes: corrected MVP table count (4→5), resolved checkins uniqueness decision, corrected Apple + Google auth to native SDK approach, corrected session storage to LargeSecureStore hybrid.

---

# 1. Current Local State Inventory

Inspected: `src/store/AppContext.tsx`, `src/design-system/types.ts`, `src/design-system/scoringModel.ts`

## AppState shape (from `AppContext.tsx:34-47`)

| Field | TypeScript Type | Initialized at | Updated by | Read by UI in | AsyncStorage persisted? | Remote? | Notes |
|---|---|---|---|---|---|---|---|
| `isCalibrated` | `boolean` | `false` in `initialState` | `CALIBRATE` action | RouteGuard, HomeScreen guard check | Yes (`lr:isCalibrated`) | Yes — `profiles.is_calibrated` or `life_state.is_calibrated` | The single gate between onboarding and the main app. |
| `isHydrated` | `boolean` | `false`, set `true` after AsyncStorage read | `HYDRATE`, `RESET` | RouteGuard early return | **No** — intentionally runtime-only | **No** — runtime flag | Never persist; always recomputed on cold start. |
| `handle` | `string` | `'@you'` | `CALIBRATE`, `SET_HANDLE` | HomeScreen, ProfileScreen, SettingsScreen, ShareScreen poster | Yes (`lr:handle`) | Yes — `profiles.handle` | User-chosen identity string. |
| `displayName` | `string` | `'You'` | `CALIBRATE`, `SET_DISPLAY_NAME` | HomeScreen greeting, ProfileScreen | Yes (`lr:displayName`) | Yes — `profiles.display_name` | Human-readable name. |
| `initial` | `string` | `'Y'` (derived) | `CALIBRATE`, `SET_DISPLAY_NAME`, `HYDRATE` | HomeScreen avatar circle | **No** — derived in reducer from `displayName.charAt(0).toUpperCase()` | **No** — derived, never store directly | Always recompute: `displayName.charAt(0).toUpperCase()`. |
| `score.value` | `number` (0–10) | `0` | `SUBMIT_CHECKIN` (via `applyCheckIn`) | HomeScreen ScoreHero, ResultsScreen, StatsScreen, ShareScreen | Yes (inside `lr:lifeScore`) | Yes — `life_state.score` | Core currency. EMA-smoothed. |
| `score.delta` | `number` | `0` | `SUBMIT_CHECKIN` | ResultsScreen, StatsScreen | Yes (inside `lr:lifeScore`) | Yes — `life_state.delta` | Delta vs previous check-in. |
| `score.tier` | `RankTierId` | `'dormant'` | `SUBMIT_CHECKIN` (via `tierForScore()`) | HomeScreen, CheckInScreen, ProfileScreen, all accent colors | Yes (inside `lr:lifeScore`) | Yes — `life_state.tier` | Derived from score.value. Never write tier directly — always recompute. |
| `score.nextRankAt` | `number` | `3.0` | `SUBMIT_CHECKIN` | HomeScreen EnergyBar | Yes (inside `lr:lifeScore`) | Yes — `life_state.next_rank_at` | Computed from tier via `nextPromotionScore()`. |
| `score.streak` | `number` | `0` | `SUBMIT_CHECKIN` (increments or resets to 1) | CheckInScreen header, ProfileScreen, HomeScreen StreakCard | Yes (inside `lr:lifeScore`) | Yes — `life_state.streak` | 24h grace window. If missed: resets to 1, not 0. |
| `score.pbScore` | `number \| undefined` | `undefined` | `SUBMIT_CHECKIN` (max of prev and new) | ProfileScreen Records, StatsScreen | Yes (inside `lr:lifeScore`) | Yes — `life_state.pb_score` | Personal best. Monotonic: only increases. |
| `score.lastCheckIn` | `string \| undefined` (ISO) | `undefined` | `SUBMIT_CHECKIN` | `isStreakAlive()` logic | Yes (inside `lr:lifeScore`) | Yes — `life_state.last_checkin` | Needed for streak alive check across sessions. |
| `categories` | `CategoryScore[]` (5 items) | Mock values at `value: 5, delta: 0` | `CALIBRATE`, `SUBMIT_CHECKIN` | HomeScreen category grid, StatsScreen, ShareScreen, ResultsScreen, CategoryDetailScreen | Yes (`lr:categoryScores`) | Yes — `life_state.categories` JSONB | 5 fixed categories: discipline, style, environment, money, career. |
| `activeMissions` | `Mission[]` | `[]` | `CALIBRATE` (first mission), `ACCEPT_MISSION`, `ABANDON_MISSION`, `COMPLETE_MISSION`, `TOGGLE_MISSION_TASK` | HomeScreen MissionCard, MissionsScreen Active tab, MissionDetailScreen | Yes (`lr:activeMissions`) | Yes — `life_state.active_missions` JSONB | Only in-progress missions. Completed/failed are removed. |
| `build` | `UserBuild` | `mockBuild` | `CALIBRATE` | HomeScreen (label), ProfileScreen, SettingsScreen | Yes (`lr:build`) | Yes — `life_state.build` JSONB | Archetype: operator, aesthete, monk, capital, broadcaster, wildcard. |
| `rp` | `number` | `0` | `SUBMIT_CHECKIN` (via `rpEarned`), `ADD_RP`, `COMPLETE_MISSION` (implied via ADD_RP) | ProfileScreen Records, future unlocks | Yes (`lr:rp`) | Yes — `life_state.rp` | Monotonic. Only ever increases. |
| `logbook` | `LogbookEntry[]` | `[]` | `SUBMIT_CHECKIN` (reducer prepends entry), `ADD_LOGBOOK_ENTRY` | LogbookScreen, StatsScreen (as trend data), ProfileScreen (totalCheckIns count) | Yes (`lr:logbook`) | Yes — maps to `checkins` table rows | Each entry = one daily check-in. Source of truth for history. |

## Fields that do NOT exist in AppState but are needed after Supabase

| Missing Field | Where referenced | Where it should come from |
|---|---|---|
| Auth session / user ID | Nowhere currently | Supabase `auth.users.id` via `supabase.auth.getSession()` |
| `joinedAt` | ProfileScreen `mockProfile.joinedAt` only | `profiles.joined_at` (timestamp when user first authenticated) |
| `totalCheckIns` | ProfileScreen defaults to `mockProfile.totalCheckIns = 186` | Derived: `state.logbook.length` (already wired in route) |
| `completedOperations` | ProfileScreen defaults to `mockProfile.completedOperations = 23` | Needs a `mission_events` table or a completed missions counter |
| `rankPromotions` | ProfileScreen defaults to `mockProfile.rankPromotions = 2` | Needs count from `mission_events` or rank promotion events |
| `longestStreak` | ProfileScreen uses `score.streak` as proxy | Should be a persisted historical best streak, separate from current |
| `avatarUrl` | Not referenced yet | Will come from OAuth provider (Google photo, Apple no photo) |
| `providerName` | Not referenced yet | `'google'` or `'apple'` from auth metadata |
| Notifications queue | `mockNotifications` only | Will need `notifications` table or push token system |
| Weekly report | `mockWeeklyReport` only | Will need computation from `checkins` table |

---

# 2. AsyncStorage Inventory

Inspected: `src/storage/appStorage.ts`

## All storage keys (`KEYS` object, line 10-22)

| Key | Constant | Has getter? | Has setter? | Used by AppContext? | Status |
|---|---|---|---|---|---|
| `lr:isCalibrated` | `IS_CALIBRATED` | Yes (`getIsCalibrated`) | Yes (`setIsCalibrated`) | Yes | Migrate to Supabase source of truth; keep as local cache |
| `lr:lifeScore` | `LIFE_SCORE` | Yes (`getLifeScore`) | Yes (`setLifeScore`) | Yes | Migrate; keep as local cache |
| `lr:categoryScores` | `CATEGORY_SCORES` | Yes (`getCategoryScores`) | Yes (`setCategoryScores`) | Yes | Migrate; keep as local cache |
| `lr:activeMissions` | `ACTIVE_MISSIONS` | Yes (`getActiveMissions`) | Yes (`setActiveMissions`) | Yes | Migrate; keep as local cache |
| `lr:logbook` | `LOGBOOK` | Yes (`getLogbook`), `appendLogbookEntry` | Yes (`setLogbook`) | Yes | Migrate to `checkins` table rows; keep local cache |
| `lr:handle` | `USER_HANDLE` | Yes (`getHandle`) | Yes (`setHandle`) | Yes | Migrate to `profiles.handle`; keep as local cache |
| `lr:displayName` | `USER_DISPLAY_NAME` | Yes (`getDisplayName`) | Yes (`setDisplayName`) | Yes | Migrate to `profiles.display_name`; keep as local cache |
| `lr:build` | `USER_BUILD` | Yes (`getUserBuild`) | Yes (`setUserBuild`) | Yes | Migrate to `life_state.build`; keep as local cache |
| `lr:streak` | `STREAK` | **No getter or setter** | **No getter or setter** | **No** — streak is inside `lr:lifeScore` | Dead key — never written or read. Delete after Supabase. |
| `lr:lastCheckIn` | `LAST_CHECKIN` | **No getter or setter** | **No getter or setter** | **No** — lastCheckIn is inside `lr:lifeScore` | Dead key — never written or read. Delete after Supabase. |
| `lr:rp` | `RP` | Yes (`getRP`) | Yes (`setRP`), `addRP` | Yes | Migrate to `life_state.rp`; keep as local cache |

**Important bug note:** `lr:streak` and `lr:lastCheckIn` appear in the `KEYS` object and are included in `clearAllAppData()` multiRemove, but no get/set helpers exist for them and no code reads/writes them. They are dead weight. The streak and lastCheckIn live inside the `lr:lifeScore` JSON blob. These keys can be safely removed after Supabase is integrated.

## Get methods summary

| Function | Returns | Null fallback |
|---|---|---|
| `getIsCalibrated()` | `boolean` | `false` if key absent |
| `getLifeScore()` | `LifeScore \| null` | `null` → AppContext falls back to INITIAL_SCORE |
| `getCategoryScores()` | `CategoryScore[] \| null` | `null` → AppContext falls back to mock 5s |
| `getActiveMissions()` | `Mission[] \| null` | `null` → AppContext falls back to `[]` |
| `getLogbook()` | `LogbookEntry[] \| null` | `null` → AppContext falls back to `[]` |
| `getHandle()` | `string \| null` | `null` → AppContext keeps `'@you'` |
| `getDisplayName()` | `string \| null` | `null` → AppContext keeps `'You'` |
| `getUserBuild()` | `UserBuild \| null` | `null` → AppContext keeps `mockBuild` |
| `getRP()` | `number` | `0` if key absent |

## Hydration behavior

AppContext loads all 9 values in parallel via `Promise.all` on mount (line 232-249). A single `HYDRATE` dispatch writes them all at once, setting `isHydrated: true`. The persistence `useEffect` early-returns until `isHydrated` is true, preventing overwrites during hydration.

## What is missing or duplicated

- `appendLogbookEntry` is defined in storage but never called from AppContext — AppContext uses `setLogbook` (full replacement). The append helper is unused.
- `addRP` is defined but AppContext uses `setRP` instead. Unused.
- No storage for notifications, weekly report, settings toggles, or auth session.
- No storage for completed missions history — when a mission is completed or abandoned, it is removed from `activeMissions` and never stored anywhere persistently.

---

# 3. User Flow Data Requirements

## A. Auth Flow

**Before login (new flow after Supabase):**
- RouteGuard detects no Supabase session
- App redirects to AuthScreen (new screen)
- AuthScreen shows "Continue with Google" and "Continue with Apple" buttons only
- No username/password fields, no magic link, no manual account creation

**After Google login:**
1. Supabase returns user object with `id` (uuid), `email`, `user_metadata.full_name`, `user_metadata.avatar_url`
2. App checks `profiles` table: does a row exist for this `auth.uid()`?
3. If yes → hydrate from remote `life_state` + `checkins` → go to main app or onboarding based on `is_calibrated`
4. If no → create `profiles` row with `display_name` from Google metadata, generate default handle, set `joined_at = now()` → go to onboarding

**After Apple login:**
1. Same flow. Apple only provides name on first sign-in; subsequent sign-ins do not re-send the name. The name must be saved to `profiles` on first login.
2. Apple does not provide an avatar URL. `avatar_url` will be null for Apple users.
3. Apple may provide a private relay email (e.g., `abc123@privaterelay.appleid.com`).

**How the app decides which screen to show:**
```
No session                    → AuthScreen
Session + no profiles row     → Create profile → OnboardingScreen
Session + profiles row + !is_calibrated → OnboardingScreen
Session + profiles row + is_calibrated  → MainTabs (HomeScreen)
```

## B. First-Use Flow

| Step | Data collected/written | Where stored |
|---|---|---|
| OnboardingScreen | Nothing | — |
| CalibrationScreen (step 0–4) | `category`, `score` (1–10), `tags[]` per step | Local state in route file (URL params) |
| CalibrationResultsScreen | `initialScore`, `initialTier`, `strongest`, `weakest`, `build`, `firstMissionId`, `narrative` | Computed from calibration answers |
| `calibrate()` dispatch | `score: LifeScore`, `categories: CategoryScore[]`, `build: UserBuild`, `handle`, `displayName` | `CALIBRATE` action → AppContext |
| On "Enter Operating System" | All of the above written | AsyncStorage (sync) + Supabase `life_state` upsert (async) |
| First mission assignment | First `activeMission` | AppContext `activeMissions` → `life_state.active_missions` |
| First logbook entry | One `LogbookEntry` for calibration day | Unclear currently — calibration does NOT write a logbook entry yet |

**Note:** APP_FLOW.md says after first-use: `user.score.streak === 1` and `One LogbookEntry recorded for today`. Currently the calibration flow does NOT write a logbook entry. This is a gap to address regardless of Supabase.

## C. Daily Check-In Flow

| Step | Data | Written to |
|---|---|---|
| User opens CheckInScreen | Reads `state.score.streak` for header display | AppContext |
| Answer each category (1–10 + tags) | `rawRatings: Record<CategoryId, number>`, `tags: string[]` | Local step state in CheckInScreen |
| Submit check-in | `applyCheckIn()` called with rawRatings + current state | Pure function, no side effects |
| `SUBMIT_CHECKIN` dispatch | `result.next` (new LifeScore), `result.nextCategoryScores`, `rpEarned` | AppContext reducer → AsyncStorage → **Supabase `life_state` upsert + `checkins` insert** |
| Tier comparison | `compareTiers(prevTier, result.next.tier)` | Route logic, no storage |
| Navigation | Route → `/rank/promotion`, `/rank/demotion-risk`, or `/checkin/results` | Navigation only |
| ResultsScreen display | `prevScore`, `newScore`, `categoryMovement` (category deltas), `diagnosis` | Computed from state, not stored separately |
| "Enter Operating System" | Nothing additional | Returns to tabs |

**Current app behavior — no daily gate exists:** `CheckInScreen` and `app/(tabs)/checkin.tsx` do NOT check whether a check-in has already been submitted today. Multiple same-day check-ins are accepted, which inflates the streak counter, double-awards RP, and creates duplicate logbook entries with the same `date` string. QA_REPORT.md flagged this: "LogbookScreen uses `key={e.date}` — will print React duplicate-key warnings." The `UNIQUE (user_id, date)` constraint on the database enforces the correct one-per-day behavior. The app code must be updated to use upsert semantics (insert or update) rather than always inserting. See Section 5 checkins table note.

**What must be written to Supabase on check-in:**
1. `checkins` INSERT (or upsert) row — one per day per user
2. `life_state` UPSERT (score, tier, streak, categories, rp, lastCheckIn, active_missions)

## D. Mission Flow

| Step | Data | Written to |
|---|---|---|
| Browse available missions | Mission library (seed data from mockData.ts) | Code only — no DB needed for MVP |
| Accept mission | `Mission` object with `status: 'active'` added to `activeMissions` | AppContext → AsyncStorage → `life_state.active_missions` JSONB update |
| Task toggle | `MissionTask.done` toggled, `progress` recomputed | AppContext → AsyncStorage → `life_state.active_missions` JSONB update |
| Mission complete | Mission removed from `activeMissions`, `rpEarned` awarded | AppContext → `mission_events` INSERT (type='completed', rp_earned, score_impact) + `life_state` update |
| Mission failed/abandoned | Mission removed from `activeMissions` | AppContext → `mission_events` INSERT (type='abandoned' or 'failed') + `life_state` update |
| Mission event history | `completedOperations` count for ProfileScreen | Derived from `mission_events` WHERE user_id = me AND event_type = 'completed' |

## E. Profile / Settings Flow

| Element | Current source | After Supabase |
|---|---|---|
| `handle` | AppContext `state.handle` | `profiles.handle` (user editable) |
| `displayName` | AppContext `state.displayName` | `profiles.display_name` |
| `joinedAt` | `mockProfile.joinedAt` hardcoded | `profiles.joined_at` |
| `avatarUrl` | Not used yet | `profiles.avatar_url` from OAuth metadata |
| Provider identity | Not shown yet | `profiles.provider_name` ('google' or 'apple') |
| Privacy toggles (share score, share categories) | Local `useState` in SettingsScreen — not persisted | `user_settings.share_score_visible`, `share_categories_visible` |
| Notification toggles (×4) | Local `useState` in SettingsScreen — not persisted | `user_settings.notif_*` columns |
| "Export data" | Opens Share sheet with JSON of current state | Same, but JSON should include remote data |
| "Reset calibration" | `reset()` → clears AsyncStorage + RESET dispatch → onboarding | Same + Supabase: delete `life_state`, delete `checkins`, delete `mission_events`, reset `profiles.is_calibrated` |
| "Delete local data" | Same as reset currently | Same as Reset Calibration for MVP |
| Sign out | **Does not exist yet** | `supabase.auth.signOut()` + clear AsyncStorage + dispatch RESET → AuthScreen |

## F. Share / Stat / Logbook Flow

| Element | Currently | After Supabase |
|---|---|---|
| ShareScreen poster data | Real from AppContext (score, tier, handle, categories) | Same — already wired |
| StatsScreen chart series | `state.logbook` (real after fix) or `mockTrend30D` fallback | Full `checkins` history fetched from Supabase |
| StatsScreen personal records | `mockPersonalRecords` (Q4 tiles still mock) | Computed from `life_state.pb_score`, `streak`, `mission_events` count |
| LogbookScreen entries | `state.logbook` (real after fix) or `mockLogbook` fallback | All `checkins` rows for this user |
| CategoryDetailScreen | `mockCategoryScores` + `mockLogbook` — still 100% mock | `life_state.categories` + filtered `checkins` for that category |
| WeeklyReportScreen | `mockWeeklyReport` entirely | Aggregated from `checkins` for ISO week — computed server-side or on-device |
| NotificationsScreen | `mockNotifications` entirely | Either Supabase `notifications` table (Later) or local computed events |

---

# 4. Mock Data Audit

Inspected: `src/design-system/mockData.ts`

## Classification of every mock data object

### `mockLifeScore` — `LifeScore`
- **Classification:** User-owned data that must move to Supabase (`life_state` table)
- Still referenced in `ShareScreen` (was replaced by AppContext in FIX_SUMMARY). No longer needed as a screen default once AppContext is fully wired.

### `mockCategoryScores` — `CategoryScore[]`
- **Classification:** User-owned data that must move to Supabase (`life_state.categories` JSONB)
- Used in `initialState` (AppContext line 64) as the fallback shape: `mockCategoryScores.map(c => ({ ...c, value: 5, delta: 0 }))`. This usage is fine — we only need the structure (category IDs), not the mock values.
- Still used in CategoryDetailScreen internals — needs to be replaced with `state.categories`.

### `mockActiveMissions` — `Mission[]`
- **Classification:** User-owned data that must move to Supabase (`life_state.active_missions` JSONB)
- Used as fallback in mission lookup chain in route files. After Supabase, active missions come from remote state.

### `mockAvailableMissions` — `Mission[]`
- **Classification:** Seed data that should remain in code (mission library)
- These are system-defined operations, not user-owned data. For MVP, the mission library stays in code. A `mission_library` DB table is a "Later" item.

### `mockCompletedMissions` — `Mission[]`
- **Classification:** Placeholder — future user-owned data from `mission_events` WHERE type='completed'
- For MVP, the Completed tab can remain mock or be omitted. Once `mission_events` table exists, derive real completed missions.

### `mockCheckInTags` — `CheckInTag[]`
- **Classification:** Seed data that should remain in code
- These are fixed system tags, not user data. No DB table needed.

### `CHECKIN_PROMPTS` — `Record<string, string>`
- **Classification:** Seed data / config that should remain in code
- Static prompt strings per category.

### `mockDiagnosis` — `Diagnosis`
- **Classification:** Derived data — computed from `applyCheckIn` output
- Never store Diagnosis directly. Recompute from category deltas on each check-in.

### `mockBuild` — `UserBuild`
- **Classification:** User-owned data that must move to Supabase (`life_state.build` JSONB)
- Assigned at calibration. Changes only on re-calibration.

### `mockTrend30D` — `ScorePoint[]`
- **Classification:** Derived data — computed from `checkins` table rows
- Never store separately. Derived by querying recent `checkins.life_score` in time order.

### `mockPersonalRecords` — `PersonalRecord[]`
- **Classification:** Derived data — computed from `life_state` and `mission_events`
- `LONGEST STREAK` → `life_state.pb_streak` (needs a new field) or compute from logbook
- `HIGHEST SCORE` → `life_state.pb_score` (already exists)
- `MISSIONS / MO` → count from `mission_events` in last 30 days
- `RANK PROMOS` → count from `checkins` WHERE tier changed upward

### `defaultShareConfig` — `ShareCardConfig`
- **Classification:** User-owned data, currently not persisted at all
- For MVP: store in `user_settings`. For now: local UI state is acceptable.

### `SHARE_HEADLINES` — `Record<string, string>`
- **Classification:** Seed data that should remain in code

### `mockUser` — `UserState`
- **Classification:** Aggregate mock — every field maps to real state
- Remove after AppContext is fully wired. Profile and settings screens already moved away from this.

### `mockVitals` — health signals (HRV, Focus, Energy)
- **Classification:** Future mock-only data — stays local/mock for now
- MVP_SCOPE.md marks Apple Health / Health Connect as "Later". No DB required now.

### `mockQuickActions` — config array
- **Classification:** Seed data that should remain in code (labels and colors, not user data)

### `mockSystemSignals` — `SystemSignal[]`
- **Classification:** Derived data — Momentum/Control/Friction computed from check-in history
- Momentum: 7-day Life Score slope (from `checkins` last 7 rows)
- Control: consistency (count of `checkins` in last 14 days)
- Friction: missed routines + abandoned missions (from `mission_events`)

### `mockNotifications` — `LRNotification[]`
- **Classification:** User-owned future data (`notifications` table)
- Marked as "Later" in MVP scope. Stay mock for MVP.

### `mockLogbook` — `LogbookEntry[]`
- **Classification:** User-owned data that must move to Supabase (`checkins` table)
- LogbookScreen currently falls back to mockLogbook when `state.logbook` is empty. After Supabase, remote `checkins` rows replace this.

### `mockWeeklyReport` — `WeeklyReport`
- **Classification:** Derived data (computed from `checkins` weekly aggregation)
- Marked as "Later" in FIX_SUMMARY. Stay mock for MVP.

### `mockCalibrationResult` — `CalibrationResult`
- **Classification:** Derived data — computed from calibration answers in CalibrationResultsScreen
- Never store. Recomputed each time from calibration step answers.

### `mockProfile` — static identity object
- **Classification:** User-owned data split across `profiles` + `life_state`
- `handle`, `displayName`, `joinedAt` → `profiles`
- `rankTier`, `buildId`, `personalBest` → `life_state`
- `longestStreak`, `completedOperations`, `totalCheckIns`, `rankPromotions` → derived from `checkins` + `mission_events`

### `mockMissionRules` — rules per mission ID
- **Classification:** Seed data that should remain in code
- Static content per mission. Part of the mission library.

### `mockCompletionSample` / `mockFailureSample`
- **Classification:** Placeholder / fallback data
- Used as fallback when the real mission can't be found by URL `id`. After Supabase + real mission IDs, these become unnecessary.

### `mockPromotionSample` / `mockDemotionRiskSample`
- **Classification:** Placeholder data
- The `RankPromotionScreen` should receive real tier-change data from the check-in flow (already called out in FIX_SUMMARY §7 as deferred). Not Supabase-related — this is a routing/prop issue.

---

# 5. Proposed Supabase Schema

Based on the actual current code. V1 mobile MVP — practical, can evolve.

## Table 1: `profiles`

**Purpose:** One row per authenticated user. Contains identity, join date, and OAuth provider info.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | — | Primary key. Set to `auth.uid()` from Supabase Auth. Same as `auth.users.id`. |
| `handle` | `text` | NOT NULL | — | User-chosen `@handle`. Must be prefixed with `@`. Example: `@kai.os`. |
| `display_name` | `text` | NOT NULL | — | Human-readable name. From OAuth metadata on first login. |
| `provider_name` | `text` | NOT NULL | — | `'google'` or `'apple'`. For display in Settings identity section. |
| `avatar_url` | `text` | NULL | `null` | From Google OAuth metadata. Null for Apple users (Apple doesn't provide photos). |
| `joined_at` | `timestamptz` | NOT NULL | `now()` | When the user first authenticated. Never updated. |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | Updated on profile changes. |

**Primary key:** `id`
**Indexes:** None additional for MVP (single-user-at-a-time access pattern)
**Unique constraints:** `handle` UNIQUE (so two users can't share a handle)

**Why this table exists:** Identity data needed across every screen. Separate from `life_state` because identity rarely changes while life state changes constantly.

**AppState fields that map to it:** `handle`, `displayName`. `initial` is derived, never stored.

**Screens that depend on it:** ProfileScreen, SettingsScreen, ShareScreen poster (handle), HomeScreen greeting (displayName).

---

## Table 2: `life_state`

**Purpose:** One row per user. Current "snapshot" of the user's entire LifeRank state. Upserted on every significant event (check-in, mission accept/complete, calibration).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Internal row ID. |
| `user_id` | `uuid` | NOT NULL | — | FK to `profiles.id`. |
| `is_calibrated` | `boolean` | NOT NULL | `false` | Route guard key. |
| `score` | `numeric(4,1)` | NOT NULL | `0` | 0.0 – 10.0. The life score. |
| `delta` | `numeric(4,1)` | NOT NULL | `0` | Delta vs previous check-in. |
| `tier` | `text` | NOT NULL | `'dormant'` | One of the 7 RankTierId values. Derived from score — stored for quick read. |
| `next_rank_at` | `numeric(4,1)` | NOT NULL | `3.0` | Score needed for next tier. |
| `streak` | `integer` | NOT NULL | `0` | Days of unbroken check-ins. |
| `pb_score` | `numeric(4,1)` | NULL | `null` | Personal best score ever. |
| `last_checkin` | `timestamptz` | NULL | `null` | ISO timestamp of last check-in. Used for streak alive check. |
| `rp` | `integer` | NOT NULL | `0` | Total RP earned. Monotonic. |
| `categories` | `jsonb` | NOT NULL | `'[]'` | Array of `CategoryScore` objects (5 items). See JSONB section. |
| `build` | `jsonb` | NULL | `null` | `UserBuild` object. Set at calibration. |
| `active_missions` | `jsonb` | NOT NULL | `'[]'` | Array of `Mission` objects currently in progress. |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | Bumped on every upsert. |

**Primary key:** `id`
**Foreign key:** `user_id` → `profiles.id`
**Unique constraint:** `user_id` UNIQUE (one row per user)
**Indexes:** `user_id` (covered by unique constraint)

**Why this table exists:** Centralizes the mutable "current state" separately from history. Avoids computing current state by replaying all `checkins`. AppContext hydrates from this table on login.

**AppState fields that map to it:** `isCalibrated`, `score.*`, `categories`, `activeMissions`, `build`, `rp`, `logbook` (indirectly — `logbook` maps to the `checkins` table, not here).

**Screens that depend on it:** HomeScreen, CheckInScreen, ResultsScreen, MissionsScreen, ProfileScreen, SettingsScreen, StatsScreen, ShareScreen, CategoryDetailScreen.

---

## Table 3: `checkins`

**Purpose:** Append-only log of every daily check-in. This is the source of truth for logbook, stats trend, weekly reports, and category history.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key. |
| `user_id` | `uuid` | NOT NULL | — | FK to `profiles.id`. |
| `date` | `date` | NOT NULL | — | ISO date `'YYYY-MM-DD'`. One check-in per user per day. |
| `life_score` | `numeric(4,1)` | NOT NULL | — | The life score after this check-in. |
| `delta` | `numeric(4,1)` | NOT NULL | `0` | Change from previous check-in. |
| `rank_tier` | `text` | NOT NULL | — | Tier at time of this check-in. |
| `streak_day` | `integer` | NOT NULL | — | Streak day count at time of this check-in. |
| `category_scores` | `jsonb` | NOT NULL | `'[]'` | Array of `CategoryScore` at time of check-in. For logbook history. |
| `raw_ratings` | `jsonb` | NULL | `null` | The original 1–10 ratings per category. For future audit/analytics. |
| `tags` | `text[]` | NOT NULL | `'{}'` | Check-in tags selected across all 5 category steps. |
| `note` | `text` | NULL | `null` | Optional text note from check-in. |
| `completed_mission_ids` | `text[]` | NOT NULL | `'{}'` | Mission IDs completed on this day. |
| `rp_earned` | `integer` | NOT NULL | `0` | RP earned in this check-in session. |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Server timestamp. |

**Primary key:** `id`
**Foreign key:** `user_id` → `profiles.id`
**Unique constraint:** `(user_id, date)` UNIQUE — one check-in per user per day (see decision below)
**Indexes:** `(user_id, date DESC)` — covers logbook queries, stats time series, and streak calculation

**Uniqueness Decision — Option A (chosen): Strict one-per-day with UNIQUE constraint.**

The current app does NOT prevent multiple check-ins on the same calendar day. The `SUBMIT_CHECKIN` reducer always prepends a new `LogbookEntry` regardless of whether today's date already exists in the logbook. QA_REPORT.md explicitly flagged this: "Duplicate logbook dates: Multiple check-ins in the same calendar day produce LogbookEntries with the same `date` string. LogbookScreen uses `key={e.date}` — will print React duplicate-key warnings but not crash."

Option A was chosen over Option B (no UNIQUE constraint, allow multiple per day) because:
- The product design is unambiguously "daily check-in" — one per day. The feature is named "Daily Check-In."
- Multiple same-day submissions corrupt the streak counter (inflated artificially), double-award RP, and produce duplicate logbook entries with identical dates that cause React key warnings.
- This is a missing guard, not an intended feature.

**Consequence for implementation:** `insertCheckin()` in `liferankSync.ts` must use PostgreSQL upsert semantics — `INSERT ... ON CONFLICT (user_id, date) DO UPDATE SET ...` — rather than a plain INSERT. The app code must also add a guard in `app/(tabs)/checkin.tsx` to detect whether today's check-in already exists (compare `state.logbook[0]?.date` to today's ISO date) and either block re-submission or treat it as an update to the existing day's row.

**Why this table exists:** The `logbook` in AppState (`LogbookEntry[]`) maps directly to rows here. This enables historical queries (stats trend, weekly report) without keeping the entire history in JSONB on `life_state`.

**AppState fields that map to it:** `logbook: LogbookEntry[]` — each entry becomes one row.

**Screens that depend on it:** LogbookScreen, StatsScreen (chart series, personal records), CategoryDetailScreen (category trend), WeeklyReportScreen (weekly aggregation).

---

## Table 4: `mission_events`

**Purpose:** Append-only event log for the mission lifecycle. Enables: completed operation count on ProfileScreen, mission history, and future analytics.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key. |
| `user_id` | `uuid` | NOT NULL | — | FK to `profiles.id`. |
| `mission_id` | `text` | NOT NULL | — | e.g. `'OP-118'`. References the mission library (in code). |
| `event_type` | `text` | NOT NULL | — | `'accepted'`, `'completed'`, `'failed'`, `'abandoned'`, `'task_toggled'` |
| `mission_snapshot` | `jsonb` | NULL | `null` | Full `Mission` object at time of event. For replay/audit. |
| `rp_earned` | `integer` | NOT NULL | `0` | RP earned from this event (0 for non-completion events). |
| `score_impact` | `numeric(4,1)` | NOT NULL | `0` | Score delta from mission reward (0 for non-completion events). |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Server timestamp. |

**Primary key:** `id`
**Foreign key:** `user_id` → `profiles.id`
**Indexes:** `(user_id, event_type)` — for counting completed operations on ProfileScreen; `(user_id, created_at DESC)` — for recent mission history

**Why this table exists:** When a mission is completed or abandoned, it is removed from `life_state.active_missions`. Without this table, there is no history of what missions a user has done. The `completedOperations` count on ProfileScreen requires it.

**AppState fields that map to it:** None directly — this is an event log that AppContext should write to but currently doesn't.

**Screens that depend on it:** ProfileScreen (completedOperations count), MissionsScreen (Completed tab), future mission history.

---

## Table 5: `user_settings`

**Purpose:** User preferences that should persist across devices. Currently these are local UI state only (privacy toggles, notification toggles) and are lost on reset.

**MVP Required:** Yes — the settings toggles (share privacy) need to survive device changes.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | — | Same as `auth.uid()`. One row per user. |
| `share_score_visible` | `boolean` | NOT NULL | `true` | Whether score is shown on share cards. |
| `share_categories_visible` | `boolean` | NOT NULL | `true` | Whether categories are shown on share cards. |
| `notif_mission_reminder` | `boolean` | NOT NULL | `true` | Mission reminder push notifications. |
| `notif_streak_risk` | `boolean` | NOT NULL | `true` | Streak at risk warning. |
| `notif_weekly_report` | `boolean` | NOT NULL | `true` | Weekly report ready notification. |
| `notif_rank_change` | `boolean` | NOT NULL | `true` | Rank promotion/demotion notification. |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | |

**Primary key:** `id` (references `profiles.id` / `auth.uid()`)
**Foreign key:** `id` → `profiles.id`

**Why this table exists:** Settings toggles currently live in local `useState` in `SettingsPrivacyScreen.tsx`. They are not persisted to AsyncStorage and are lost on app close. With Supabase, they become cloud-persisted and survive sign-out/sign-in.

**AppState fields that map to it:** None currently — `AppState` has no settings fields yet. Will need to add `settings: UserSettings` to AppState.

**Screens that depend on it:** SettingsPrivacyScreen.

---

## Table 6: `notifications` — **LATER**

**Reason:** NotificationsScreen is 100% mock (`mockNotifications`). There is no notification queue, no push token registration, no notification computation logic. Building a proper notification system requires `expo-notifications`, push token management, and server-side triggers. This is out of scope for the initial Supabase integration.

**When to implement:** After the core check-in + mission loop is cloud-synced and tested.

---

## Table 7: `weekly_reports` — **LATER**

**Reason:** WeeklyReportScreen is 100% mock (`mockWeeklyReport`). Computing a weekly report requires aggregating `checkins` for a given ISO week. This should be a computed view or a server function, not a manually-managed table. Implement after `checkins` is populated with real data.

**When to implement:** After 2–3 weeks of real check-in data exists to validate the computation.

---

## Table 8: `mission_library` — **LATER**

**Reason:** The mission library (`mockAvailableMissions`) is static seed data that lives in `mockData.ts`. For MVP there is no need for a database table — the available missions are the same for all users. A mission library table would be needed for: server-side mission filtering by tier, personalized recommendations, or admin-managed content. None of these are MVP requirements.

**When to implement:** When missions become personalized or admin-editable.

---

# 6. JSONB vs Normalized Tables Decision

## `categories` (5 CategoryScore objects per user)

**Decision: JSONB on `life_state`**

- Fixed set of exactly 5 items, always updated together after a check-in
- Never queried server-side by individual category for the current state row
- For historical per-category queries, `checkins.category_scores` JSONB is also acceptable since we query by user + date range, not by category value
- If we later need server-side queries like "users where discipline score > 8", we can add generated columns or a normalized table at that point
- Type safety maintained via TypeScript on the client

## `build` (single UserBuild object)

**Decision: JSONB on `life_state`**

- Single object, never queried or filtered server-side
- Set at calibration, only changes on re-calibration
- No analytics requirements on build composition for MVP

## `active_missions` (0–N Mission objects)

**Decision: JSONB on `life_state`**

- Typically 0–3 missions at a time (short list)
- Updated atomically when a mission is accepted, task-toggled, or completed
- Never queried server-side in isolation — always fetched as part of `life_state`
- Risk: if a mission has 20+ tasks, the JSONB blob grows, but still manageable for MVP
- Mission events (completed, failed) go to normalized `mission_events` table for queryability

## `check-in answers` (raw ratings per category)

**Decision: JSONB column `raw_ratings` on `checkins`**

- 5 key-value pairs per check-in
- Stored for audit trail and future analytics
- Not queried server-side for MVP
- Acceptable to store as JSONB `{"discipline": 8, "style": 7, ...}`

## `logbook entries` (historical check-ins)

**Decision: Normalized rows in `checkins` table**

- This is the most query-heavy data in the app: time-series chart, weekly report aggregation, logbook pagination
- Each check-in is a discrete event with a date primary key per user
- Normalized rows enable: `WHERE date > now() - interval '7 days'`, `ORDER BY date DESC LIMIT 14`, `AVG(life_score) GROUP BY week`
- **Do NOT store logbook as JSONB on life_state** — the array grows unboundedly and kills read performance

## `settings` (privacy + notification toggles)

**Decision: Flat columns on `user_settings`**

- Only 6 boolean fields for MVP
- All read together when SettingsScreen loads
- Easy to expand later without schema migrations (just add columns)
- JSONB would add indirection for no benefit

## `mission events` (accepted/completed/failed/abandoned)

**Decision: Normalized rows in `mission_events`**

- Each event is a discrete timestamped record
- Need to count completed operations (ProfileScreen)
- Need to filter by event type
- Append-only, never updated
- Normalized rows enable: `COUNT(*) WHERE event_type = 'completed'`, time-ordered queries

## `weekly reports`

**Decision: Later (skip for MVP)**

- Will be computed from `checkins` via a DB function or on-device aggregation
- No separate table needed if computed on demand

## `notification queue`

**Decision: Later (skip for MVP)**

- Too complex to design correctly without knowing push token requirements
- Stay mock for now

---

# 7. Row Level Security Requirements

All tables should have RLS enabled. Every user can only access their own data.

## `profiles`

| Policy | Condition | Notes |
|---|---|---|
| RLS | Enabled | |
| SELECT | `auth.uid() = id` | User reads only their own profile. |
| INSERT | `auth.uid() = id` | Profile created on first login by app code. |
| UPDATE | `auth.uid() = id` | User can update their own handle/displayName. |
| DELETE | **Disabled** | Profiles are not deleted at DB level. Mark inactive instead (if ever needed). |
| Public read | **Never** | No public profiles for MVP. |

## `life_state`

| Policy | Condition | Notes |
|---|---|---|
| RLS | Enabled | |
| SELECT | `auth.uid() = user_id` | |
| INSERT | `auth.uid() = user_id` | Only the user inserts their own state. |
| UPDATE | `auth.uid() = user_id` | All state changes go through the app. |
| DELETE | `auth.uid() = user_id` | Allowed for "Reset calibration" / "Delete data". |
| Public read | **Never** | |

## `checkins`

| Policy | Condition | Notes |
|---|---|---|
| RLS | Enabled | |
| SELECT | `auth.uid() = user_id` | |
| INSERT | `auth.uid() = user_id` | One per day — enforced by unique constraint. |
| UPDATE | **Disabled** | Check-ins are immutable once written. |
| DELETE | `auth.uid() = user_id` | For "Delete local data" / account deletion. |
| Public read | **Never** | |

## `mission_events`

| Policy | Condition | Notes |
|---|---|---|
| RLS | Enabled | |
| SELECT | `auth.uid() = user_id` | |
| INSERT | `auth.uid() = user_id` | App writes events on accept/complete/fail/abandon. |
| UPDATE | **Disabled** | Events are immutable — append only. |
| DELETE | `auth.uid() = user_id` | For account deletion. |
| Public read | **Never** | |

## `user_settings`

| Policy | Condition | Notes |
|---|---|---|
| RLS | Enabled | |
| SELECT | `auth.uid() = id` | |
| INSERT | `auth.uid() = id` | Created on first login with defaults. |
| UPDATE | `auth.uid() = id` | User changes toggles. |
| DELETE | **Disabled** | Soft-reset instead. |
| Public read | **Never** | |

---

# 8. Auth Requirements

## Auth Providers Required

- **Google Sign-In** — native on iOS + Android via `@react-native-google-signin/google-signin`
- **Apple Sign-In** — native on iOS via `expo-apple-authentication`; browser OAuth fallback on Android (Apple native is iOS-only)

**No email/password. No magic links. No OTP. No manual account creation. No guest mode.**

Supabase dashboard: Authentication → Providers → disable Email provider entirely.

---

## Google Sign-In — Native SDK Flow (iOS + Android)

**Source:** Official Supabase docs: Auth → Social Login → Google → React Native

**Package:** `@react-native-google-signin/google-signin`

**Cannot be tested in Expo Go.** Requires a development build (`npx expo run:ios` / `npx expo run:android`) or EAS build.

**How it works:**
1. Configure `GoogleSignin.configure({ webClientId: '<WEB_CLIENT_ID>' })` on app start
2. Call `GoogleSignin.signIn()` — opens the native credential picker (iOS: system sheet; Android: Play Services credential manager)
3. Receive `response.data.idToken`
4. Call `supabase.auth.signInWithIdToken({ provider: 'google', token: response.data.idToken })`
5. Supabase validates the ID token and creates/returns a session

This is **not** a browser redirect flow. No `expo-web-browser`, no `makeRedirectUri`, no `signInWithOAuth`.

**app.json config required (must add):**
```json
{
  "expo": {
    "plugins": [
      ["@react-native-google-signin/google-signin", {
        "iosUrlScheme": "com.googleusercontent.apps.<REVERSED_IOS_CLIENT_ID>"
      }]
    ]
  }
}
```

The `iosUrlScheme` value comes from the iOS OAuth Client ID in Google Cloud Console — reverse the client ID string (e.g. `1234-abcd.apps.googleusercontent.com` → `com.googleusercontent.apps.1234-abcd`).

**Google Cloud Console setup:**
1. Create project → APIs & Services → Credentials
2. Create OAuth 2.0 Web Client ID → Add `https://<project-ref>.supabase.co/auth/v1/callback` as redirect URI → copy for Supabase
3. Create iOS Client ID → Bundle ID: `com.liferank.app` → note the reversed ID for `iosUrlScheme`
4. Create Android Client ID → Package: `com.liferank.app` → SHA-1 fingerprint from `eas credentials` or `keytool`
5. Add Web Client ID + Secret to Supabase: Authentication → Providers → Google → Client ID + Secret

---

## Apple Sign-In — Native SDK Flow (iOS) + Browser Fallback (Android)

**Source:** Official Supabase docs: Auth → Social Login → Apple → React Native

**Package:** `expo-apple-authentication`

**iOS native — testable in Expo Go on iOS** (identifiers differ from standalone; for production use dev build). Apple native authentication is iOS-only. Android must use the browser OAuth fallback.

**How it works (iOS native):**
1. Check `AppleAuthentication.isAvailableAsync()` before showing the Apple button
2. Call `AppleAuthentication.signInAsync({ requestedScopes: [FULL_NAME, EMAIL] })`
3. Receive `credential.identityToken` and `credential.fullName`
4. **Immediately capture `fullName`** — Apple provides the name ONLY on the very first sign-in. On all subsequent sign-ins `fullName` will be null. Save it before calling Supabase.
5. Call `supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken, nonce })`
6. On profile creation: use the captured `fullName.givenName + familyName` as `display_name`

**app.json config required (must add):**
```json
{
  "expo": {
    "ios": {
      "usesAppleSignIn": true
    },
    "plugins": [
      "expo-apple-authentication"
    ]
  }
}
```

**Apple Developer Portal setup:**
1. App ID `com.liferank.app` → Capabilities → Sign In with Apple: **Enabled**
2. Keys → Create key → Sign In with Apple capability → Associate with `com.liferank.app` → Download `.p8` file (once only)
3. Note your Team ID and Key ID
4. Add to Supabase: Authentication → Providers → Apple → Team ID, Key ID, `.p8` contents, Bundle ID (`com.liferank.app`)
5. For Expo Go testing on iOS: add `host.exp.Exponent` to Apple provider Client IDs in Supabase dashboard

**No Services ID is needed** for the native `signInWithIdToken` flow. Services ID is only required for browser/web OAuth callback flow.

---

## Session Storage — LargeSecureStore Hybrid

**Source:** Official Supabase Expo tutorial: supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native

**Do NOT use plain AsyncStorage for Supabase session storage.**

`expo-secure-store` has a 2048-byte value size limit. Supabase session tokens (JWTs + refresh tokens) exceed this limit. The official recommendation is a `LargeSecureStore` class that:
- Generates an AES-256 encryption key via `crypto.getRandomValues()`
- Stores the encryption key in SecureStore
- Stores the encrypted session data in AsyncStorage

**Required packages (beyond `@supabase/supabase-js`):**
```bash
npx expo install expo-secure-store
npm install aes-js react-native-get-random-values
npm install --save-dev @types/aes-js
```

`src/lib/supabase.ts` must implement `LargeSecureStore` and pass it as the `storage` option:
```ts
import 'react-native-get-random-values';
export const supabase = createClient(url, key, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

## Expo Go Compatibility

| Feature | Expo Go iOS | Expo Go Android | Dev Build iOS | Dev Build Android |
|---|---|---|---|---|
| Google Sign-In | Not supported | Not supported | ✅ Works | ✅ Works |
| Apple Sign-In (native) | ✅ Testable (limited) | Not applicable | ✅ Works | Not applicable |
| Apple Sign-In (browser fallback) | N/A | Requires dev build | N/A | ✅ Works |
| Supabase session (LargeSecureStore) | ✅ Works | ✅ Works | ✅ Works | ✅ Works |

For initial development: test Apple Sign-In first in Expo Go on iOS. Test Google Sign-In only with a dev build.

---

## How Auth State Should Interact with RouteGuard

**Current RouteGuard logic (`app/_layout.tsx:24-43`):**
```
if (!isHydrated) return null
if (!isCalibrated && !inOnboarding) → redirect to /(onboarding)
if (isCalibrated && inOnboarding) → redirect to /(tabs)
```

**Required RouteGuard logic after Supabase:**
```
if (!isHydrated) return null                          // wait for storage + auth check
if (!session && !inAuth) → redirect to /auth          // new: no session → auth screen
if (session && !isCalibrated && !inOnboarding) → redirect to /(onboarding)
if (session && isCalibrated && inOnboarding) → redirect to /(tabs)
if (session && isCalibrated && inAuth) → redirect to /(tabs)
```

A new `isAuthenticated: boolean` derived from the Supabase session must be exposed from `AuthProvider` and read by `RouteGuard`. The guard must wait for both AsyncStorage hydration AND the session check to complete before navigating.

**The 3 states the app must show:**
1. AuthScreen — no Supabase session
2. OnboardingScreen — has session, `!isCalibrated`
3. MainTabs — has session, `isCalibrated`

---

# 9. Sync Architecture

## Recommendation: Supabase as Source of Truth, AsyncStorage as Write-Through Cache

**Why this recommendation:**
- No guest mode means every user is authenticated — remote data is always available
- A write-through cache (write to both simultaneously) keeps the app responsive while ensuring remote is always up-to-date
- Simpler than a local-first CRDT approach which the current codebase is not designed for
- The current AsyncStorage pattern (write on every state change) maps cleanly to "also write to Supabase simultaneously"

**What stays in AsyncStorage:**
- Cached copies of everything from Supabase (for offline and fast hydration)
- The auth session token (managed by Supabase client automatically)

**What goes to Supabase:**
- `profiles` — written on first login, updated on profile changes
- `life_state` — upserted on every significant state change
- `checkins` — inserted once per check-in, never updated
- `mission_events` — inserted on every mission lifecycle event
- `user_settings` — upserted on toggle changes

## Event-by-Event Sync Behavior

| Event | Local (AsyncStorage) | Remote (Supabase) | Notes |
|---|---|---|---|
| **App start with session** | Hydrate from AsyncStorage (fast) | Fetch `life_state` + recent `checkins` in background; merge if remote is newer | Show UI immediately; update silently |
| **App start without session** | Ignore | Navigate to AuthScreen | AsyncStorage may still have old data from previous session |
| **After calibration** | Write all state via `setIsCalibrated`, `setLifeScore`, etc. | INSERT `profiles` if not exists; UPSERT `life_state`; INSERT `user_settings` defaults | Calibration creates the user's cloud record for the first time |
| **After daily check-in** | Write via persistence effect (already works) | INSERT `checkins` row; UPSERT `life_state` | Two writes: the history entry + the current state |
| **After mission accept** | Write `activeMissions` via persistence effect | UPSERT `life_state.active_missions`; INSERT `mission_events` (type='accepted') | |
| **After mission complete** | Write `activeMissions` (mission removed) via persistence | UPSERT `life_state.active_missions`; INSERT `mission_events` (type='completed', rp_earned) | |
| **After mission fail/abandon** | Write `activeMissions` (mission removed) via persistence | UPSERT `life_state.active_missions`; INSERT `mission_events` (type='abandoned' or 'failed') | |
| **After settings change** | Not currently persisted — must add | UPSERT `user_settings` | Must also add settings to AppState |
| **After "Reset calibration"** | `clearAllAppData()` (already works) | DELETE FROM `life_state` WHERE user_id = me; DELETE FROM `checkins` WHERE user_id = me; DELETE FROM `mission_events` WHERE user_id = me; UPDATE `profiles` SET handle=default, display_name=default | Keep `profiles` row — user is still authenticated. Reset their data only. |
| **After "Delete local data"** | Same as reset | Same as reset | For MVP, "delete local" and "reset calibration" can have the same behavior |
| **After sign out** | `clearAllAppData()` + dispatch RESET | `supabase.auth.signOut()` | Navigate to AuthScreen |
| **If Supabase sync fails** | Already written to AsyncStorage — app continues | Queue the failure; retry on next network event | Use fire-and-forget with silent retry for non-critical writes. For check-in: show a subtle "sync pending" indicator in the logbook. |
| **When remote data is newer than local** | Overwrite AsyncStorage with remote data | Trust remote | On login: remote always wins. This handles the multi-device scenario correctly. |
| **When local data has no remote counterpart** | Keep local | Migrate local data to remote | See Section 10 — Data Migration. |

## What remote data overwrites local

Remote always wins on login. The one exception: if the user has completed check-ins while offline since their last login, those should be pushed to remote (not overwritten). This is an offline-sync edge case — for MVP, design around it by requiring network for check-in submission.

---

# 10. Data Migration Plan

## Situation: User already has local data in AsyncStorage

Because this is an MVP in development with no real users yet, the migration strategy can be simple and opinionated.

| Scenario | Action |
|---|---|
| **User logs in for the first time (no remote row)** AND local `isCalibrated = false` | Start fresh. No migration needed. Normal onboarding. |
| **User logs in for the first time (no remote row)** AND local `isCalibrated = true` | **Migrate local data to remote.** Silently upload the local `life_state`, `checkins` (logbook), `mission_events` (none currently — they were never tracked). Show a brief "Syncing your data..." indicator. |
| **User logs in and remote row exists** | Remote wins. Download remote data, overwrite local cache. Do not ask the user. |
| **Both local and remote exist, with different data** | Remote wins. This is the safest choice: the remote copy was last written by an authenticated user session. |
| **Local data exists but no Supabase session** | Do not show local data. Route to AuthScreen. This enforces the "no guest mode" rule. |

## Conflict Resolution Strategy

**Recommendation: Last-write-wins via `updated_at` timestamp.**

On login:
1. Check `life_state.updated_at` from Supabase
2. Check `lr:lifeScore` `lastCheckIn` timestamp from AsyncStorage
3. If remote `updated_at` > local `lastCheckIn` → use remote
4. If local `lastCheckIn` > remote `updated_at` → migrate local to remote silently

## What to offer the user

**Recommendation: Do not offer a choice for MVP. Silently use remote as source of truth.**

Reasons:
- No real users yet, no real data loss risk
- Presenting a "keep this device data or remote data?" modal creates friction at the critical login moment
- The dev team controls the data and can manually resolve issues
- When there are real users, a more sophisticated merge can be built

## Safest choice for MVP

Silently migrate local-only data to remote when logging in for the first time with no remote record. After that, always prefer remote. Never ask the user.

---

# 11. App Code Changes Needed Later

This section lists every file that must change when Supabase is implemented. No changes are made now.

## New Files to Create

| File | Purpose | Risk | Touches UI | Touches State | Touches Persistence | Touches Routing |
|---|---|---|---|---|---|---|
| `src/lib/supabase.ts` | Supabase client singleton. Implements `LargeSecureStore` hybrid class (AES-256 encryption key in SecureStore, encrypted session data in AsyncStorage). Initializes `@supabase/supabase-js` with that storage adapter. Must import `react-native-get-random-values` at the very top. | Low | No | No | **Yes** | No |
| `src/auth/AuthProvider.tsx` | React Context that wraps `AppProvider`. Holds Supabase session state. Listens to `supabase.auth.onAuthStateChange`. Exposes `session`, `isAuthenticated`, `signInWithGoogle()`, `signInWithApple()`, `signOut()`. Handles Apple `fullName` capture on first sign-in. | Medium | No | Yes — adds session to context | No | No |
| `src/screens/AuthScreen.tsx` | New screen: "Continue with Google" and "Continue with Apple" buttons only. Uses existing design system (AtmosphereBackground, HudCard, PrimaryCTA). No mock data. | Low | **Yes** | No | No | No |
| `app/auth.tsx` | New route file: renders AuthScreen. | Low | No | No | No | **Yes** |
| `src/services/liferankSync.ts` | Sync service: functions for `syncLifeState()`, `insertCheckin()` (upsert semantics), `insertMissionEvent()`, `upsertSettings()`, `migrateLocalToRemote()`, `fetchRemoteState()`. | High | No | No | **Yes** | No |
| `supabase/migrations/001_initial_liferank.sql` | SQL migration: creates all 5 MVP tables + RLS policies. | High | No | No | No | No |
| `SUPABASE_SETUP.md` | Manual dashboard setup checklist (from Section 13 of this report). | None | No | No | No | No |
| `SUPABASE_INTEGRATION_SUMMARY.md` | Summary of what was implemented, what keys do what, how to test. | None | No | No | No | No |

## Existing Files to Modify

| File | What Changes | Risk | UI | State | Persistence | Routing |
|---|---|---|---|---|---|---|
| `app/_layout.tsx` | RouteGuard must check session (from AuthProvider) before routing decisions. Add `/auth` route to Stack. | **High** | No | **Yes** | No | **Yes** |
| `src/store/AppContext.tsx` | Wrap with or merge AuthProvider. Add `isAuthenticated` derived from session. Add `settings` to AppState. Add `signOut` helper. | **High** | No | **Yes** | No | No |
| `src/storage/appStorage.ts` | Add `KEYS.USER_SETTINGS` key + getter/setter. Remove dead keys `STREAK` and `LAST_CHECKIN`. | Low | No | No | **Yes** | No |
| `app/(tabs)/checkin.tsx` | After `submitCheckIn`, call `liferankSync.syncLifeState()` and `liferankSync.insertCheckin()`. | Medium | No | No | **Yes** | No |
| `app/(onboarding)/results.tsx` | After `calibrate()`, call `liferankSync.syncLifeState()` to write initial state to Supabase. | Medium | No | No | **Yes** | No |
| `app/mission/[id].tsx` | After accept/complete/abandon, call `liferankSync.syncLifeState()` + `liferankSync.insertMissionEvent()`. | Medium | No | No | **Yes** | No |
| `app/settings.tsx` | Wire privacy/notification toggle changes to `liferankSync.upsertSettings()`. Add "Sign Out" button. | Medium | No | No | **Yes** | No |
| `app/profile.tsx` | Display `joinedAt` from Supabase profile, `avatarUrl`, provider badge. | Low | **Yes** | No | No | No |
| `src/screens/SettingsPrivacyScreen.tsx` | Add `onSignOut` prop. Add sign-out row to the action list. | Low | **Yes** | No | No | No |
| `.env` (new file) | `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Low | No | No | No | No |

---

# 12. Environment Variables and Config

## Required Environment Variables

| Variable | Where Used |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `src/lib/supabase.ts` — `createClient(url, key)` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/supabase.ts` — `createClient(url, key)` |

These must be prefixed `EXPO_PUBLIC_` to be inlined into the Expo JS bundle. They are safe to expose (the anon key is a public, RLS-protected key by design).

**Note:** Create a `.env` file at the project root. Ensure `.env` is in `.gitignore` (check if this exists). For production, set these in `EAS Build` secrets or `eas.json`.

## app.json / app.config.js Changes Needed

| Item | Current Status | Change Required |
|---|---|---|
| `scheme` | `"liferank"` — already set | No change needed for native auth. Scheme not used for Google/Apple native sign-in (no browser redirect). |
| `ios.bundleIdentifier` | `"com.liferank.app"` — already set | No change needed. Required by Google Cloud Console and Apple Developer Portal. |
| `android.package` | `"com.liferank.app"` — already set | No change needed. Required by Google Cloud Console for SHA-1 fingerprint setup. |
| `ios.usesAppleSignIn` | **Not set** | **Must add** `"usesAppleSignIn": true` under `"ios"`. Required for `expo-apple-authentication` and App Store compliance. |
| `plugins` | `["expo-router", "expo-status-bar", "expo-splash-screen"]` | **Must add:** `"expo-apple-authentication"` plugin. **Must add:** `["@react-native-google-signin/google-signin", { "iosUrlScheme": "com.googleusercontent.apps.<REVERSED_CLIENT_ID>" }]` plugin. |
| Android intent filters | Not in app.json | **Not needed** — Google Sign-In on Android uses Play Services natively, not a URL redirect. Apple Sign-In browser fallback on Android may need the scheme, but that is lower priority. |
| `expo-web-browser` plugin | Not in plugins | **Not needed** — native SDK flows do not use the browser. |

---

# 13. Exact Supabase Dashboard Setup Needed

These are the manual dashboard steps required when we begin implementation. Do not do these yet.

## Step-by-step Supabase Setup

1. **Create Supabase project**
   - Go to supabase.com → New Project
   - Name: `liferank` (or `liferank-dev` for development)
   - Choose region closest to users (EU or US East)
   - Copy the project URL and anon key immediately

2. **Get URL and anon key**
   - Project Settings → API
   - Copy `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Paste into `.env` file

3. **Disable email/password auth**
   - Authentication → Providers → Email → **Disable**
   - This ensures no user can accidentally create a password account

4. **Enable Google provider (Supabase dashboard)**
   - Authentication → Providers → Google → Enable
   - Copy the Supabase callback URL shown: `https://<project-ref>.supabase.co/auth/v1/callback`
   - You will enter Web Client ID + Secret here (get them from step 5)

5. **Create Google OAuth Clients (Google Cloud Console)**
   - APIs & Services → Credentials → Create OAuth Client ID
   - **Web Client** → Add `https://<project-ref>.supabase.co/auth/v1/callback` as authorized redirect URI → copy Client ID + Secret → paste into Supabase Google provider
   - **iOS Client** → Application type: iOS → Bundle ID: `com.liferank.app` → note the Client ID → reverse it for `iosUrlScheme` in app.json (e.g. `com.googleusercontent.apps.<id>`)
   - **Android Client** → Application type: Android → Package: `com.liferank.app` → SHA-1 fingerprint (run `eas credentials` or `keytool -list -v -keystore ~/.android/debug.keystore`)
   - In app, use the **Web Client ID** in `GoogleSignin.configure({ webClientId: '<WEB_CLIENT_ID>' })`

6. **Enable Apple provider (Supabase dashboard)**
   - Authentication → Providers → Apple → Enable
   - Enter: Team ID (from Apple Developer account), Key ID (from the key you create in step 7), `.p8` file contents, Bundle ID: `com.liferank.app`
   - For Expo Go testing: also add `host.exp.Exponent` as an additional Client ID
   - No Services ID is needed for the native `signInWithIdToken` flow

7. **Apple Developer Portal setup**
   - Certificates, Identifiers & Profiles → App IDs → `com.liferank.app` → Edit → Capabilities → Sign In with Apple: **Enable**
   - Keys → "+" → Name it → Enable "Sign In with Apple" → Configure → Primary App ID: `com.liferank.app` → Save → Register → Download `.p8` (download once — cannot re-download)
   - Note your Team ID (top-right of Apple Developer account) and Key ID (from the key detail)

8. **Configure redirect URLs in Supabase**
   - Authentication → URL Configuration
   - Site URL: `https://localhost:8081` (for web dev; update to production URL later)
   - Additional redirect URLs: `liferank://auth/callback` (for browser fallback on Android/web)
   - Native SDK flows (Google + Apple iOS) do NOT use these redirect URLs — they go through `signInWithIdToken` directly

9. **Run SQL migration**
   - SQL Editor → New query → paste the full migration SQL (from `supabase/migrations/001_initial_liferank.sql`)
   - This creates: `profiles`, `life_state`, `checkins`, `mission_events`, `user_settings`
   - This enables RLS and creates all policies
   - Run and verify 0 errors

10. **Check RLS policies**
    - Authentication → Policies
    - Verify each table has enabled RLS and the correct policies appear

11. **Test user creation**
    - Authentication → Users — initially empty
    - Run the app on web with `EXPO_PUBLIC_SUPABASE_URL` and key set
    - Attempt Google Sign-In
    - Verify a new user appears in Authentication → Users
    - Verify a row appears in `profiles` via Table Editor

---

# 14. MVP vs Later Database Scope

## MVP Required (must be implemented before real users can test)

| Item | Reason |
|---|---|
| `profiles` table | Stores identity. Required for auth to work. |
| `life_state` table | Stores all current app state. Required for sync. |
| `checkins` table | Stores daily check-in history. Required for logbook to survive sign-out. |
| `mission_events` table | Stores mission lifecycle. Required for `completedOperations` count on Profile. |
| `user_settings` table | Stores privacy/notification toggles. Required for settings to persist across devices. |
| RLS on all 5 tables | Required for security before any real users test. |
| Google OAuth | Required for Android + web testing. |
| Apple OAuth | Required for iOS App Store compliance (Apple requires Sign In with Apple if any other OAuth is offered). |
| `src/lib/supabase.ts` | Client singleton. |
| `src/auth/AuthProvider.tsx` | Session management. |
| `app/auth.tsx` + `AuthScreen.tsx` | The only way into the app. |
| RouteGuard update | Gate on session, not just `isCalibrated`. |
| `liferankSync.ts` with `syncLifeState()` + `insertCheckin()` | Core sync on check-in. |
| `.env` with env vars | Required for any dev testing. |
| Migration SQL file | Required to create schema. |

## MVP Nice (useful but not required immediately)

| Item | Reason |
|---|---|
| `user_settings` sync | Privacy toggles are nice to persist but the app works without it. Could be Phase 2. |
| `mission_events` INSERT on accept | Nice for history but ProfileScreen works with mock count for now. |
| Profile `avatarUrl` display | The UI handles missing avatar gracefully (initial letter instead). |
| Data migration from local AsyncStorage | Only matters for internal dev team who have existing local data. |
| Offline sync retry queue | Nice for reliability but not required for MVP. |

## Later (do not implement now)

| Item | Reason |
|---|---|
| `notifications` table | NotificationsScreen stays mock. Push token management is a large separate feature. |
| `weekly_reports` table | WeeklyReportScreen stays mock. Requires aggregation logic. |
| `mission_library` table | Mission library stays in code. No admin editing needed yet. |
| Social features (public profiles, rival mode, leaderboards) | All listed as "Later" in MVP_SCOPE.md. |
| Apple Health integration | Listed as "Later" in MVP_SCOPE.md. |
| Widgets, Watch app | Listed as "Later" in MVP_SCOPE.md. |
| Admin dashboard | No admin needs yet. |
| Analytics / telemetry tables | Design after real usage patterns emerge. |

---

# 15. Final Recommended Database Prompt

---

## FINAL PROMPT FOR SUPABASE IMPLEMENTATION

> Copy this entire block and use it to start the Supabase implementation session.

---

You are implementing Supabase Auth + cloud database for LifeRank, a React Native / Expo SDK 56 app.

**Read the Expo Supabase documentation at https://docs.expo.dev/versions/v56.0.0/ and https://supabase.com/docs before writing any code.**

The current codebase is at: `c:\Claude\LifeRank`

The app is fully wired for local-only operation with AsyncStorage. TypeScript compiles clean. All routes are reachable. The next step is adding auth + cloud sync.

---

### AUTH REQUIREMENTS

**Only these two providers:**
- Continue with Google (iOS + Android, native SDK)
- Continue with Apple (iOS, native SDK; browser fallback on Android)

**No email/password. No magic links. No OTP. No manual account creation. No guest mode.**

Disable the Email provider in the Supabase dashboard before writing any code.

**Auth flow the app must show:**
1. No session → `app/auth.tsx` (AuthScreen) with two buttons only
2. Session + `!is_calibrated` → `/(onboarding)` (existing flow, unchanged)
3. Session + `is_calibrated` → `/(tabs)` (existing flow, unchanged)

The existing RouteGuard in `app/_layout.tsx` must be updated to check session first.

---

### PACKAGES TO INSTALL

```bash
# Supabase JS client
npm install @supabase/supabase-js

# Session storage — LargeSecureStore hybrid (official Supabase Expo recommendation)
npx expo install expo-secure-store
npm install aes-js react-native-get-random-values
npm install --save-dev @types/aes-js

# Google Sign-In — native SDK (cannot be tested in Expo Go)
npm install @react-native-google-signin/google-signin

# Apple Sign-In — native iOS (testable in Expo Go on iOS)
npx expo install expo-apple-authentication
```

Do NOT install `expo-web-browser` — native Google/Apple SDK flows do not open a browser.
Do NOT install `expo-auth-session` — not used with `signInWithIdToken` pattern.
Do NOT install `react-native-url-polyfill` — not required with this auth approach.
Do NOT install any additional state management libraries.

---

### AUTH IMPLEMENTATION — EXACT APPROACH

#### Google Sign-In (iOS + Android)
Uses `@react-native-google-signin/google-signin`. **Cannot use Expo Go — requires dev build.**

```ts
// Configure once on app start (in AuthProvider or App entry)
GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });

// On button press:
async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (isSuccessResponse(response)) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.data.idToken,
    });
  }
}
```

#### Apple Sign-In (iOS native, Android browser fallback)
Uses `expo-apple-authentication`. **Testable in Expo Go on iOS.**

**Critical: Capture fullName BEFORE calling Supabase — Apple only sends it on first sign-in.**

```ts
async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  // Save name immediately — will be null on all future sign-ins
  const displayName = [
    credential.fullName?.givenName,
    credential.fullName?.familyName,
  ].filter(Boolean).join(' ') || 'LifeRanker';

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  // On first sign-in: use displayName to create/update profiles row
}
```

#### Session Storage — LargeSecureStore
`expo-secure-store` has a 2048-byte limit. Supabase tokens exceed this. Use the official `LargeSecureStore` pattern from the Supabase Expo tutorial:

```ts
// src/lib/supabase.ts — must be at the very top of this file:
import 'react-native-get-random-values';
// ... LargeSecureStore class implementation (AES-256 key in SecureStore, data in AsyncStorage)
export const supabase = createClient(url, anonKey, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

#### app.json additions required
```json
{
  "expo": {
    "ios": {
      "usesAppleSignIn": true
    },
    "plugins": [
      "expo-router",
      "expo-status-bar",
      "expo-splash-screen",
      "expo-apple-authentication",
      ["@react-native-google-signin/google-signin", {
        "iosUrlScheme": "com.googleusercontent.apps.<REVERSED_IOS_CLIENT_ID>"
      }]
    ]
  }
}
```

#### Additional env var required
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web client id from Google Cloud Console>
```

---

### ENVIRONMENT VARIABLES

Create `.env` at project root:
```
EXPO_PUBLIC_SUPABASE_URL=<from dashboard>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<from dashboard>
```

Ensure `.env` is in `.gitignore`. For production use EAS secrets.

---

### DATABASE SCHEMA — EXACT SQL

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id            uuid        PRIMARY KEY DEFAULT auth.uid(),
  handle        text        NOT NULL,
  display_name  text        NOT NULL,
  provider_name text        NOT NULL,       -- 'google' | 'apple'
  avatar_url    text,
  joined_at     timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_handle_unique UNIQUE (handle)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- LIFE STATE (current snapshot — one row per user)
-- ────────────────────────────────────────────────────────────
CREATE TABLE life_state (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_calibrated    boolean     NOT NULL DEFAULT false,
  score            numeric(4,1) NOT NULL DEFAULT 0,
  delta            numeric(4,1) NOT NULL DEFAULT 0,
  tier             text        NOT NULL DEFAULT 'dormant',
  next_rank_at     numeric(4,1) NOT NULL DEFAULT 3.0,
  streak           integer     NOT NULL DEFAULT 0,
  pb_score         numeric(4,1),
  last_checkin     timestamptz,
  rp               integer     NOT NULL DEFAULT 0,
  categories       jsonb       NOT NULL DEFAULT '[]',
  build            jsonb,
  active_missions  jsonb       NOT NULL DEFAULT '[]',
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT life_state_user_unique UNIQUE (user_id)
);

CREATE INDEX life_state_user_idx ON life_state(user_id);
ALTER TABLE life_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "life_state_select_own" ON life_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "life_state_insert_own" ON life_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "life_state_update_own" ON life_state FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "life_state_delete_own" ON life_state FOR DELETE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- CHECKINS (daily log — maps to LogbookEntry[])
-- One row per user per day enforced by UNIQUE (user_id, date).
-- App must use upsert (ON CONFLICT DO UPDATE) not plain INSERT.
-- ────────────────────────────────────────────────────────────
CREATE TABLE checkins (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date                  date        NOT NULL,
  life_score            numeric(4,1) NOT NULL,
  delta                 numeric(4,1) NOT NULL DEFAULT 0,
  rank_tier             text        NOT NULL,
  streak_day            integer     NOT NULL,
  category_scores       jsonb       NOT NULL DEFAULT '[]',
  raw_ratings           jsonb,
  tags                  text[]      NOT NULL DEFAULT '{}',
  note                  text,
  completed_mission_ids text[]      NOT NULL DEFAULT '{}',
  rp_earned             integer     NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT checkins_user_date_unique UNIQUE (user_id, date)
);

CREATE INDEX checkins_user_date_idx ON checkins(user_id, date DESC);
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkins_select_own" ON checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "checkins_insert_own" ON checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "checkins_delete_own" ON checkins FOR DELETE USING (auth.uid() = user_id);
-- No UPDATE policy — check-ins are immutable.

-- ────────────────────────────────────────────────────────────
-- MISSION EVENTS (append-only lifecycle log)
-- ────────────────────────────────────────────────────────────
CREATE TABLE mission_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_id       text        NOT NULL,
  event_type       text        NOT NULL,  -- 'accepted'|'completed'|'failed'|'abandoned'
  mission_snapshot jsonb,
  rp_earned        integer     NOT NULL DEFAULT 0,
  score_impact     numeric(4,1) NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mission_events_user_type_idx ON mission_events(user_id, event_type);
CREATE INDEX mission_events_user_time_idx ON mission_events(user_id, created_at DESC);
ALTER TABLE mission_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mission_events_select_own" ON mission_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mission_events_insert_own" ON mission_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mission_events_delete_own" ON mission_events FOR DELETE USING (auth.uid() = user_id);
-- No UPDATE policy — events are immutable.

-- ────────────────────────────────────────────────────────────
-- USER SETTINGS (privacy + notification preferences)
-- ────────────────────────────────────────────────────────────
CREATE TABLE user_settings (
  id                       uuid        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  share_score_visible      boolean     NOT NULL DEFAULT true,
  share_categories_visible boolean     NOT NULL DEFAULT true,
  notif_mission_reminder   boolean     NOT NULL DEFAULT true,
  notif_streak_risk        boolean     NOT NULL DEFAULT true,
  notif_weekly_report      boolean     NOT NULL DEFAULT true,
  notif_rank_change        boolean     NOT NULL DEFAULT true,
  updated_at               timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_settings_select_own" ON user_settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_settings_insert_own" ON user_settings FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_settings_update_own" ON user_settings FOR UPDATE USING (auth.uid() = id);
```

---

### FILES TO CREATE

1. **`.env`** — `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
2. **`src/lib/supabase.ts`** — Import `react-native-get-random-values` at the very top. Implement `LargeSecureStore` class (AES-256 key in SecureStore, encrypted session in AsyncStorage). Initialize `createClient` with `LargeSecureStore` as the `auth.storage` option. Do NOT use plain AsyncStorage for auth storage.
3. **`src/auth/AuthProvider.tsx`** — React Context wrapping AppProvider. Listens to `supabase.auth.onAuthStateChange`. Exposes `session`, `isAuthenticated`, `signInWithGoogle()`, `signInWithApple()`, `signOut()`. Handles Apple `fullName` capture before calling Supabase (first sign-in only). Configures `GoogleSignin.configure()` on mount.
4. **`src/screens/AuthScreen.tsx`** — New screen. Two buttons only: "Continue with Google" and "Continue with Apple". No other login options. Use existing design system (AtmosphereBackground, HudCard, PrimaryCTA). No mock data.
5. **`app/auth.tsx`** — New route file. Renders AuthScreen. Stack.Screen registered in `app/_layout.tsx`.
6. **`src/services/liferankSync.ts`** — Sync service with these exports:
   - `syncLifeState(state: AppState): Promise<void>` — upserts `life_state` row
   - `insertCheckin(entry: LogbookEntry, rpEarned: number): Promise<void>` — upserts one `checkins` row (INSERT ... ON CONFLICT (user_id, date) DO UPDATE) — enforces one check-in per day
   - `insertMissionEvent(userId: string, event: MissionEventPayload): Promise<void>` — inserts one `mission_events` row
   - `migrateLocalToRemote(state: AppState): Promise<void>` — called once on first login if remote has no data
   - `fetchRemoteState(userId: string): Promise<RemoteState | null>` — fetches `life_state` + recent `checkins`
   - `upsertSettings(settings: UserSettings): Promise<void>`
7. **`supabase/migrations/001_initial_liferank.sql`** — The exact SQL above.
8. **`SUPABASE_SETUP.md`** — Manual dashboard setup checklist.

---

### FILES TO MODIFY

1. **`app/_layout.tsx`** — Update RouteGuard to check `isAuthenticated` (from AuthProvider) before `isCalibrated`. Add `<Stack.Screen name="auth" ...>`. Wrap `<AppProvider>` inside `<AuthProvider>`.
2. **`src/store/AppContext.tsx`** — Add `UserSettings` to AppState (for settings toggles). Add `settings` to `initialState`. Add `SET_SETTINGS` action. Update persistence effect to call `liferankSync.syncLifeState()` for major state changes. Add `signOut` helper that calls Supabase signOut + clears storage + dispatches RESET.
3. **`src/storage/appStorage.ts`** — Add `KEYS.USER_SETTINGS` + `getUserSettings()` / `setUserSettings()`. Remove dead keys `STREAK` and `LAST_CHECKIN` from the KEYS object and from `clearAllAppData()`.
4. **`app/(tabs)/checkin.tsx`** — After successful `submitCheckIn`, call `liferankSync.insertCheckin()` + `liferankSync.syncLifeState()` in a non-blocking way. Do not await — let it run in background.
5. **`app/(onboarding)/results.tsx`** — After `calibrate()` + `router.replace`, call `liferankSync.syncLifeState()` to write initial state to Supabase.
6. **`app/mission/[id].tsx`** — After accept/complete/abandon, call `liferankSync.insertMissionEvent()` + `liferankSync.syncLifeState()`.
7. **`app/settings.tsx`** — Add "Sign Out" button at bottom of action list. Wire `onSignOut` to AuthProvider `signOut()`. Wire toggle changes to `liferankSync.upsertSettings()`.
8. **`src/screens/SettingsPrivacyScreen.tsx`** — Add `onSignOut?: () => void` prop. Add sign-out row to the destructive actions section.

---

### SYNC STRATEGY

**Source of truth: Supabase.**
**Local: AsyncStorage write-through cache.**

- On app start with session: hydrate from AsyncStorage immediately (fast), then fetch from Supabase in background and merge if remote is newer.
- All writes go to AsyncStorage first (existing behavior), then to Supabase in the background (fire-and-forget with silent retry).
- Remote always wins on login. If remote has data, overwrite local.
- If user has local data and no remote record (first login): call `migrateLocalToRemote()`.

---

### NO-GO RULES — DO NOT IMPLEMENT

- Do NOT add guest mode or anonymous auth
- Do NOT add email/password login
- Do NOT add magic link or OTP
- Do NOT use `supabase.auth.signInWithOAuth` + `expo-web-browser` for Google or Apple on native (use native SDKs instead)
- Do NOT use plain AsyncStorage as the Supabase auth storage adapter (use LargeSecureStore)
- Do NOT install `expo-auth-session` (not needed for native signInWithIdToken pattern)
- Do NOT install `expo-web-browser` (not needed for native sign-in)
- Do NOT install `react-native-url-polyfill` (not needed with this approach)
- Do NOT use plain INSERT for `checkins` — always use upsert with ON CONFLICT (user_id, date) DO UPDATE
- Do NOT create a `notifications` table (NotificationsScreen stays mock)
- Do NOT create a `weekly_reports` table (WeeklyReportScreen stays mock)
- Do NOT create a `mission_library` table (mission library stays in code)
- Do NOT add social features (no public profiles, no leaderboards, no rival mode)
- Do NOT add Apple Health integration
- Do NOT modify any visual design, colors, spacing, typography, or animations
- Do NOT add feature flags or backwards-compatibility shims
- Do NOT add unnecessary error handling for impossible scenarios
- Do NOT install react-native-mmkv (AsyncStorage is the local cache layer)
- Do NOT add redux, zustand, or any other state library
- Do NOT convert AppContext to Zustand
- Do NOT skip running `npx tsc --noEmit` before declaring success

---

### VALIDATION COMMANDS (run these before declaring success)

```bash
npx tsc --noEmit           # Must exit 0, 0 errors
npx expo-doctor            # Must be 17+/18 (same or better than baseline)
npx expo start --web       # Must launch without errors
npx expo run:ios           # Must build and launch (required for Google Sign-In testing)
```

Test checklist:
1. Cold launch (no session) → AuthScreen appears with two buttons only (no other login options)
2. **iOS dev build:** "Continue with Apple" → native Apple sheet appears → sign in → returns to app → OnboardingScreen appears
3. **iOS dev build:** "Continue with Google" → native Google picker appears → sign in → returns to app
4. First login → OnboardingScreen → Calibration (5 steps) → CalibrationResultsScreen → "Enter Operating System" → HomeScreen
5. Supabase dashboard: Authentication → Users → new user row exists; Table Editor → `profiles` → row exists; `life_state` → row exists with `is_calibrated = true`
6. Check-in → Supabase `checkins` table has a new row (verify in dashboard)
7. Submit check-in again on the same day → `checkins` row is updated, not duplicated (verify via dashboard — still 1 row for today)
8. Sign out → local AsyncStorage cleared → AuthScreen appears
9. Sign in again → HomeScreen (not OnboardingScreen) — all prior data preserved from Supabase
10. Mission accept → `life_state.active_missions` JSONB updated in Supabase (verify in dashboard)
11. **Expo Go on iOS (Apple only):** Apple Sign-In button works with Supabase `host.exp.Exponent` Client ID configured

---

### DOCUMENTS TO CREATE WHEN DONE

- `SUPABASE_INTEGRATION_SUMMARY.md` — What was implemented, which env vars are needed, how to test auth on each platform, known limitations.
- `SUPABASE_SETUP.md` — Manual dashboard steps (from Section 13 of SUPABASE_DISCOVERY_REPORT.md).

---

**END OF FINAL PROMPT FOR SUPABASE IMPLEMENTATION**

---

# Summary

## Recommended Schema (5 tables for MVP)

| Table | Purpose |
|---|---|
| `profiles` | Identity: handle, display name, provider, joined date |
| `life_state` | Current state snapshot: score, tier, streak, categories, build, RP, active missions |
| `checkins` | Daily check-in history (= logbook) — UNIQUE (user_id, date), upsert on submit |
| `mission_events` | Mission lifecycle events (accepted/completed/failed/abandoned) |
| `user_settings` | Privacy + notification toggles (currently ephemeral `useState`, lost on restart) |

## Biggest Risks

1. **Google Sign-In cannot be tested in Expo Go** — requires a development build. Apple Sign-In can be tested in Expo Go on iOS (with `host.exp.Exponent` added as an Apple Client ID). Plan for a dev build early.
2. **Session storage must use LargeSecureStore, not plain AsyncStorage** — Supabase JWT tokens exceed SecureStore's 2048-byte limit. The `LargeSecureStore` hybrid is the official recommendation. Using plain AsyncStorage for auth sessions is insecure.
3. **RouteGuard must check session before `isCalibrated`** — if implemented incorrectly, the app can show local data without an authenticated session, violating the "no guest mode" rule.
4. **Apple Sign-In name only sent once** — Apple provides `fullName` only on the very first sign-in. On all subsequent sign-ins it is null. The implementation must capture it immediately (before calling Supabase) and save it to `profiles.display_name`. If missed, it is permanently lost.
5. **Multiple check-ins per day are currently allowed in the app** — the current code has no daily gate. The `UNIQUE (user_id, date)` constraint enforces correct product behavior at the DB level. The app code must be updated to upsert (not insert) check-in rows and to detect same-day re-submission.
6. **Stale state during hydration** — the app renders from AsyncStorage before Supabase responds. If remote state differs from local, the UI will briefly show stale data. Implement a hydration guard or merge cleanly.
7. **Mission events were never tracked locally** — `completedOperations` count on ProfileScreen has always been mock. Once `mission_events` is live, this count starts at 0 for all users. Acceptable for MVP (no real users yet).
8. **`lr:streak` and `lr:lastCheckIn` are dead keys in storage** — defined in KEYS but have no getters/setters and are never read or written. Remove them in the same PR as Supabase integration.

## MVP Required Tables

1. `profiles` — required
2. `life_state` — required
3. `checkins` — required
4. `mission_events` — required (for completedOperations count)
5. `user_settings` — required (for settings to persist)

## What Can Stay Local / Mock

- `mockNotifications` — NotificationsScreen stays mock. No `notifications` table yet.
- `mockWeeklyReport` — WeeklyReportScreen stays mock. No computation or DB table yet.
- `mockAvailableMissions` / `mockCompletedMissions` in MissionsScreen Available/Completed tabs — mission library stays in code.
- `mockPersonalRecords` in StatsScreen Q4 tiles — partially replaced by real data, rest stays mock for now.
- `mockSystemSignals` (Momentum/Control/Friction) — stays as visual mock until real computation is wired from `checkins` history.
- `mockCalibrationResult`, `CHECKIN_PROMPTS`, `mockCheckInTags`, `mockMissionRules`, `mockQuickActions` — all seed/config data that stays in code forever.

## Are We Ready to Implement Supabase Next?

**Yes, with one prerequisite:**

Before implementing Supabase, create a Supabase project in the dashboard and obtain the `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Everything else — code, schema, OAuth setup — is fully documented in this report and in the Final Prompt above.

The codebase is in a clean, TypeScript-valid state. The AppContext pattern maps cleanly to a sync layer. The auth flow is well-defined. The schema is minimal and practical. The implementation can begin immediately.
