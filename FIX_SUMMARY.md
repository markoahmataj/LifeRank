# LifeRank — MVP Wiring Pass · Fix Summary
> 2026-05-28 · No visual design was changed. Only interaction, routing, state, and persistence.

## 1. Files changed

### Storage / state
- [src/storage/appStorage.ts](src/storage/appStorage.ts) — added `setRP`, `setLogbook`.
- [src/store/AppContext.tsx](src/store/AppContext.tsx) — RP + logbook persistence, SUBMIT_CHECKIN reducer now writes a real `LogbookEntry`, `submitCheckIn` helper now returns a `SubmitCheckInResult` so callers can detect tier changes.
- [src/design-system/scoringModel.ts](src/design-system/scoringModel.ts) — added `TIER_ORDER` and `compareTiers(prev, next)` helper.

### Screens (logic only — no styling changes)
- [src/screens/HomeScreen.tsx](src/screens/HomeScreen.tsx) — `onCategoryPress`, `onQuickAction`, `onStreakPress`, `onTrendPress` props; categories now pressable; QuickActions accept `onPress`; streak/trend cards now pressable wrappers.
- [src/screens/StatsScreen.tsx](src/screens/StatsScreen.tsx) — accepts `score`, `categoryScores`, `logbook`, `onCategoryPress`; chart series and tiles now derived from real data; category rows wrapped in `Pressable`.
- [src/screens/CheckInScreen.tsx](src/screens/CheckInScreen.tsx) — accepts `streak`; header now reads `DAY {streak}` (or `STREAK · INACTIVE` if 0).
- [src/screens/ResultsScreen.tsx](src/screens/ResultsScreen.tsx) — accepts `categoryMovement` + `onNextMissionPress`; movement falls back to mock only if not provided; next mission card now pressable.
- [src/screens/MissionsScreen.tsx](src/screens/MissionsScreen.tsx) — accepts `activeMissions`, `availableMissions`, `completedMissions`; featured hero card wrapped in `Pressable`.
- [src/screens/MissionDetailScreen.tsx](src/screens/MissionDetailScreen.tsx) — added `onComplete`, `onContinue`, `onViewResult`; CTA flips to "Mark Complete" when `mission.progress >= 100`.
- [src/screens/MissionCompleteScreen.tsx](src/screens/MissionCompleteScreen.tsx) — exported `MissionCompletionResult` type so routes can pass derived data.
- [src/screens/MissionFailedScreen.tsx](src/screens/MissionFailedScreen.tsx) — exported `MissionFailureResult` type.
- [src/screens/ProfileScreen.tsx](src/screens/ProfileScreen.tsx) — accepts identity / score / build / RP / streak / records props; defaults preserve previous mock display.
- [src/screens/SettingsPrivacyScreen.tsx](src/screens/SettingsPrivacyScreen.tsx) — identity rows now driven by props; action rows accept `onPress`.
- [src/screens/ShareScreen.tsx](src/screens/ShareScreen.tsx) — accepts `score`, `categoryScores`, `handle`, `onSendTo`; poster layouts read from props.

### Route files (navigation glue)
- [app/(tabs)/index.tsx](app/(tabs)/index.tsx) — wires category + QuickAction + streak/trend navigation.
- [app/(tabs)/checkin.tsx](app/(tabs)/checkin.tsx) — passes streak, captures tier change after submit, branches to `/rank/promotion`, `/rank/demotion-risk`, or `/checkin/results`.
- [app/(tabs)/missions.tsx](app/(tabs)/missions.tsx) — passes `state.activeMissions`.
- [app/(tabs)/stats.tsx](app/(tabs)/stats.tsx) — passes `state.score`, `state.categories`, `state.logbook`; wires category navigation.
- [app/(tabs)/share.tsx](app/(tabs)/share.tsx) — passes real identity/score; Broadcast opens `Share.share`; SendTo shows informational alert.
- [app/checkin/results.tsx](app/checkin/results.tsx) — computes real diagnosis (strongest/weakest/imbalance) from state; picks next mission targeting the weakest category; wires next-mission navigation.
- [app/mission/[id].tsx](app/mission/%5Bid%5D.tsx) — wires Continue/Abandon/Complete/ViewResult.
- [app/mission/complete/[id].tsx](app/mission/complete/%5Bid%5D.tsx) — resolves mission by `id` from active/available/completed library and builds a real `MissionCompletionResult`.
- [app/mission/failed/[id].tsx](app/mission/failed/%5Bid%5D.tsx) — same approach, builds a real failure result.
- [app/profile.tsx](app/profile.tsx) — pipes AppContext into ProfileScreen, derives favorite pillar from current `state.categories`.
- [app/settings.tsx](app/settings.tsx) — wires Export (Share API), Reset, Delete (both behind Alert.alert confirmation).

## 2. Routes fixed
| Route | Before | After |
|-------|--------|-------|
| `/category/[id]` | unreachable | reachable from Home category cards + Stats category rows |
| `/mission/complete/[id]` | unreachable | reachable from MissionDetail "Mark Complete" + "View Result" |
| `/mission/failed/[id]` | unreachable | reachable from MissionDetail "ABANDON" |
| `/rank/promotion` | mock notification only | triggered automatically when tier increases after a check-in |
| `/rank/demotion-risk` | mock notification only | triggered automatically when tier decreases after a check-in |

## 3. Buttons / interactions fixed
- Home `CategoryStatCard` (×5) — now navigates to `/category/[id]`.
- Home `QuickActionBtn` (×4) — wired to checkin/missions/logbook routes.
- Home `StreakCard` — opens `/logbook`.
- Home `TrendCard` — opens `/(tabs)/stats`.
- Stats category breakdown rows — open `/category/[id]`.
- Stats hero "30D AVG" delta — now derived from real series, not a hardcoded "+0.7".
- MissionsScreen featured hero card — opens `/mission/[id]`.
- MissionDetail "Continue Operation" — calls `onContinue` (router.back).
- MissionDetail "Mark Complete" — appears when `mission.progress >= 100`; dispatches `COMPLETE_MISSION` and navigates to `/mission/complete/[id]`.
- MissionDetail "View Result" — opens `/mission/complete/[id]`.
- MissionDetail "ABANDON" — now also routes to `/mission/failed/[id]`.
- CheckIn header `DAY N · STREAK ACTIVE` — uses `state.score.streak`.
- ResultsScreen "Recommended Next" mission card — opens `/mission/[id]`.
- Settings "Export data" — opens system Share sheet with JSON payload.
- Settings "Reset calibration" — confirms, calls `reset()`, replaces to `/(onboarding)`.
- Settings "Delete local data" — same as Reset (clear + onboarding).
- Share "Broadcast" — opens system Share sheet with a text status payload.
- Share Send-To buttons — show an informational alert (Instagram/X/TikTok direct sharing requires `expo-sharing` + `react-native-view-shot` which are not installed; see Section 7).

## 4. State / data connections added
- HomeScreen — now reads from AppContext (already was), with categories pressable.
- StatsScreen — reads `state.score`, `state.categories`, `state.logbook`.
- MissionsScreen — Active filter now reads `state.activeMissions`. Available + Completed still seeded from `mockAvailableMissions` / `mockCompletedMissions` (no real mission library exists yet — see Section 6).
- ProfileScreen — reads `state.handle`, `state.displayName`, `state.score`, `state.score.streak`, `state.score.pbScore`, `state.build`, `state.rp`, `state.logbook.length` for check-in count.
- SettingsPrivacyScreen — identity rows now read `state.handle`, `state.displayName`, current tier, `state.build.name`.
- ResultsScreen — real category movement, diagnosis (strongest/weakest/imbalance) computed from `state.categories`.
- ShareScreen — poster reads `state.score`, `state.categories`, `state.handle`.

## 5. Persistence fixes
- `Storage.setRP(state.rp)` now called in the persistence effect — RP survives cold start.
- `Storage.setLogbook(state.logbook)` now called in the persistence effect — logbook entries survive cold start.
- Added `setRP` and `setLogbook` helpers to [src/storage/appStorage.ts](src/storage/appStorage.ts).
- `SUBMIT_CHECKIN` reducer now prepends a `LogbookEntry` so the logbook grows automatically.
- Check-in tags are now collected across all 5 steps and stored on the entry.

## 6. What still uses mock data and why
- **MissionsScreen "Available" + "Completed" tabs** — there is no real mission library or completion history persisted yet. Active comes from `state.activeMissions`; the other two fall back to `mockAvailableMissions` / `mockCompletedMissions` so the screen still renders content.
- **MissionDetail mission lookup fallback** — if the URL id is not in `state.activeMissions`, we still look it up in the mock library so the screen renders.
- **MissionCompleteScreen / MissionFailedScreen** — the screen builds a `MissionCompletionResult` from the looked-up mission + current AppContext, but `prevScore` is approximated as `state.score.value - rewardScore` (no per-mission score snapshot is recorded yet).
- **NotificationsScreen** — still `mockNotifications`. No real notification queue exists yet.
- **WeeklyReportScreen** — still `mockWeeklyReport`. No weekly-report computation exists yet.
- **ProfileScreen records** — `mockProfile.totalCheckIns`, `mockProfile.completedOperations`, `mockProfile.rankPromotions` are used as defaults; the route overrides `totalCheckIns` with `state.logbook.length` and longestStreak/personalBest from real score.
- **CalibrationResultsScreen** — first mission card still not pressable (out of scope for MVP wiring fixes — onboarding flow already works).

## 7. What remains for later
- **Reveal modals** (`ScoreRevealModal`, `RankChangeModal`, `StreakBrokenModal`, `StreakProtectedModal`, `MissionAssignedModal`) — not wired. They should fire as overlays:
  - `ScoreRevealModal` — after the score count-up animation finishes in `ResultsScreen` (~1200 ms).
  - `RankChangeModal` — could replace the dedicated `/rank/promotion` and `/rank/demotion-risk` routes, OR be shown as an intermediate animation before pushing those routes from `app/(tabs)/checkin.tsx`.
  - `StreakBrokenModal` — should fire from `app/(tabs)/checkin.tsx` when `applyCheckIn` resets streak to 1 (i.e., previous streak was >0 and now it's 1 because grace expired). Requires exposing a `streakBroke` flag from `applyCheckIn`.
  - `StreakProtectedModal` — same call site, when streak crosses a milestone (7 / 30 / 100 / 365).
  - `MissionAssignedModal` — should fire from `app/checkin/results.tsx` (or after Continue is pressed) when a new recommended mission is surfaced and not yet accepted.
- **Voice memo capture** — needs an audio dependency (`expo-av` or `expo-audio`); the row in CheckInScreen is still a static display.
- **Send-To direct platform share** — needs `react-native-view-shot` + `expo-sharing` to capture the poster and open the platform-specific share intent. For now, Broadcast uses the system Share sheet with text.
- **"+" button on MissionsScreen** — not wired (would open a "browse all available" sheet; same data as Available filter, no new route required).
- **"HOW RANKING WORKS" button on Onboarding** — not wired.
- **Notification queue** — needs an in-state `notifications` array + a hydration source. Currently mock-only.
- **Weekly report computation** — needs a weekly aggregation pass over `state.logbook` plus a real `WeeklyReport` data flow.
- **Range selector on StatsScreen** — controls a local state but the chart series ignores it. Wire range → trim `logbook` slice accordingly.
- **Calibration "First mission" card pressable** — small one-liner add to `CalibrationResultsScreen`.
- **Rank promotion / demotion screens still receive mock data** — they need to receive the actual `prevTier` / `newTier` from the check-in route and look up the unlocked missions for that tier.

## 8. Manual test checklist
- [ ] First launch shows onboarding (no calibration flag set).
- [ ] Calibration 5 steps → results scanner → "Enter Operating System" returns user to Home.
- [ ] Home category tap (any of 5) opens `/category/[id]` for that category.
- [ ] Home "VIEW ALL →" still opens logbook (unchanged by this pass).
- [ ] Home QuickAction "Check-In" opens the check-in tab.
- [ ] Home QuickAction "Compete" opens the missions tab.
- [ ] Home QuickAction "Reflect" opens the logbook.
- [ ] Home streak card tap opens the logbook.
- [ ] Home trend card tap opens stats.
- [ ] Check-in header shows real DAY N (matches `state.score.streak`), or "STREAK · INACTIVE" if streak is 0.
- [ ] Complete a 5-step check-in (rate 8 across the board, no streak): expect navigation to `/checkin/results`.
- [ ] ResultsScreen shows real category movement (not the hard-coded mock deltas).
- [ ] ResultsScreen "Recommended Next" mission card opens `/mission/[id]`.
- [ ] Complete a 5-step check-in that crosses a tier threshold (e.g. push the score from <7.5 to >=7.5): expect navigation to `/rank/promotion` instead of `/checkin/results`.
- [ ] Complete a 5-step check-in that drops a tier: expect `/rank/demotion-risk`.
- [ ] Accept a mission from `/mission/[id]` (Accept Operation) — back to MissionsScreen → Active filter shows the accepted mission.
- [ ] Open active mission → tick all tasks → CTA flips from "Continue Operation" to "Mark Complete" → tapping it navigates to `/mission/complete/[id]` and removes the mission from Active.
- [ ] Tap "Abandon" on active mission → navigates to `/mission/failed/[id]` and removes the mission.
- [ ] Hot-reload the app (or cold restart) — `state.rp`, `state.logbook`, scores, missions still present.
- [ ] Logbook shows newly-added entries (newest first) — the in-state entries take precedence over `mockLogbook`.
- [ ] Profile screen shows real handle, display name, tier, RP, streak, build.
- [ ] Settings → Identity rows match current AppContext values.
- [ ] Settings → Export data opens system Share sheet with JSON payload.
- [ ] Settings → Reset calibration confirms, clears state, returns to onboarding.
- [ ] Settings → Delete local data confirms, clears state, returns to onboarding.
- [ ] Share screen poster shows the real score / tier / handle / streak / category scores.
- [ ] Share "Broadcast" opens system Share sheet.
- [ ] Share Send-To buttons show an informational alert.

## 9. Validation
- `npx tsc --noEmit` — clean (exit 0).
- No visual tokens, colors, spacing, typography, card styles, animations, or layouts were modified.
- No new product features, screens, or routes added.
- All previously-existing routes remain reachable.
