// app/profile.tsx
// Rank identity / profile screen.

import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ProfileScreen } from '@/src/screens/ProfileScreen';
import { useApp } from '@/src/store/AppContext';
import { useAuth } from '@/src/auth/AuthProvider';

export default function ProfileRoute() {
  const router = useRouter();
  const { state, updateProfile } = useApp();
  const { signOut } = useAuth();

  // Strongest pillar by current value drives the "favorite" category display.
  const fav = [...state.categories].sort((a, b) => b.value - a.value)[0]?.id;

  // Confirm, then signOut() — the auth listener clears local cache + RESET and the
  // route guard redirects to /auth automatically.
  const handleSignOut = () => {
    const message = 'You will return to the sign-in screen. Your data is preserved in the cloud and restored on next sign-in.';
    if (Platform.OS === 'web') {
      // React Native Web's Alert.alert ignores button callbacks — use the
      // browser confirm dialog so sign-out actually fires.
      if (typeof window === 'undefined' || window.confirm(`Sign out?\n\n${message}`)) {
        signOut();
      }
      return;
    }
    Alert.alert(
      'Sign out?',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => { signOut(); } },
      ],
    );
  };

  return (
    <ProfileScreen
      onBack={() => router.back()}
      onShare={() => router.push('/(tabs)/share')}
      onOpenSettings={() => router.push('/settings')}
      onSignOut={handleSignOut}
      onSaveProfile={(patch) => updateProfile(patch)}
      handle={state.handle}
      displayName={state.displayName}
      score={state.score}
      build={state.build}
      rp={state.rp}
      favoriteCategory={fav}
      joinedAt={state.joinedAt}
      totalCheckIns={state.logbook.length}
      longestStreak={state.score.streak}
      personalBest={state.score.pbScore ?? state.score.value}
      completedOperations={state.completedMissions.length}
    />
  );
}
