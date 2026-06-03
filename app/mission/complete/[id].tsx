// app/mission/complete/[id].tsx
// Mission completion reward reveal.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { MissionCompleteScreen } from '@/src/screens/MissionCompleteScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';
import {
  mockCompletionSample,
  mockActiveMissions,
  mockAvailableMissions,
  mockCompletedMissions,
} from '@/src/design-system/mockData';
import { rpForMissionComplete } from '@/src/design-system/scoringModel';

export default function MissionCompleteRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  const realMission =
    mockActiveMissions.find(m => m.id === id) ??
    mockAvailableMissions.find(m => m.id === id) ??
    mockCompletedMissions.find(m => m.id === id);

  const result = realMission
    ? {
        missionId:   realMission.id,
        title:       realMission.title,
        category:    realMission.category,
        rewardScore: realMission.rewardScore,
        rewardRP:    rpForMissionComplete(realMission),
        prevScore:   state.score.value - realMission.rewardScore,
        newScore:    state.score.value,
        prevTier:    state.score.tier,
        newTier:     state.score.tier,
        streakDays:  state.score.streak,
        streakKept:  state.score.streak > 0,
      }
    : mockCompletionSample;

  return (
    <MissionCompleteScreen
      tier={tier}
      result={result}
      onShare={() => router.push('/(tabs)/share')}
      onContinue={() => router.replace('/(tabs)')}
    />
  );
}
