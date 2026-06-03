// app/(tabs)/missions.tsx
// Mission Control — list of operations.

import { useRouter } from 'expo-router';
import { MissionsScreen } from '@/src/screens/MissionsScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';
import { mockAvailableMissions, mockCompletedMissions } from '@/src/design-system/mockData';

export default function MissionsRoute() {
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  // Active missions come from real state. Available stays mock until there's a
  // real mission library; completed is empty until we track completions.
  return (
    <MissionsScreen
      tier={tier}
      activeMissions={state.activeMissions}
      availableMissions={mockAvailableMissions}
      completedMissions={mockCompletedMissions}
      onMissionPress={(id) => router.push(`/mission/${id}`)}
    />
  );
}
