# LifeRank — MVP Wiring QA Report
> 2026-05-28 · Verification pass after MVP wiring fixes. No code changes were made during this pass.

## 1. Build / TypeScript Status

| Command | Result | Notes |
|---|---|---|
| `npx tsc --noEmit` | **PASS** (exit 0, 0 lines of output) | Strict mode, all routes typed via [.expo/types/router.d.ts](.expo/types/router.d.ts). |
| `npx expo-doctor` | **17/18 passed** (exit 1) | Single non-blocking flag: `expo` is pinned at `56.0.5` while SDK expects `~56.0.6` (patch mismatch). Does not affect runtime; can be resolved later with `npx expo install --check`. |

`expo start` was not executed because this environment is non-interactive; bundling failures, if any, would surface on first device launch.

---

## 2. Route Verification

All route files exist and are reachable through the in-app UI unless noted. Typed-route definitions in [.expo/types/router.d.ts](.expo/types/router.d.ts) confirm every navigation string used by the app.

| Route | Route file | Screen rendered | Reachable from UI | Status |
|---|---|---|---|---|
| `/(onboarding)` | [app/(onboarding)/index.tsx](app/(onboarding)/index.tsx) | `OnboardingScreen` | Hard-redirect from RouteGuard when `!isCalibrated` | working |
| `/(onboarding)/calibration/[step]` | [app/(onboarding)/calibration/[step].tsx](app/(onboarding)/calibration/%5Bstep%5D.tsx) | `CalibrationScreen` | Onboarding "Begin Calibration" → step 0; URL-driven step transition | working |
| `/(onboarding)/results` | [app/(onboarding)/results.tsx](app/(onboarding)/results.tsx) | `CalibrationResultsScreen` | Calibration step 4 → `router.replace` | working |
| `/(tabs)` (Home) | [app/(tabs)/index.tsx](app/(tabs)/index.tsx) | `HomeScreen` | Tab bar; route-guard redirect after calibration | working |
| `/(tabs)/checkin` | [app/(tabs)/checkin.tsx](app/(tabs)/checkin.tsx) | `CheckInScreen` | Tab bar; Home QuickAction "Check-In" | working |
| `/checkin/results` | [app/checkin/results.tsx](app/checkin/results.tsx) | `ResultsScreen` | CheckInScreen "Submit Check-in" when tier holds | working |
| `/(tabs)/missions` | [app/(tabs)/missions.tsx](app/(tabs)/missions.tsx) | `MissionsScreen` | Tab bar; Home QuickAction "Compete"; Notifications | working |
| `/mission/[id]` | [app/mission/[id].tsx](app/mission/%5Bid%5D.tsx) | `MissionDetailScreen` | HomeScreen MissionCard; MissionsScreen list rows; MissionsScreen featured hero; ResultsScreen Recommended Next | working |
| `/mission/complete/[id]` | [app/mission/complete/[id].tsx](app/mission/complete/%5Bid%5D.tsx) | `MissionCompleteScreen` | MissionDetail "Mark Complete" (progress ≥ 100); MissionDetail "View Result" (completed status) | working |
| `/mission/failed/[id]` | [app/mission/failed/[id].tsx](app/mission/failed/%5Bid%5D.tsx) | `MissionFailedScreen` | MissionDetail "ABANDON" | working |
| `/rank/promotion` | [app/rank/promotion.tsx](app/rank/promotion.tsx) | `RankPromotionScreen` (mode=promotion) | Auto-triggered when `compareTiers(prev, next) > 0` after check-in; Notifications | working (data still mock — see §6) |
| `/rank/demotion-risk` | [app/rank/demotion-risk.tsx](app/rank/demotion-risk.tsx) | `RankPromotionScreen` (mode=demotion-risk) | Auto-triggered when `compareTiers(prev, next) < 0` after check-in; Notifications | working (data still mock — see §6) |
| `/category/[id]` | [app/category/[id].tsx](app/category/%5Bid%5D.tsx) | `CategoryDetailScreen` | HomeScreen category cards (×5); StatsScreen category rows | working |
| `/(tabs)/stats` | [app/(tabs)/stats.tsx](app/(tabs)/stats.tsx) | `StatsScreen` | Tab bar; Home TrendCard tap | working |
| `/logbook` | [app/logbook.tsx](app/logbook.tsx) | `LogbookScreen` | Home "VIEW ALL →"; Home StreakCard tap; Home QuickAction "Reflect" | working |
| `/(tabs)/share` | [app/(tabs)/share.tsx](app/(tabs)/share.tsx) | `ShareScreen` | Tab bar; Results "SHARE"; Profile "Share Profile Card"; MissionComplete "SHARE"; WeeklyReport "SHARE" | working |
| `/profile` | [app/profile.tsx](app/profile.tsx) | `ProfileScreen` | Home avatar tap | working |
| `/settings` | [app/settings.tsx](app/settings.tsx) | `SettingsPrivacyScreen` | Profile gear icon | working |
| `/notifications` | [app/notifications.tsx](app/notifications.tsx) | `NotificationsScreen` | Home bell icon | working (mock data — see §6) |
| `/weekly-report` | [app/weekly-report.tsx](app/weekly-report.tsx) | `WeeklyReportScreen` | NotificationsScreen "Review Week" | working (mock data — see §6) |

**Not reachable from UI** (pre-existing, not in scope):
- `/dev/styleguide` — no component, no link.

---

## 3. Interaction Verification

Each "fixed" interaction was traced from the screen Pressable through the route handler to the navigation/dispatch call.

| Interaction | Code path | Expected behavior | Status |
|---|---|---|---|
| **Home category cards (×5)** | `CategoryStatCard.onPress` → `HomeScreen.onCategoryPress` → `app/(tabs)/index.tsx` line 37 → `router.push('/category/${id}')` | Open `/category/[id]` with the correct CategoryId | confirmed in code |
| **Home QuickActions (×4)** | `QuickActionBtn.onPress` → `HomeScreen.onQuickAction(q.id)` → `QUICK_ACTION_ROUTES` map → `router.push` | log-win→checkin, checkin→checkin, compete→missions, reflect→logbook | confirmed in code |
| **Home StreakCard** | Outer `<Pressable onPress={onStreakPress}>` → `router.push('/logbook')` | Open logbook | confirmed in code |
| **Home TrendCard** | Outer `<Pressable onPress={onTrendPress}>` → `router.push('/(tabs)/stats')` | Open stats tab | confirmed in code |
| **Stats category rows** | Row wrapped in `<Pressable onPress={() => onCategoryPress?.(cs.id)}>` → `router.push('/category/${id}')` | Open category detail | confirmed in code |
| **Mission featured hero card** | Outer `<Pressable onPress={() => featured && onMissionPress?.(featured.id)}>` | Open `/mission/[id]` | confirmed in code |
| **Mission detail "Continue Operation"** | `PrimaryCTA onPress` branches on `isReadyToComplete` → falls through to `onContinue?.(mission)` → `router.back()` | Return to the previous screen | confirmed in code |
| **Mission detail "Mark Complete"** | `PrimaryCTA` label flips when `mission.progress ≥ 100`; `onComplete?.(mission)` → `completeMission(m.id)` dispatch (`COMPLETE_MISSION`) → `router.replace('/mission/complete/${m.id}')` | Remove from active list and navigate | confirmed in code |
| **Mission detail "View Result"** (completed status) | `PrimaryCTA onPress={() => onViewResult?.(mission)}` → `router.push('/mission/complete/${m.id}')` | Open completion screen | confirmed in code |
| **Mission detail "Abandon"** | `<Pressable onPress={() => onAbandon?.(mission)}>` → `abandonMission(m.id)` dispatch → `router.replace('/mission/failed/${m.id}')` | Remove from active + show failed screen | confirmed in code |
| **Results "Recommended Next"** | `<Pressable onPress={() => onNextMissionPress?.(nextMission.id)}>` → `router.push('/mission/${id}')` | Open mission detail | confirmed in code |
| **Settings "Export data"** | ActionRow `onPress={onExportData}` → `Share.share({ message: JSON, title: 'LifeRank export' })` | Open system Share sheet with JSON | confirmed in code |
| **Settings "Reset calibration"** | `Alert.alert` → confirm → `reset()` (clears AsyncStorage + dispatches RESET) → `router.replace('/(onboarding)')` | Wipe state and go back to onboarding | confirmed in code |
| **Settings "Delete local data"** | Same path as Reset, destructive Alert tone | Wipe state and go back to onboarding | confirmed in code |
| **Share "Broadcast"** | `PrimaryCTA onPress={onBroadcast}` → `Share.share({ message: 'LifeRank · ... ', title: 'My LifeRank' })` | Open system Share sheet | confirmed in code |
| **Share Send-To buttons** | `<Pressable onPress={() => onSendTo?.(d.id)}>` → `Alert.alert(...)` | Informational alert explaining direct-share dependency | confirmed in code |

No "previously fixed" interaction was found to be silently dead.

---

## 4. Persistence Verification

| Data | Persisted | Hydrated | Notes |
|---|---|---|---|
| `isCalibrated` | ✅ `Storage.setIsCalibrated` in persistence effect | ✅ `Storage.getIsCalibrated()` returns `false` on fresh install | drives RouteGuard |
| `score` (LifeScore: value, delta, tier, streak, lastCheckIn, pbScore) | ✅ `Storage.setLifeScore` | ✅ Optional merge; INITIAL_SCORE if absent | streak/tier flow through `score` |
| `tier` | ✅ part of `score` | ✅ part of `score` | derived from score.value via `tierForScore` |
| `streak` | ✅ part of `score` | ✅ part of `score` | now displayed in CheckIn header |
| `categories` | ✅ `Storage.setCategoryScores` | ✅ Optional merge; INITIAL fallback `value: 5` | |
| `activeMissions` | ✅ `Storage.setActiveMissions` | ✅ Optional merge; defaults to `[]` | survives restart |
| `handle` / `displayName` / `build` | ✅ | ✅ | identity fully persisted |
| **`rp`** | ✅ **NEWLY FIXED** — `Storage.setRP` in persistence effect | ✅ `Storage.getRP()` returns `0` on fresh install | confirmed [src/storage/appStorage.ts:144](src/storage/appStorage.ts#L144) + [AppContext.tsx:282](src/store/AppContext.tsx#L282) |
| **`logbook`** | ✅ **NEWLY FIXED** — `Storage.setLogbook` in persistence effect | ✅ `Storage.getLogbook()` → JSON array or null | confirmed [src/storage/appStorage.ts:109](src/storage/appStorage.ts#L109) + [AppContext.tsx:283](src/store/AppContext.tsx#L283) |

**SUBMIT_CHECKIN creates a LogbookEntry:** confirmed in reducer at [src/store/AppContext.tsx:110-135](src/store/AppContext.tsx#L110-L135). The entry object includes `date`, `lifeScore`, `delta`, `categoryScores`, `tags` (collected from all 5 steps), `rankTier`, `streakDay`. Entries are prepended so newest is first.

**Persistence effect dependency:** `useEffect(() => { ... }, [state])` fires on every state change after `isHydrated`. This is a fan-out write but safe; the only risk is excessive disk I/O, not correctness.

**Reset path** ([app/settings.tsx](app/settings.tsx)): `reset()` calls `Storage.clearAllAppData()` (multiRemove of all keys) → dispatches `RESET` → state becomes `initialState` with `isHydrated: true` → persistence effect re-writes defaults. Sequence is correct.

---

## 5. Data Source Verification

| Screen | Data source after fix | Mock fallback | Matches FIX_SUMMARY.md? |
|---|---|---|---|
| Home | Reads `state.handle`, `state.displayName`, `state.score`, `state.categories`, `state.activeMissions` (already wired pre-fix); pressable cards added | `mockSystemSignals`, `mockQuickActions` (config — labels/colors only, expected) | ✅ matches |
| Check-in | Reads `state.score.streak` for header; dispatch goes through `submitCheckIn` helper | none | ✅ matches |
| Results | `categoryMovement` from `state.categories.map(c => ({id, delta}))`; diagnosis computed (`strongest`/`weakest`/`imbalance`) from real state; next mission selected by `state.categories` weakest category | `mockUser.categories` only if no `categoryMovement` prop passed (fallback never triggered from real route) | ✅ matches |
| Missions (Active tab) | Reads `state.activeMissions` via route prop | `mockAvailableMissions`/`mockCompletedMissions` for Available + Completed tabs | ✅ matches §6 of FIX_SUMMARY ("no real mission library") |
| Stats | Reads `state.score`, `state.categories`, `state.logbook` (when logbook ≥ 2 entries) | `mockTrend30D` series fallback; `mockPersonalRecords` Q4 records still mock | ⚠️ `mockPersonalRecords` not in §6 list — see Required Bugfixes |
| Profile | Reads `state.handle`, `state.displayName`, `state.score`, `state.build`, `state.rp`, `state.score.streak`, `state.score.pbScore`, `state.logbook.length` (totalCheckIns), strongest pillar derived | `mockProfile.totalCheckIns`/`completedOperations`/`rankPromotions` declared in screen defaults but route overrides totalCheckIns and longest/personalBest from real data | ✅ matches |
| Settings identity | Reads `state.handle`, `state.displayName`, derived `tierLabel`, `state.build.name` | none — props no longer default to '@kai.os' / Kai / APEX · V in the route | ✅ matches |
| Share | `score=state.score`, `categoryScores=state.categories`, `handle=state.handle`; threaded through `SharePoster` → `PosterLayout`, `MinimalLayout`, `BadgeLayout` | all three layouts read props, not module imports | ✅ matches |
| Logbook | `state.logbook` when populated; falls back to `mockLogbook` when empty (intentional, design-spec) | `mockLogbook` | ✅ matches |
| **Notifications** | `mockNotifications` only | — | ✅ matches §6 (out of scope) |
| **WeeklyReport** | `mockWeeklyReport` only | — | ✅ matches §7 (out of scope) |
| **CategoryDetailScreen** | Still 100% `mockCategoryScores` + `mockLogbook` | — | ⚠️ Not flagged in FIX_SUMMARY §6 — see Required Bugfixes (informational only) |
| **RankPromotionScreen** | Still 100% `mockPromotionSample` / `mockDemotionRiskSample` (routes pass no props) | — | ✅ explicitly listed in §7 ("still receive mock data") |
| **CalibrationResultsScreen first mission card** | Not pressable | — | ✅ called out in §6 |

---

## 6. Runtime Risk List

### Route strings
- All navigation strings used in `app/` were cross-checked against `.expo/types/router.d.ts`. All match.
- Single `as any` cast in [app/(tabs)/index.tsx:40](app/(tabs)/index.tsx#L40) for QuickAction routes — the underlying values are still valid typed routes; the cast is only needed because `QUICK_ACTION_ROUTES` is typed as `Record<string, string>` rather than the typed-Href union. Safe at runtime.

### Stale state after `submitCheckIn`
- The `submitCheckIn` helper pre-computes `applyCheckIn` against the captured closure of `state.score / state.categories / state.activeMissions` (deps in useCallback). It returns `prevTier` / `newTier` directly. The check-in route uses these returned values to branch navigation **before** the next render — no `state.score.tier` read after dispatch. ✅ Stale-state bug avoided.
- After navigation to `/checkin/results`, React schedules the new screen which calls `useApp()` again — reads the new state. `prevScore = state.score.value - state.score.delta` is correct because the reducer sets `delta = newScore - prevScore`.

### `router.replace` vs `router.push`
- `replace` is used appropriately in: (a) onboarding→tabs transition, (b) mission-detail→complete/failed (so the back arrow on complete doesn't return to a stale detail screen), (c) settings reset→onboarding.
- `push` is used appropriately for: (a) tier change overlays (`/rank/promotion`, `/rank/demotion-risk`) — user can swipe back to the previous tab, (b) all read-only/lateral navigations.

### Category ID mismatches
- HomeScreen and StatsScreen pass `cs.id` from `state.categories[i].id` directly. The `CategoryId` union has five members: `discipline | style | environment | money | career`. State is initialized with `mockCategoryScores.map(c => ({...c, value: 5, delta: 0}))`, preserving all five ids. ✅ no mismatch risk.

### Mission ID lookup failures
- `app/mission/[id].tsx` falls back through `state.activeMissions → mockActiveMissions → mockAvailableMissions → mockCompletedMissions → mockActiveMissions[0]`. The last fallback is non-null so the screen always renders.
- `app/mission/complete/[id].tsx` and `app/mission/failed/[id].tsx` look up in `mockActiveMissions / mockAvailableMissions / mockCompletedMissions`. If none match (e.g., user gets a not-found URL), they fall back to `mockCompletionSample` / `mockFailureSample`. ✅ no crash.
- `app/mission/failed/[id].tsx` line 30 reads `realMission.daysIn ?? 0` — guards undefined.

### Null / undefined crashes
- Settings route assumes `state.build` is non-null (it always is — initialized to `mockBuild`).
- Profile route computes `favoriteCategory` as `[...state.categories].sort(...)[0]?.id` — `?` guarded.
- ResultsScreen route computes `strongest`/`weakest` from `state.categories.sort(...)`. State always has 5 categories. ✅
- LogbookScreen route checks `state.logbook.length > 0 ? state.logbook : mockLogbook`. Strip header uses `avg()` which divides by length; protected by the outer empty check. ✅

### AsyncStorage hydration timing
- RouteGuard in [app/_layout.tsx:31](app/_layout.tsx#L31) early-returns when `!isHydrated`. No navigation can happen before hydration completes.
- Hydration uses `Promise.all` of 9 reads, then a single `HYDRATE` dispatch which sets `isHydrated: true`. ✅
- Persistence effect early-returns when `!isHydrated`. ✅ No accidental overwrite of un-hydrated state.

### Alert / Share API
- `Alert.alert(...)` and `Share.share(...)` are imported from `react-native` directly. These APIs are supported on iOS, Android, and web (React Native Web). On web, `Share.share` falls back to the Navigator.share polyfill or rejects with `not supported`; the route wraps it in `try/catch` and shows a fallback alert.
- `Share.share` payload uses `message: <JSON>` — large logbook arrays could exceed the share-sheet text limit on some platforms (~140 chars on Twitter). For an MVP export this is acceptable; documented in FIX_SUMMARY §7.

### Other observations
- **Duplicate logbook dates**: Multiple check-ins in the same calendar day produce LogbookEntries with the same `date` string. LogbookScreen uses `key={e.date}` in the 14-day strip — will print React duplicate-key warnings but not crash. Cosmetic only.
- **`ProfileScreen` unused `promos` constant**: I noticed `const promos = rankPromotions ?? mockProfile.rankPromotions` is computed but never rendered (the corresponding RecordTile was replaced with `RP`). Dead code; not a crash risk.
- **`RankPromotionScreen` always shows mock data**: The detection of tier change in check-in is correct, but the screen itself is rendered with default (mock) `prevTier`, `newTier`, `prevScore`, `newScore`, `unlockedMissions`, and `narrative`. The route file does not yet pass any of these. FIX_SUMMARY §7 explicitly flags this as deferred. Not a regression.

---

## 7. Manual Test Checklist
(Copied from FIX_SUMMARY.md §8 with status annotation. Items marked `confirmed by code` were traced to the responsible handler and dispatch.)

- [confirmed by code] First launch shows onboarding (no calibration flag set).
- [ready to test] Calibration 5 steps → results scanner → "Enter Operating System" returns user to Home.
- [confirmed by code] Home category tap (any of 5) opens `/category/[id]` for that category.
- [confirmed by code] Home "VIEW ALL →" still opens logbook (unchanged by this pass).
- [confirmed by code] Home QuickAction "Check-In" opens the check-in tab.
- [confirmed by code] Home QuickAction "Compete" opens the missions tab.
- [confirmed by code] Home QuickAction "Reflect" opens the logbook.
- [confirmed by code] Home streak card tap opens the logbook.
- [confirmed by code] Home trend card tap opens stats.
- [confirmed by code] Check-in header shows real DAY N (matches `state.score.streak`), or "STREAK · INACTIVE" if streak is 0.
- [ready to test] Complete a 5-step check-in (rate 8 across the board, no streak): expect navigation to `/checkin/results`.
- [ready to test] ResultsScreen shows real category movement (not the hard-coded mock deltas).
- [confirmed by code] ResultsScreen "Recommended Next" mission card opens `/mission/[id]`.
- [ready to test] Complete a 5-step check-in that crosses a tier threshold (e.g. push the score from <7.5 to >=7.5): expect navigation to `/rank/promotion` instead of `/checkin/results`.
- [ready to test] Complete a 5-step check-in that drops a tier: expect `/rank/demotion-risk`.
- [confirmed by code] Accept a mission from `/mission/[id]` (Accept Operation) — back to MissionsScreen → Active filter shows the accepted mission.
- [ready to test] Open active mission → tick all tasks → CTA flips from "Continue Operation" to "Mark Complete" → tapping it navigates to `/mission/complete/[id]` and removes the mission from Active.
- [confirmed by code] Tap "Abandon" on active mission → navigates to `/mission/failed/[id]` and removes the mission.
- [ready to test] Hot-reload the app (or cold restart) — `state.rp`, `state.logbook`, scores, missions still present.
- [confirmed by code] Logbook shows newly-added entries (newest first) — the in-state entries take precedence over `mockLogbook`.
- [confirmed by code] Profile screen shows real handle, display name, tier, RP, streak, build.
- [confirmed by code] Settings → Identity rows match current AppContext values.
- [ready to test] Settings → Export data opens system Share sheet with JSON payload.
- [ready to test] Settings → Reset calibration confirms, clears state, returns to onboarding.
- [ready to test] Settings → Delete local data confirms, clears state, returns to onboarding.
- [confirmed by code] Share screen poster shows the real score / tier / handle / streak / category scores.
- [ready to test] Share "Broadcast" opens system Share sheet.
- [confirmed by code] Share Send-To buttons show an informational alert.

**Not implemented yet** (deferred per FIX_SUMMARY §7):
- Reveal modals (Score, RankChange, Streak, MissionAssigned)
- Voice memo capture
- Direct platform share (IG / X / TT) via view-shot
- Missions screen "+" button
- "HOW RANKING WORKS" button on Onboarding
- Notification queue (still mockNotifications)
- Weekly report computation
- StatsScreen range selector (W/M/3M/Y/ALL) wiring
- Calibration results first-mission-card press
- RankPromotion / DemotionRisk receiving real tier data

---

## 8. Final Verdict

**READY FOR DEVICE TESTING.**

TypeScript compiles cleanly. Every route exists and is reachable through the intended UI affordance. Every interaction marked `[FIXED]` in `FIX_SUMMARY.md` traces to a concrete handler. Persistence covers RP, logbook, and identity. The check-in flow correctly captures tier change before dispatch and branches without stale-state risk. No crash-risk paths were identified.

Three caveats — none blocking, none regressions:
1. `RankPromotionScreen` is reached automatically but still renders `mockPromotionSample` / `mockDemotionRiskSample` data because the route files do not yet pass tier-change params. Listed in FIX_SUMMARY §7.
2. `CategoryDetailScreen` is now reachable but its internals still read `mockCategoryScores` / `mockLogbook`. Not in the required fix list; informational only.
3. `StatsScreen` "Records · Q4" tiles still render `mockPersonalRecords`. Not in the required fix list; informational only.

### Required Bugfixes
None blocking TypeScript compilation or runtime stability.

### Informational follow-ups (not bugs; not required to ship MVP wiring)
- [I-1] Pass `state.score` + tier change to `RankPromotionScreen` via URL params or `useApp()` read so the celebration screen reflects real movement.
- [I-2] Thread `state.categories.find(c => c.id === categoryId)` and `state.logbook` into `CategoryDetailScreen` so its content matches the rest of the app after navigation.
- [I-3] Replace `mockPersonalRecords` in StatsScreen "Records · Q4" with derived values from `state.score.pbScore`, `state.score.streak`, etc.
- [I-4] Remove unused `promos` local in `ProfileScreen.tsx` (dead code from the records refactor).
- [I-5] De-dupe LogbookScreen 14-day strip `key` collision when multiple check-ins land on the same calendar day (use `${date}-${index}`).

These items can be batched into a polish pass after device testing confirms the core loop.
