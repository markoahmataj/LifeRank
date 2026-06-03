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

  return (
    <MissionsScreen
      tier={tier}
      activeMissions={state.activeMissions}
      availableMissions={mockAvailableMissions}
      completedMissions={[]}
      onMissionPress={(id) => router.push(`/mission/${id}`)}
    />
  );
}
