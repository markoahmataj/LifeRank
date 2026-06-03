// app/mission/failed/[id].tsx
// Mission failure screen.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { MissionFailedScreen } from '@/src/screens/MissionFailedScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';
import { mockAvailableMissions } from '@/src/design-system/mockData';
import type { CategoryId } from '@/src/design-system/types';

export default function MissionFailedRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  // Look up from the static mission library only.
  const libraryMission = mockAvailableMissions.find(m => m.id === id);

  // Always suggest the first available mission as recovery.
  const recoveryMission = mockAvailableMissions[0]!;

  const failure = libraryMission
    ? {
        missionId:   libraryMission.id,
        title:       libraryMission.title,
        category:    libraryMission.category,
        missedDays:  Math.max(1, (libraryMission.duration ?? 7) - (libraryMission.daysIn ?? 0)),
        scoreImpact: -Math.abs((libraryMission.rewardScore ?? 0) * 0.5),
        streakBroken: state.score.streak === 0,
        recoveryMissionId: recoveryMission.id,
      }
    : {
        missionId:   id ?? '',
        title:       'Operation Abandoned',
        category:    'discipline' as CategoryId,
        missedDays:  1,
        scoreImpact: 0,
        streakBroken: false,
        recoveryMissionId: recoveryMission.id,
      };

  return (
    <MissionFailedScreen
      tier={tier}
      failure={failure}
      recoveryMission={recoveryMission}
      onRecalibrate={() => router.replace('/(tabs)')}
      onAssignRecovery={() => {
        router.push(`/mission/${recoveryMission.id}`);
      }}
    />
  );
}
