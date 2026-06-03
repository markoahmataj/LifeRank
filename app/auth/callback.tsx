// app/auth/callback.tsx
// Web-only OAuth landing route.
//
// After a Google OAuth redirect on web, the browser returns here with
// ?code=... in the URL. Because detectSessionInUrl is true on web,
// the Supabase client automatically calls exchangeCodeForSession on
// mount, then fires onAuthStateChange(SIGNED_IN). AuthProvider picks
// up the new session and updates isAuthenticated. RouteGuard then
// redirects to /(onboarding) or /(tabs) based on isCalibrated.
//
// This screen just shows a spinner while all of that happens — it
// should be visible for less than a second under normal conditions.

import { View, ActivityIndicator } from 'react-native';

export default function AuthCallbackRoute() {
  return (
    <View style={{ flex: 1, backgroundColor: '#07070b', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#FF2D5C" size="large" />
    </View>
  );
}
