// app/mission/failed/[id].tsx
// Mission failure screen.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { MissionFailedScreen } from '@/src/screens/MissionFailedScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';
import {
  mockFailureSample,
  mockActiveMissions,
  mockAvailableMissions,
  mockCompletedMissions,
} from '@/src/design-system/mockData';

export default function MissionFailedRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  const realMission =
    mockActiveMissions.find(m => m.id === id) ??
    mockAvailableMissions.find(m => m.id === id) ??
    mockCompletedMissions.find(m => m.id === id);

  const failure = realMission
    ? {
        missionId:   realMission.id,
        title:       realMission.title,
        category:    realMission.category,
        missedDays:  Math.max(1, (realMission.duration ?? 7) - (realMission.daysIn ?? 0)),
        scoreImpact: -Math.abs(realMission.rewardScore * 0.5),
        streakBroken: state.score.streak === 0,
        recoveryMissionId: mockFailureSample.recoveryMissionId,
      }
    : mockFailureSample;

  const recoveryMission =
    mockAvailableMissions.find(m => m.id === failure.recoveryMissionId) ??
    mockAvailableMissions[2];

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
