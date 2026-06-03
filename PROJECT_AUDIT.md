# LifeRank — Implementation Audit
> Generated: 2026-05-28 | Auditor: Claude Sonnet 4.6 | Scope: full app
> **Updated 2026-05-28** — MVP wiring pass implemented. See `FIX_SUMMARY.md` for details. Items prefixed with **[FIXED]** are no longer broken.

---

## 1. Current App Structure

```
c:/Claude/LifeRank/
├── app/                        Expo Router route files (thin wrappers)
│   ├── _layout.tsx             Root layout: font load, AppProvider, RouteGuard
│   ├── (onboarding)/
│   │   ├── _layout.tsx         Stack layout for onboarding group
│   │   ├── index.tsx           → OnboardingScreen
│   │   ├── calibration/[step]  → CalibrationScreen (step 0–4 via URL param)
│   │   └── results.tsx         → CalibrationResultsScreen (answers in URL param)
│   ├── (tabs)/
│   │   ├── _layout.tsx         Tabs with custom FloatingTabBar
│   │   ├── index.tsx           → HomeScreen
│   │   ├── missions.tsx        → MissionsScreen
│   │   ├── checkin.tsx         → CheckInScreen (stepIndex in local state)
│   │   ├── stats.tsx           → StatsScreen
│   │   └── share.tsx           → ShareScreen
│   ├── checkin/results.tsx     → ResultsScreen
│   ├── mission/[id].tsx        → MissionDetailScreen
│   ├── mission/complete/[id]   → MissionCompleteScreen
│   ├── mission/failed/[id]     → MissionFailedScreen
│   ├── rank/promotion.tsx      → RankPromotionScreen (mode=promotion)
│   ├── rank/demotion-risk.tsx  → RankPromotionScreen (mode=demotion-risk)
│   ├── category/[id].tsx       → CategoryDetailScreen
│   ├── logbook.tsx             → LogbookScreen
│   ├── notifications.tsx       → NotificationsScreen
│   ├── weekly-report.tsx       → WeeklyReportScreen
│   ├── profile.tsx             → ProfileScreen
│   ├── settings.tsx            → SettingsPrivacyScreen
│   └── dev/styleguide.tsx      → placeholder (no screen yet)
│
├── src/
│   ├── screens/                All 20 screen components with full UI (source of truth)
│   ├── components/             19 reusable UI components
│   ├── design-system/
│   │   ├── tokens.ts           Colors, fonts, spacing, tier config, category config
│   │   ├── types.ts            All TypeScript types
│   │   ├── mockData.ts         Static mock data used throughout
│   │   └── scoringModel.ts     Pure scoring functions (EMA, streak, RP)
│   ├── store/AppContext.tsx     React Context + useReducer (global state)
│   └── storage/appStorage.ts   AsyncStorage abstraction layer
│
└── claudedesign/               Design reference package (excluded from TypeScript)
    └── liferank-rn/
        ├── APP_FLOW.md
        ├── MVP_SCOPE.md
        ├── PORT_MAP.md
        └── SCORING_MODEL.md
```

**Architecture pattern**: Route files in `app/` are pure navigation wrappers. All screen logic and UI lives in `src/screens/`. State flows from `AppContext` through route props down into screens.

---

## 2. Screens Found

| Screen | Route File | Source File | Reachable? | Data | Main Missing Work |
|--------|-----------|-------------|------------|------|-------------------|
| OnboardingScreen | `(onboarding)/index.tsx` | `screens/OnboardingScreen.tsx` | ✅ Via route guard | Static | "HOW RANKING WORKS" button is no-op |
| CalibrationScreen | `(onboarding)/calibration/[step].tsx` | `screens/CalibrationScreen.tsx` | ✅ From onboarding | Real (URL params) | None — flow is complete |
| CalibrationResultsScreen | `(onboarding)/results.tsx` | `screens/CalibrationResultsScreen.tsx` | ✅ After step 5 | Real score, mock build | First mission card not pressable |
| HomeScreen | `(tabs)/index.tsx` | `screens/HomeScreen.tsx` | ✅ Main tab | Real score/tier, mock signals | Categories not clickable, QuickActions are fake |
| CheckInScreen | `(tabs)/checkin.tsx` | `screens/CheckInScreen.tsx` | ✅ Tab | Real (dispatched) | Streak/day display hardcoded, voice memo fake |
| ResultsScreen | `checkin/results.tsx` | `screens/ResultsScreen.tsx` | ✅ After check-in | Score real, rest mock | Category movement uses mock; no rank-change detection |
| MissionsScreen | `(tabs)/missions.tsx` | `screens/MissionsScreen.tsx` | ✅ Tab | ALL MOCK | Doesn't read state.activeMissions; featured hero not pressable |
| MissionDetailScreen | `mission/[id].tsx` | `screens/MissionDetailScreen.tsx` | ✅ From missions | Partial | "Continue Operation" has no onPress; "View Result" has no onPress |
| MissionCompleteScreen | `mission/complete/[id].tsx` | `screens/MissionCompleteScreen.tsx` | ❌ No trigger | ALL MOCK | No screen/button navigates here |
| MissionFailedScreen | `mission/failed/[id].tsx` | `screens/MissionFailedScreen.tsx` | ❌ No trigger | ALL MOCK | No screen/button navigates here |
| RankPromotionScreen | `rank/promotion.tsx` | `screens/RankPromotionScreen.tsx` | ⚠️ Notifications only | ALL MOCK | Never triggered by actual score change |
| RankPromotionScreen | `rank/demotion-risk.tsx` | `screens/RankPromotionScreen.tsx` | ⚠️ Notifications only | ALL MOCK | Never triggered by actual score change |
| StatsScreen | `(tabs)/stats.tsx` | `screens/StatsScreen.tsx` | ✅ Tab | ALL MOCK | No link to logbook; range selector is visual only |
| CategoryDetailScreen | `category/[id].tsx` | `screens/CategoryDetailScreen.tsx` | ❌ Unreachable | Mostly mock | No pressable category cards anywhere in app |
| LogbookScreen | `logbook.tsx` | `screens/LogbookScreen.tsx` | ✅ From home | Partial | Entries are never written; onSelectDay is no-op |
| ShareScreen | `(tabs)/share.tsx` | `screens/ShareScreen.tsx` | ✅ Tab | ALL MOCK | Send-to buttons are fake; Broadcast is fake |
| ProfileScreen | `profile.tsx` | `screens/ProfileScreen.tsx` | ✅ From home avatar | ALL MOCK | No AppContext connection at all |
| SettingsPrivacyScreen | `settings.tsx` | `screens/SettingsPrivacyScreen.tsx` | ✅ From profile | Partial | Identity section is hardcoded; action rows are fake |
| NotificationsScreen | `notifications.tsx` | `screens/NotificationsScreen.tsx` | ✅ From home bell | ALL MOCK | No real notification system |
| WeeklyReportScreen | `weekly-report.tsx` | `screens/WeeklyReportScreen.tsx` | ⚠️ Notifications only | ALL MOCK | Entirely mock |
| StyleGuideScreen | `dev/styleguide.tsx` | ❌ No screen | ❌ Not linked | — | Placeholder route only |

---

## 3. Interaction Map

### OnboardingScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| "Begin Calibration" CTA | `router.push('/(onboarding)/calibration/0')` | Navigate to calibration step 0 | ✅ Working |
| "HOW RANKING WORKS" ghost btn | `onLearnMore` → empty arrow fn in route | Open explainer modal or sheet | ❌ Fake only |

### CalibrationScreen (per step)
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Back arrow | router.back() / replace to onboarding | Go back | ✅ Working |
| Score selector (1–10 cells) | setScore(n) local state | Select rating | ✅ Working |
| Tag pills | toggleTag() local state | Select/deselect tags | ✅ Working |
| "Continue" / "Compile Result" CTA | onNext(answer) → navigates | Advance step or go to results | ✅ Working |

### CalibrationResultsScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Loading scanner (1.8s) | setTimeout → setScanning(false) | Show animation then reveal | ✅ Working |
| "Enter Operating System" CTA | calibrate() + router.replace('/(tabs)') | Enter app | ✅ Working |
| First mission card | Static display, no onPress | Open mission detail | ❌ Not clickable |

### HomeScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Bell (notifications) | `router.push('/notifications')` | Open notifications | ✅ Working |
| Avatar circle | `router.push('/profile')` | Open profile | ✅ Working |
| "VIEW ALL →" (categories row) | `router.push('/logbook')` | Should go to category overview or logbook | ⚠️ Wrong route — goes to logbook, label says categories |
| CategoryStatCard (×5) | No onPress | Navigate to `/category/[id]` | ❌ Not clickable |
| MissionCard (active) | `router.push('/mission/${id}')` | Open mission detail | ✅ Working |
| Quick Action buttons (×4) | No onPress | TBD (Check-in, Browse, etc.) | ❌ Fake only |
| StreakCard | Static display | Could tap to open logbook | ❌ Not clickable |
| TrendCard | Static display | Could tap to open stats | ❌ Not clickable |

### MissionsScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Back arrow | `onBack` → undefined | Go back (tab: no back) | ⚠️ Unclear |
| "+" button (top right) | No onPress | Browse available missions | ❌ Fake only |
| Featured hero card | Static display | Navigate to mission detail | ❌ Not clickable |
| Filter pills (Active/Available/Completed) | setFilter() | Switch list | ✅ Working |
| Mission list cards | `router.push('/mission/${m.id}')` | Open mission detail | ✅ Working |

### CheckInScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Back arrow | answers pop + stepIndex-- | Go to previous step | ✅ Working |
| X cancel | Reset answers + step to 0 | Cancel check-in | ✅ Working |
| Score selector (1–10) | setScore(n) | Select rating | ✅ Working |
| Tag pills | toggleTag() | Select/deselect | ✅ Working |
| "Add voice memo" row | No onPress | Open voice recorder | ❌ Fake only |
| "Continue" / "Submit Check-in" | onNext(answer) → submitCheckIn + navigate | Advance or submit | ✅ Working |
| Header streak "DAY 47" | Hardcoded static text | Show real streak day count | ❌ Hardcoded |

### ResultsScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| "SHARE" ghost btn | `router.push('/(tabs)/share')` | Open share | ✅ Working |
| "Enter Operating System" CTA | `router.replace('/(tabs)')` | Return to home | ✅ Working |
| Category movement rows | Static display (uses mockUser) | Show real check-in deltas | ❌ Uses mock |
| Next mission card | Static display | Navigate to mission detail | ❌ Not clickable |

### StatsScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Back arrow | `router.back()` | Go back | ✅ Working |
| Search/filter button (top right) | No onPress | Filter/search stats | ❌ Fake only |
| Range selector (W/M/3M/Y/ALL) | setRange() visual only | Change chart data window | ⚠️ Visual only |
| Category breakdown rows | Static display | Navigate to CategoryDetailScreen | ❌ Not clickable |
| All metric data | Mock only | Real AppContext data | ❌ All mock |

### ShareScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Back arrow | `router.back()` | Go back | ✅ Working |
| Layout selector (×3) | setLayout() | Switch poster layout | ✅ Working |
| Format selector (×3) | setFormat() | Switch aspect ratio | ✅ Working |
| Send To buttons (IG/X/TT/Link/Save) | No onPress | Share via platform / save to camera roll | ❌ Fake only |
| Content toggles (×5) | setToggles() | Control poster content | ✅ Working (UI only) |
| "Broadcast" CTA | `onBroadcast` → empty fn | Trigger share sheet | ❌ Fake only |
| Poster data | mockLifeScore, mockCategoryScores | Real user data | ❌ All mock |

### ProfileScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Back arrow | `router.back()` | Go back | ✅ Working |
| Settings gear | `router.push('/settings')` | Open settings | ✅ Working |
| "Share Profile Card" CTA | `router.push('/(tabs)/share')` | Open share | ✅ Working |
| Profile identity data | hardcoded mockProfile | AppContext state | ❌ All mock |
| Records tiles (×6) | Static display | Real data from AppContext | ❌ All mock |

### SettingsPrivacyScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Back arrow | `router.back()` | Go back | ✅ Working |
| Identity rows (handle, name, tier, build) | Hardcoded "@kai.os", "Kai", etc. | AppContext values | ❌ Hardcoded |
| Share Privacy toggles (×2) | Local state only | Persist to AppContext/storage | ⚠️ UI only |
| Notification toggles (×4) | Local state only | Connect to push notification API | ⚠️ UI only |
| "Export data" ActionRow | Pressable with no handler | Export JSON | ❌ Fake only |
| "Reset calibration" ActionRow | Pressable with no handler | Call reset() from AppContext | ❌ Fake only |
| "Delete local data" ActionRow | Pressable with no handler | Call reset() + clear storage | ❌ Fake only |
| Terms / Privacy "View" | Static text | Open webview or link | ❌ Fake only |

### MissionDetailScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Back arrow | `router.back()` | Go back | ✅ Working |
| Task checkboxes | `toggleMissionTask()` → dispatched | Toggle task done | ✅ Working |
| "ABANDON" ghost btn | `abandonMission(m.id)` + back | Abandon mission | ✅ Working |
| "Continue Operation" (active) | No `onPress` at all | Stay on screen / close | ❌ Missing onPress |
| "Accept Operation" (available) | `acceptMission(m)` + back | Accept mission | ✅ Working |
| "View Result" (completed) | No `onPress` at all | Navigate to complete/failed screen | ❌ Missing onPress |
| "Cross Threshold to Unlock" | disabled prop | Locked state message | ✅ Correct |

### MissionCompleteScreen / MissionFailedScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| "SHARE" ghost | `router.push('/(tabs)/share')` | Open share | ✅ Working |
| "Continue" CTA | `router.replace('/(tabs)')` | Return to home | ✅ Working |
| "Assign Recovery" | `router.push('/mission/${id}')` | Open recovery mission | ✅ Working |
| All data | mockCompletionSample / mockFailureSample | Real completed mission data | ❌ All mock |
| `id` URL param | Received but never used | Look up actual mission | ❌ Ignored |

### RankPromotionScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| "SHARE" ghost (promotion) | onShare → router.push('/share') | Open share | ✅ Working |
| "Continue" / "Assign Recovery" | onContinue → replace | Navigate | ✅ Working |
| Unlocked mission cards | Static display, no onPress | Open mission detail | ❌ Not clickable |
| Recovery mission card | Static display, no onPress | Open mission detail | ❌ Not clickable |
| All tier/score data | mockPromotionSample / mockDemotionRiskSample | Real tier-change data | ❌ All mock |

### CategoryDetailScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Back arrow | `router.back()` | Go back | ✅ Working |
| All data | Computed from mockCategoryScores/mockLogbook | AppContext categories + real logbook | ❌ All mock |
| Related mission cards | Static display | Navigate to /mission/[id] | ❌ Not clickable |

### LogbookScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Back arrow | `router.back()` | Go back | ✅ Working |
| Entry rows (expand/collapse) | Local state toggle | Show/hide detail | ✅ Working |
| onSelectDay handler | No-op in route file | Could open day detail | ❌ Fake only |
| Data source | `state.logbook` if populated, else mockLogbook | Real check-in entries | ⚠️ Partial — logbook never written |

### NotificationsScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Back arrow | `router.back()` | Go back | ✅ Working |
| Notification item | Routes by kind (missions, promotion, weekly-report) | Open correct screen | ✅ Working |
| Data source | mockNotifications only | Real notification queue | ❌ All mock |

### WeeklyReportScreen
| Element | Current Behavior | Expected | Status |
|---------|-----------------|----------|--------|
| Back arrow | `router.back()` | Go back | ✅ Working |
| "SHARE" btn | `router.push('/(tabs)/share')` | Open share | ✅ Working |
| All data | mockWeeklyReport | Real compiled weekly data | ❌ All mock |

---

## 4. Route Map

| Route File | Screen Rendered | Linked From | Nav Works? |
|-----------|----------------|-------------|------------|
| `app/(onboarding)/index.tsx` | OnboardingScreen | RouteGuard (if not calibrated) | ✅ |
| `app/(onboarding)/calibration/[step].tsx` | CalibrationScreen | Onboarding "Begin Calibration", step N-1 | ✅ |
| `app/(onboarding)/results.tsx` | CalibrationResultsScreen | CalibrationScreen step 4 | ✅ |
| `app/(tabs)/index.tsx` | HomeScreen | Tab bar | ✅ |
| `app/(tabs)/missions.tsx` | MissionsScreen | Tab bar | ✅ |
| `app/(tabs)/checkin.tsx` | CheckInScreen | Tab bar | ✅ |
| `app/(tabs)/stats.tsx` | StatsScreen | Tab bar | ✅ |
| `app/(tabs)/share.tsx` | ShareScreen | Tab bar | ✅ |
| `app/checkin/results.tsx` | ResultsScreen | checkin.tsx after submission | ✅ |
| `app/mission/[id].tsx` | MissionDetailScreen | HomeScreen, MissionsScreen | ✅ |
| `app/mission/complete/[id].tsx` | MissionCompleteScreen | **Nothing** | ❌ Unreachable |
| `app/mission/failed/[id].tsx` | MissionFailedScreen | **Nothing** | ❌ Unreachable |
| `app/rank/promotion.tsx` | RankPromotionScreen | NotificationsScreen only | ⚠️ |
| `app/rank/demotion-risk.tsx` | RankPromotionScreen | NotificationsScreen only | ⚠️ |
| `app/category/[id].tsx` | CategoryDetailScreen | **Nothing** — no pressable cards | ❌ Unreachable |
| `app/logbook.tsx` | LogbookScreen | HomeScreen "VIEW ALL →" | ✅ |
| `app/notifications.tsx` | NotificationsScreen | HomeScreen bell | ✅ |
| `app/weekly-report.tsx` | WeeklyReportScreen | NotificationsScreen only | ⚠️ |
| `app/profile.tsx` | ProfileScreen | HomeScreen avatar | ✅ |
| `app/settings.tsx` | SettingsPrivacyScreen | ProfileScreen gear | ✅ |
| `app/dev/styleguide.tsx` | placeholder (no component) | **Nothing** | ❌ Unreachable |

---

## 5. Data Flow Audit

| Data Domain | Stored in AppContext? | Persisted to Storage? | Real or Mock in UI? | Notes |
|-------------|----------------------|-----------------------|---------------------|-------|
| `isCalibrated` | ✅ | ✅ | ✅ Real | Route guard reads this correctly |
| `score.value` | ✅ | ✅ | ✅ Real on Home/CheckIn | ResultsScreen uses it for prevScore/newScore |
| `score.tier` | ✅ | ✅ | ✅ Real | getTier() used everywhere |
| `score.streak` | ✅ | ✅ | ❌ CheckIn shows hardcoded "DAY 47" | applyCheckIn updates it but UI doesn't read it |
| `score.delta` | ✅ | ✅ | ✅ Real on Results | |
| `categories` (5 scores) | ✅ | ✅ | ❌ Mock in most screens | StatsScreen, ResultsScreen, CategoryDetailScreen all use mock |
| `activeMissions` | ✅ | ✅ | ❌ MissionsScreen ignores it | Only HomeScreen's first mission uses real state |
| `handle` | ✅ | ✅ | ❌ ProfileScreen and SettingsScreen show hardcoded "@kai.os" | |
| `displayName` | ✅ | ✅ | ✅ HomeScreen greeting uses it | |
| `build` | ✅ | ✅ | ❌ Results/Profile use mockBuild | |
| `rp` | ✅ | ❌ **NOT PERSISTED** | — | AppContext persistence effect omits `Storage.setRP()` |
| `logbook` | ✅ | ✅ (read) | ⚠️ Partial | LogbookScreen reads state.logbook, but `ADD_LOGBOOK_ENTRY` is **never dispatched** — entries never accumulate |
| Notifications | ❌ None | ❌ | ❌ mockNotifications | No real notification queue in AppState |
| Weekly report | ❌ None | ❌ | ❌ mockWeeklyReport | No computation logic |
| Share card data | ❌ None | ❌ | ❌ mockLifeScore | ShareScreen reads mock instead of AppContext |
| Rank change detection | ❌ None | — | ❌ | No code checks tier before/after checkIn to trigger promotion screen |

---

## 6. Core Loop Audit

### A. First-Use Loop
| Step | Status | Notes |
|------|--------|-------|
| OnboardingScreen | ✅ Working | |
| Calibration (5 steps) | ✅ Working | URL param passing works |
| LoadingScanState (1.8s) | ✅ Working | Shown in CalibrationResultsScreen |
| CalibrationResultsScreen | ✅ Working | Score computed from answers |
| "Enter Operating System" → HomeScreen | ✅ Working | calibrate() + router.replace |

### B. Daily Loop
| Step | Status | Notes |
|------|--------|-------|
| HomeScreen → Check-In tab | ✅ Working | Tab bar navigation |
| CheckInScreen (5 steps) | ✅ Working | Local stepIndex state |
| submitCheckIn dispatched | ✅ Working | EMA computed via applyCheckIn |
| → ResultsScreen | ✅ Working | |
| Results: score reveal | ✅ Working | Real prevScore/newScore |
| Results: category movement | ❌ Uses mockUser | Should use real post-checkin categories |
| Results: diagnosis | ❌ Uses mockDiagnosis | Should be computed from real category deltas |
| On tier change → RankPromotionScreen | ❌ Missing | No comparison of old vs new tier happens |
| → HomeScreen ("Enter OS") | ✅ Working | router.replace('/(tabs)') |
| Logbook entry written | ❌ Missing | ADD_LOGBOOK_ENTRY never dispatched |
| RP persisted | ❌ Missing | Storage.setRP() never called |

### C. Mission Loop
| Step | Status | Notes |
|------|--------|-------|
| MissionsScreen shows missions | ❌ Broken | Always shows mockActiveMissions, ignores state |
| Tap mission card → MissionDetailScreen | ✅ Working | |
| "Accept Operation" → state.activeMissions | ✅ Working | Reducer handles it |
| Mission appears on HomeScreen | ✅ Working | HomeScreen reads state.activeMissions[0] |
| Task checkboxes → toggleMissionTask | ✅ Working | |
| "Continue Operation" CTA | ❌ Missing onPress | No action defined |
| Mission complete detection | ❌ Missing | No logic checks if all tasks are done |
| → MissionCompleteScreen | ❌ Unreachable | No navigation to it exists |
| → MissionFailedScreen | ❌ Unreachable | No navigation to it exists |
| COMPLETE_MISSION action dispatched | ❌ Never | Reducer handles it but it's never dispatched |

---

## 7. MVP Gaps

These are the gaps that prevent the MVP from feeling complete. Listed in order of user impact.

### Critical (blocks core loop)
1. **[FIXED]** CategoryStatCard now pressable — HomeScreen + StatsScreen rows navigate to `/category/[id]`.
2. **[FIXED]** MissionCompleteScreen and MissionFailedScreen now reachable — Mark Complete CTA appears at 100% progress; abandon routes to /mission/failed/[id].
3. **[FIXED]** MissionsScreen now reads `state.activeMissions` (Available/Completed still seeded from mock library).
4. **[FIXED]** Rank promotion/demotion now triggered after check-in via `compareTiers(prevTier, newTier)`.
5. **[FIXED]** Logbook entries now written by SUBMIT_CHECKIN reducer.

### High (breaks data integrity)
6. **[FIXED]** RP and logbook now persisted via `Storage.setRP` / `Storage.setLogbook` in the persistence effect.
7. **[FIXED]** ResultsScreen category movement now passed from real `state.categories` deltas.
8. **[FIXED]** ProfileScreen now reads handle, displayName, score, build, RP, streak, favorite category from AppContext.
9. **[FIXED]** SettingsPrivacyScreen identity rows now read from AppContext.

### Medium (feels incomplete)
10. **[FIXED]** "Continue Operation" wired to `onContinue` (router.back).
11. **[FIXED]** "View Result" wired to `/mission/complete/[id]`.
12. **[FIXED]** Settings action rows now wired: Export → Share sheet w/ JSON, Reset/Delete → reset() + onboarding.
13. **[FIXED]** HomeScreen QuickActions now navigate (checkin → checkin tab, compete → missions, reflect → logbook).
14. **[FIXED]** StatsScreen now reads `state.score`, `state.categories`, `state.logbook`.
15. **[FIXED]** ShareScreen poster now uses real score/tier/handle/streak/category scores.
16. **[FIXED]** CheckIn streak display now shows `state.score.streak`.

### Low (polish)
17. **"HOW RANKING WORKS" on Onboarding is a no-op** (still open)
18. **Voice memo row in CheckInScreen has no handler** (still open — depends on audio dep)
19. **[FIXED]** Featured hero card in MissionsScreen is now pressable.
20. **MissionsScreen "+" button has no handler** (still open)
21. **[FIXED]** MissionCompleteScreen/FailedScreen now resolve the `id` URL param against the mission library.
22. **RankPromotionScreen mission cards are not pressable** (still open)
23. **WeeklyReportScreen is entirely mock** (still open)
24. **[PARTIAL]** Broadcast in ShareScreen now opens the system Share sheet with a text payload. Send To buttons show a clear alert pending `react-native-view-shot` install.
25. **StyleGuideScreen has no component** (still open)

---

## 8. Bugs & Risks

### Data Bugs
| # | Location | Bug | Severity |
|---|----------|-----|----------|
| 1 | `AppContext.tsx:254-263` | `Storage.setRP(state.rp)` is missing from the persistence `useEffect`. RP resets to 0 on every cold start. | High |
| 2 | `AppContext.tsx:submitCheckIn` | Does not dispatch `ADD_LOGBOOK_ENTRY`. Logbook never accumulates real entries. | High |
| 3 | `app/(tabs)/missions.tsx` | Passes `tier` and `onMissionPress` to `MissionsScreen` but `MissionsScreen` always renders `mockActiveMissions` — ignores `state.activeMissions`. | High |
| 4 | `ResultsScreen.tsx:46` | `const movement = mockUser.categories.map(...)` — hardcoded mock, never real. | Medium |
| 5 | `app/checkin/results.tsx` | Reads `state.score.delta` for `prevScore = state.score.value - (state.score.delta ?? 0)`. If `delta` is the lifetime delta (not the just-computed one), this could be wrong. Needs verification after `applyCheckIn`. | Medium |

### Route / Navigation Bugs
| # | Location | Bug | Severity |
|---|----------|-----|----------|
| 6 | `app/(tabs)/index.tsx:29` | `onViewAllCategories={() => router.push('/logbook')}` — navigates to logbook, but label in HomeScreen says "Life Categories". Should navigate to category grid or be relabeled. | Low |
| 7 | `mission/complete/[id].tsx` | `id` param is received but never used to look up mission data. Always shows `mockCompletionSample`. | Medium |
| 8 | `mission/failed/[id].tsx` | Same as above — ignores `id`. | Medium |
| 9 | No code | After `SUBMIT_CHECKIN`, nothing compares `prevTier` vs `newTier` to push `/rank/promotion`. | High |

### UI / Logic Bugs
| # | Location | Bug | Severity |
|---|----------|-----|----------|
| 10 | `MissionDetailScreen.tsx:179` | `<PrimaryCTA tier={tier} label="Continue Operation"/>` — missing `onPress`. Entire CTA is dead. | Medium |
| 11 | `MissionDetailScreen.tsx:195` | `<PrimaryCTA tier={tier} label="View Result"/>` — missing `onPress`. | Medium |
| 12 | `CheckInScreen.tsx:61` | `"DAY 47 · STREAK ACTIVE"` — hardcoded. Should use `state.score.streak`. | Low |
| 13 | `HomeScreen.tsx:115` | `"APEX VII"` left footer label — hardcoded. Should derive from current tier. | Low |
| 14 | `ProfileScreen.tsx:29` | `getTier(mockProfile.rankTier)` — uses mock, not `state.score.tier`. | High |
| 15 | `SettingsPrivacyScreen.tsx:53-56` | `@kai.os`, `Kai`, `APEX · V`, `The Operator` — hardcoded mock values. | Medium |

### Dead Components
| # | Component | Issue |
|---|-----------|-------|
| 16 | `ScoreRevealModal` | Built, exported — never rendered anywhere in app |
| 17 | `RankChangeModal` | Built, exported — never rendered anywhere in app |
| 18 | `StreakModals` (StreakBrokenModal + StreakProtectedModal) | Built, exported — never rendered |
| 19 | `MissionAssignedModal` | Built, exported — never rendered |

All 4 reveal modals from `MVP_SCOPE.md` are implemented as components but never triggered. Per `APP_FLOW.md`, they should be imperatively presented on top of any screen.

### Dependency Notes
- `react-native-reanimated` is listed in `PORT_MAP.md` as a required dependency but is **not installed** (not in `package.json`). The app uses `Animated` API (built-in) instead. No issue currently, but if anyone tries to add Reanimated code it will fail.
- `expo-sharing` and `react-native-view-shot` are listed in `PORT_MAP.md` as required for share functionality but are **not installed**. The Share screen "Broadcast" button will have no actual implementation until these are added.
- `SpaceGrotesk_400Regular` and `SpaceGrotesk_600SemiBold` are loaded in `app/_layout.tsx` but `tokens.ts` only references `SpaceGrotesk_500Medium` and `SpaceGrotesk_700Bold`. Minor waste, no bug.

---

## 9. Recommended Fix Order

Work in this exact order. Each fix is a pre-condition for the next block.

### Phase 1 — Route Connections (broken routes first)
1. **Make CategoryStatCard pressable** — Add `onPress` to CategoryStatCard component; add `onCategoryPress` prop to HomeScreen; wire to `router.push('/category/${cs.id}')` in `app/(tabs)/index.tsx`. Also add press to StatsScreen category rows.
2. **Wire rank change detection** — In `app/(tabs)/checkin.tsx`, capture `prevTier = state.score.tier` before `submitCheckIn()`, then after dispatch read new tier and push `/rank/promotion` or `/rank/demotion-risk` if tier changed.
3. **Connect mission complete/failed routes** — In `MissionDetailScreen`, when all tasks are done (progress = 100%), show "Mark Complete" CTA → dispatch `COMPLETE_MISSION` → `router.replace('/mission/complete/${mission.id}')`. Add "Failed" path from `onAbandon`.

### Phase 2 — Missing Button Handlers
4. **"Continue Operation" onPress** — MissionDetailScreen: add `onPress={onBack}` (staying on the screen is fine; pressing it closes detail).
5. **"View Result" onPress** — MissionDetailScreen completed state: `router.push('/mission/complete/${mission.id}')` if completed.
6. **Settings action rows** — Wire "Reset calibration" and "Delete local data" to `reset()` from AppContext. Wire "Export data" to JSON export of state.
7. **QuickActions on HomeScreen** — Map each quick action to a real route (Check-in → checkin tab, Missions → missions tab, Logbook → logbook, Stats → stats tab).

### Phase 3 — Data Connections
8. **Fix RP persistence** — Add `Storage.setRP(state.rp)` to the persistence `useEffect` in `AppContext.tsx`.
9. **Write logbook entries** — In the `SUBMIT_CHECKIN` reducer case (or in `submitCheckIn` callback), build a `LogbookEntry` and dispatch `ADD_LOGBOOK_ENTRY`.
10. **Connect MissionsScreen to state** — Pass `state.activeMissions` as a prop to `MissionsScreen`. Show real active missions in the "Active" filter; keep mock for "Available" and "Completed" until a real mission library exists.
11. **Connect ProfileScreen to AppContext** — Replace `mockProfile` with `state.handle`, `state.displayName`, `state.score`, `state.score.streak`, etc.
12. **Connect SettingsPrivacyScreen identity** — Replace hardcoded values with AppContext reads.
13. **Fix ResultsScreen category movement** — Pass real category deltas (from before/after check-in) to ResultsScreen. Compute diagnosis from real data.
14. **Fix CheckInScreen streak display** — Pass `state.score.streak` from route to screen; replace hardcoded "DAY 47".

### Phase 4 — Mission Flow Completion
15. **Mission completion detection** — When `toggleMissionTask` makes progress = 100%, surface the "Mark Complete" CTA visually.
16. **COMPLETE_MISSION dispatch** — Make completing a mission dispatch the action, update logbook, and award RP.
17. **Mission complete/failed screens use real data** — Pass real mission object through route params instead of always using mock.

### Phase 5 — Share & Stats
18. **StatsScreen real data** — Replace mockCategoryScores/mockLifeScore/mockPersonalRecords with AppContext reads.
19. **Share card real data** — Replace mockLifeScore/mockCategoryScores in ShareScreen with AppContext reads.
20. **Install expo-sharing + react-native-view-shot** — Wire Broadcast CTA to capture the poster and invoke share sheet.

### Phase 6 — Reveal Modals
21. **Surface ScoreRevealModal** — Show after ResultsScreen score animation completes.
22. **Surface RankChangeModal** — Show on tier change (wire to rank detection in step 2).
23. **Surface StreakModals** — Show StreakBrokenModal if `applyCheckIn` returns `streakBroke: true`; show StreakProtectedModal on milestone days.
24. **Surface MissionAssignedModal** — Show when a new mission is recommended after results.

---

## 10. Do Not Touch List

These are working correctly and match the design. Do not modify:

- **All visual design** — colors, typography, spacing, borders, border-radius, letter-spacing
- **AtmosphereBackground** — correct implementation, used on every screen
- **RankEmblem** — animated rings, hex core, HUD brackets, all working
- **HudCard** — glass fill, gradient border, top hot edge — all correct
- **EnergyBar** — shimmer animation, gradient fill, correct
- **FloatingTabBar** — custom tab bar wiring in `(tabs)/_layout.tsx`, working
- **CalibrationScreen** — step flow, score selector, tag pills — all working
- **CalibrationResultsScreen** — scanner → reveal sequence, working
- **scoringModel.ts** — pure EMA + streak + RP functions, correct per SCORING_MODEL.md
- **appStorage.ts** — AsyncStorage abstraction, correct
- **AppContext reducer** — all action handlers, correct
- **`app/_layout.tsx` RouteGuard** — calibration guard, working
- **Font loading** — correct (though 400Regular and 600SemiBold are loaded unnecessarily)
- **tsconfig.json `exclude: ["claudedesign"]`** — keeps design reference from polluting types
- **`.expo/types/router.d.ts`** — manually written typed routes, all 25+ routes correct

---

## Summary

### Biggest Missing Interactions
1. **CategoryStatCard has no onPress** — the entire CategoryDetailScreen is unreachable
2. **No path to MissionComplete/Failed** — mission loop has no completion
3. **"Continue Operation" CTA is dead** — no onPress on the most-used screen
4. **QuickActions on HomeScreen do nothing**
5. **All 4 reveal modals built but never shown** (ScoreRevealModal, RankChangeModal, StreakModals, MissionAssignedModal)

### Biggest Route Problems
1. `/mission/complete/[id]` — route exists, screen exists, nothing navigates there
2. `/mission/failed/[id]` — same
3. `/category/[id]` — route exists, screen exists, no pressable entry point in the app
4. Rank promotion/demotion screens only reachable via mock notifications — never auto-triggered

### Biggest Data Gaps
1. **RP is lost on restart** (not persisted to storage)
2. **Logbook never grows** (ADD_LOGBOOK_ENTRY never dispatched)
3. **MissionsScreen ignores state.activeMissions** (always shows mock)
4. **ProfileScreen, SettingsScreen identity, ShareScreen poster** — all use hardcoded mock, not AppContext
5. **ResultsScreen category movement** — uses mockUser, not real check-in output

### Fix First
In priority order:
1. `CategoryStatCard → onPress → /category/[id]` (unlock the most blocked route)
2. Rank change detection after check-in (closes the daily loop emotionally)
3. Mission complete path (MissionDetailScreen → progress = 100% → complete → `/mission/complete/[id]`)
4. RP persistence (one-line fix, stops data loss)
5. Logbook entry dispatch in submitCheckIn (one block of code, unlocks logbook)
6. MissionsScreen reads state.activeMissions (closes accept→appear loop)
