# LifeRank — Supabase / Google / Apple Manual Setup

This is the manual configuration checklist for the LifeRank Supabase integration.
All **code** is already implemented. These are the dashboard / console steps a
human must perform. Nothing here can be done from the codebase.

Product rule: **only Google and Apple sign-in.** No email/password, magic links,
OTP, manual account creation, or guest mode.

---

## 0. Environment variables (`.env` at project root)

```
EXPO_PUBLIC_SUPABASE_URL=<from Supabase dashboard>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<from Google Cloud Console — leave empty until configured>
```

- `.env` is gitignored. For production use EAS secrets.
- `EXPO_PUBLIC_` prefix is required so Expo inlines them into the JS bundle.
- The anon key is a public, RLS-protected key by design — safe to ship.
- Google sign-in stays disabled while `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is empty.
  Apple sign-in still works without it.

---

## 1. Supabase project

1. The project already exists. Open it at supabase.com.
2. **Project Settings → API**
   - Copy **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Run the database migration

1. **SQL Editor → New query**
2. Paste the entire contents of [`supabase/migrations/001_initial_liferank.sql`](supabase/migrations/001_initial_liferank.sql)
3. **Run**. Verify 0 errors.
4. This creates the 5 MVP tables and enables RLS with per-user policies:
   `profiles`, `life_state`, `checkins`, `mission_events`, `user_settings`.

### Verify RLS
- **Database → Tables** → each table → confirm **RLS enabled**.
- **Authentication → Policies** → confirm each table shows its `*_own` policies.

---

## 3. Disable email/password auth

- **Authentication → Providers → Email → Disable.**
- This guarantees no one can create a password account. Required by the product rule.

---

## 4. Google sign-in

### 4a. Google Cloud Console — create OAuth clients
**APIs & Services → Credentials → Create OAuth Client ID**

1. **Web client**
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**.
   - The Client ID goes into `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
     (the app passes it to `GoogleSignin.configure({ webClientId })`).
2. **iOS client**
   - Application type: iOS
   - Bundle ID: `com.liferank.app`
   - Note the Client ID; reverse it for `iosUrlScheme`
     (e.g. `1234-abcd.apps.googleusercontent.com` → `com.googleusercontent.apps.1234-abcd`).
3. **Android client**
   - Application type: Android
   - Package name: `com.liferank.app`
   - SHA-1 fingerprint: from `eas credentials` or
     `keytool -list -v -keystore ~/.android/debug.keystore` (debug) for dev builds.

### 4b. Supabase — enable Google
- **Authentication → Providers → Google → Enable**
- Paste the **Web Client ID + Secret** from step 4a.

### 4c. app.json — set the iOS URL scheme
In [`app.json`](app.json), replace the placeholder in the google-signin plugin:
```json
["@react-native-google-signin/google-signin", {
  "iosUrlScheme": "com.googleusercontent.apps.PLACEHOLDER_REVERSED_IOS_CLIENT_ID"
}]
```
with your reversed iOS Client ID from step 4a‑2.

> **Google sign-in requires a development build** (`npx expo run:ios` /
> `npx expo run:android` or EAS). It does **not** work in Expo Go or on web.

---

## 5. Apple sign-in

### 5a. Apple Developer Portal
1. **Certificates, Identifiers & Profiles → Identifiers → App IDs → `com.liferank.app`**
   → Edit → Capabilities → **Sign In with Apple: Enable**.
2. **Keys → "+"** → name it → enable **Sign In with Apple** → Configure →
   Primary App ID: `com.liferank.app` → Save → Register →
   **Download the `.p8` file (once only — it cannot be re-downloaded)**.
3. Note your **Team ID** (top-right of the developer account) and the **Key ID**.

### 5b. Supabase — enable Apple
- **Authentication → Providers → Apple → Enable**
- Enter: **Team ID**, **Key ID**, the **`.p8` file contents**, and
  **Bundle ID** `com.liferank.app`.
- **For Expo Go testing on iOS:** also add `host.exp.Exponent` as an additional
  Client ID in the Apple provider.
- **No Services ID is needed** for the native `signInWithIdToken` flow
  (Services ID is only for the browser/web OAuth callback flow).

> **Apple sign-in is testable in Expo Go on iOS** (with `host.exp.Exponent`
> added above). Apple native auth is **iOS only**. The app hides the Apple
> button on platforms where `AppleAuthentication.isAvailableAsync()` is false.

---

## 6. URL configuration (optional, browser fallback only)

- **Authentication → URL Configuration**
  - Site URL: `https://localhost:8081` for web dev (update to production later).
  - The native Google + Apple flows do **not** use redirect URLs — they go
    through `signInWithIdToken` directly. This section only matters if a browser
    fallback is added later.

---

## 7. Smoke test

1. **Authentication → Users** is initially empty.
2. Run the app (dev build for Google; Expo Go iOS works for Apple).
3. Sign in. Confirm:
   - A new row in **Authentication → Users**.
   - A row in **Table Editor → profiles** (handle, display_name, provider_name).
   - A row in **user_settings** (defaults).
   - After calibration: a **life_state** row with `is_calibrated = true`.
   - After a check-in: a **checkins** row. Submit again same day → still **one**
     row for today (updated, not duplicated).
   - After accepting a mission: a **mission_events** row (`event_type='accepted'`)
     and `life_state.active_missions` updated.
