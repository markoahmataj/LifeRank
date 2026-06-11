// app/(tabs)/index.tsx
// Home screen (primary dashboard).

import { useRouter } from 'expo-router';
import { HomeScreen } from '@/src/screens/HomeScreen';
import { useApp } from '@/src/store/AppContext';
import type { UserState } from '@/src/design-system/types';

// Log Win and Reflect both open the logbook (the reflection surface); Log Win
// no longer duplicates Check-In. Check-In opens the daily flow, Compete opens
// missions. A dedicated lightweight "win" logger can replace the Log Win target
// later without touching the rest of the wiring.
const QUICK_ACTION_ROUTES: Record<string, string> = {
  'log-win':  '/logbook',
  'checkin':  '/(tabs)/checkin',
  'compete':  '/(tabs)/missions',
  'reflect':  '/logbook',
};

export default function HomeRoute() {
  const router = useRouter();
  const { state } = useApp();

  const user: UserState = {
    handle:        state.handle,
    displayName:   state.displayName,
    initial:       state.initial,
    score:         state.score,
    build:         state.build,
    categories:    state.categories,
    activeMissions: state.activeMissions,
  };

  return (
    <HomeScreen
      user={user}
      logbook={state.logbook}
      onNotifications={() => router.push('/notifications')}
      onProfile={() => router.push('/profile')}
      onViewAllCategories={() => router.push('/logbook')}
      onMissionPress={(id) => router.push(`/mission/${id}`)}
      onCategoryPress={(id) => router.push(`/category/${id}`)}
      onQuickAction={(id) => {
        const target = QUICK_ACTION_ROUTES[id];
        if (target) router.push(target as any);
      }}
      onStreakPress={() => router.push('/logbook')}
      onTrendPress={() => router.push('/(tabs)/stats')}
      onBrowseMissions={() => router.push('/(tabs)/missions')}
    />
  );
}
