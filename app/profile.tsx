// app/profile.tsx
// Rank identity / profile screen.

import { useRouter } from 'expo-router';
import { ProfileScreen } from '@/src/screens/ProfileScreen';
import { useApp } from '@/src/store/AppContext';

export default function ProfileRoute() {
  const router = useRouter();
  const { state } = useApp();

  // Strongest pillar by current value drives the "favorite" category display.
  const fav = [...state.categories].sort((a, b) => b.value - a.value)[0]?.id;

  return (
    <ProfileScreen
      onBack={() => router.back()}
      onShare={() => router.push('/(tabs)/share')}
      onOpenSettings={() => router.push('/settings')}
      handle={state.handle}
      displayName={state.displayName}
      score={state.score}
      build={state.build}
      rp={state.rp}
      favoriteCategory={fav}
      totalCheckIns={state.logbook.length}
      longestStreak={state.score.streak}
      personalBest={state.score.pbScore ?? state.score.value}
    />
  );
}
