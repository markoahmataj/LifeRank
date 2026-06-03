// app/mission/complete/[id].tsx
// Mission completion reward reveal.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { MissionCompleteScreen } from '@/src/screens/MissionCompleteScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';
import { mockAvailableMissions } from '@/src/design-system/mockData';
import { rpForMissionComplete } from '@/src/design-system/scoringModel';
import type { CategoryId } from '@/src/design-system/types';

export default function MissionCompleteRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  // The mission was removed from state.activeMissions when completed.
  // Look it up from the static library — same object the user accepted.
  const libraryMission = mockAvailableMissions.find(m => m.id === id);

  const result = libraryMission
    ? {
        missionId:   libraryMission.id,
        title:       libraryMission.title,
        category:    libraryMission.category,
        rewardScore: libraryMission.rewardScore,
        rewardRP:    rpForMissionComplete(libraryMission),
        prevScore:   +(state.score.value - (libraryMission.rewardScore ?? 0)).toFixed(1),
        newScore:    state.score.value,
        prevTier:    state.score.tier,
        newTier:     state.score.tier,
        streakDays:  state.score.streak,
        streakKept:  state.score.streak > 0,
      }
    : {
        missionId:   id ?? '',
        title:       'Operation Complete',
        category:    'discipline' as CategoryId,
        rewardScore: 0,
        rewardRP:    0,
        prevScore:   state.score.value,
        newScore:    state.score.value,
        prevTier:    state.score.tier,
        newTier:     state.score.tier,
        streakDays:  state.score.streak,
        streakKept:  state.score.streak > 0,
      };

  return (
    <MissionCompleteScreen
      tier={tier}
      result={result}
      onShare={() => router.push('/(tabs)/share')}
      onContinue={() => router.replace('/(tabs)')}
    />
  );
}
