# LifeRank — Supabase Integration Summary

What was implemented in the Supabase Auth + cloud database pass, how it works,
how to test it, and what is still blocked on manual configuration.

Implemented per [`SUPABASE_DISCOVERY_REPORT.md`](SUPABASE_DISCOVERY_REPORT.md).
No UI redesign, no new features, no extra tables. TypeScript clean, expo-doctor
18/18, web bundle exports.

---

## Architecture

- **Source of truth: Supabase.** AsyncStorage is a write-through cache for fast
  cold-start paint and offline reads.
- **Auth:** `AuthProvider` (wraps `AppProvider`) owns the Supabase session.
  Two providers only — Google (native SDK) and Apple (native SDK), both via
  `supabase.auth.signInWithIdToken`. No email/password, magic links, OTP, manual
  signup, or guest mode.
- **Session storage:** `LargeSecureStore` hybrid — AES-256 key in
  `expo-secure-store`, encrypted session blob in AsyncStorage (SecureStore's
  2048-byte limit is too small for Supabase JWTs). On web it falls back to plain
  AsyncStorage since SecureStore is unavailable there.
- **Routing:** `RouteGuard` gates on session first, then calibration:
  - no session → `/auth`
  - session + `!isCalibrated` → `/(onboarding)`
  - session + `isCalibrated` → `/(tabs)`

---

## Files created

| File | Purpose |
|---|---|
| `supabase/migrations/001_initial_liferank.sql` | 5 tables + RLS policies + indexes. |
| `src/lib/supabase.ts` | Supabase client singleton + `LargeSecureStore`. Imports `react-native-get-random-values` first. Exposes `isSupabaseConfigured`. |
| `src/services/liferankSync.ts` | Cloud sync: `ensureProfile`, `syncLifeState`, `insertCheckin` (upsert), `insertMissionEvent`, `upsertSettings`, `fetchRemoteState`, `fetchProfile`, `clearRemoteData`, `migrateLocalToRemote`. |
| `src/auth/AuthProvider.tsx` | Session context: `session`, `user`, `isAuthLoading`, `isAuthenticated`, `signInWithGoogle`, `signInWithApple`, `signOut`. Captures Apple `fullName` before calling Supabase. |
| `src/screens/AuthScreen.tsx` | Two-button sign-in screen (Google + Apple), existing design system. Apple button hidden when unavailable. |
| `app/auth.tsx` | Route that renders `AuthScreen`. |
| `SUPABASE_SETUP.md` | Manual dashboard / Google / Apple checklist. |
| `SUPABASE_INTEGRATION_SUMMARY.md` | This file. |

`.env` already existed with real values and was left untouched.

## Files changed

| File | Change |
|---|---|
| `app/_layout.tsx` | Wrapped tree in `<AuthProvider>`; RouteGuard now waits for auth + hydration and gates on session; registered `auth` Stack screen. |
| `src/store/AppContext.tsx` | Added `settings` to `AppState` + `SET_SETTINGS` + `setSettings` helper. Auth listener pulls remote on sign-in (remote wins) and clears local cache on sign-out. Write-through to Supabase (gated). `reset()` now also clears remote data (keeps session). One-check-in-per-day logic via `buildCheckIn` (same-day re-submit edits today's entry, no streak/RP double-count). |
| `src/storage/appStorage.ts` | Added `USER_SETTINGS` key + `getUserSettings`/`setUserSettings`. Removed dead `STREAK` and `LAST_CHECKIN` keys. |
| `src/design-system/types.ts` | Added `UserSettings` + `DEFAULT_USER_SETTINGS`. |
| `app/(tabs)/checkin.tsx` | After submit, fires `insertCheckin(entry, rpEarned)` (background, upsert). |
| `app/(onboarding)/results.tsx` | After calibrate, fires `syncLifeState` to create the cloud row immediately. |
| `app/mission/[id].tsx` | Accept/complete/abandon fire `insertMissionEvent`; `life_state` syncs via write-through. |
| `app/settings.tsx` | Wired settings toggles to `setSettings`; added Sign Out (confirm → `signOut`). |
| `src/screens/SettingsPrivacyScreen.tsx` | Toggles now driven by `settings` prop + `onToggleSetting`; added Account → Sign Out row. |
| `app.json` | `ios.usesAppleSignIn: true`; plugins add `expo-secure-store`, `expo-apple-authentication`, and google-signin (placeholder `iosUrlScheme`). |
| `package.json` / `package-lock.json` | Dependencies below. |

---

## Dependencies installed

```
@supabase/supabase-js
expo-secure-store
aes-js
react-native-get-random-values   (pinned to ~1.11.0 for SDK 56 via expo install)
@types/aes-js                     (dev)
@react-native-google-signin/google-signin
expo-apple-authentication
```

Not installed (per NO-GO rules): `expo-web-browser`, `expo-auth-session`,
`react-native-url-polyfill`, any state library.

---

## SQL migration path

`supabase/migrations/001_initial_liferank.sql` — paste into Supabase SQL Editor.

> Note vs. the discovery report: `checkins` was given an **UPDATE** RLS policy
> (`checkins_update_own`). The report listed UPDATE as disabled, but the chosen
> design upserts the daily row (`ON CONFLICT (user_id, date) DO UPDATE`), which
> requires UPDATE permission. Rows remain effectively one-per-day; this is the
> documented consequence of the Option A uniqueness decision.

---

## Manual steps still required (see SUPABASE_SETUP.md)

**Supabase:** copy URL + anon key to `.env`; run the migration; disable Email
provider; enable Google provider (Web Client ID + Secret); enable Apple provider
(Team ID, Key ID, `.p8`, Bundle ID, plus `host.exp.Exponent` for Expo Go).

**Google Cloud:** create Web + iOS + Android OAuth clients for `com.liferank.app`;
put Web Client ID in `.env`; put reversed iOS Client ID in `app.json`.

**Apple Developer:** enable Sign In with Apple on the App ID; create a Sign In
with Apple key; download the `.p8`; note Team ID + Key ID.

---

## What works where

| Surface | Status |
|---|---|
| **Web** (`expo start --web`) | App boots, AuthScreen renders, cloud sync code paths compile. Native Google/Apple sign-in are **not** supported on web (buttons are present but the providers are native-only; Apple button auto-hides). Use for UI/routing/sync verification only. |
| **Expo Go (iOS)** | Apple sign-in works once the Supabase Apple provider has `host.exp.Exponent` added. Google does **not** work in Expo Go. |
| **Dev build (iOS/Android)** | Both Google and Apple sign-in work after the manual setup is complete. Required for any Google testing. |

---

## Validation results

- `npx tsc --noEmit` → **0 errors**.
- `npx expo-doctor` → **18/18 checks passed**.
- `npx expo export --platform web` → **bundles successfully** (941 modules).
- Native sign-in (Google/Apple) and Apple production flow are **not yet verified**
  — they require a dev build and the manual Google Cloud / Apple Developer setup.

---

## Remaining blockers

1. **Google native sign-in** is unverified until a development build exists and a
   Google Web Client ID is in `.env` + reversed iOS Client ID is in `app.json`.
2. **Apple production sign-in** is unverified until the Apple Developer key,
   Team ID, Key ID, and `.p8` are configured in the Supabase Apple provider.
3. `app.json` still contains the placeholder
   `com.googleusercontent.apps.PLACEHOLDER_REVERSED_IOS_CLIENT_ID` — replace
   before building for Google on iOS.
4. **Not implemented (out of scope, per plan):** `notifications`,
   `weekly_reports`, `mission_library` tables; those screens stay on mock data.
   `completedOperations` on Profile starts at 0 once `mission_events` is live.
