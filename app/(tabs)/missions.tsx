// app/(tabs)/missions.tsx
// Mission Control — list of operations.

import { useRouter } from 'expo-router';
import { MissionsScreen } from '@/src/screens/MissionsScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';
import { mockAvailableMissions } from '@/src/design-system/mockData';

export default function MissionsRoute() {
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  // Don't show a mission that's already active or completed as fresh "available".
  const takenIds = new Set([
    ...state.activeMissions.map(m => m.id),
    ...state.completedMissions.map(m => m.id),
  ]);
  const available = mockAvailableMissions.filter(m => !takenIds.has(m.id));

  return (
    <MissionsScreen
      tier={tier}
      activeMissions={state.activeMissions}
      availableMissions={available}
      completedMissions={state.completedMissions}
      onMissionPress={(id) => router.push(`/mission/${id}`)}
    />
  );
}
