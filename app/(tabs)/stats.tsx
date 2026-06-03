// app/(tabs)/stats.tsx
// Telemetry / stats screen.

import { useRouter } from 'expo-router';
import { StatsScreen } from '@/src/screens/StatsScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';

export default function StatsRoute() {
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  return (
    <StatsScreen
      tier={tier}
      score={state.score}
      categoryScores={state.categories}
      logbook={state.logbook.length > 0 ? state.logbook : undefined}
      onBack={() => router.back()}
      onCategoryPress={(id) => router.push(`/category/${id}`)}
    />
  );
}
