// app/mission/complete/[id].tsx
// Mission completion reward reveal.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { MissionCompleteScreen } from '@/src/screens/MissionCompleteScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';
import { mockAvailableMissions } from '@/src/design-system/mockData';
import { rpForMissionComplete } from '@/src/design-system/scoringModel';
import type { CategoryId, RankTierId } from '@/src/design-system/types';

export default function MissionCompleteRoute() {
  const { id, prevScore: prevScoreParam, prevTier: prevTierParam } =
    useLocalSearchParams<{ id: string; prevScore?: string; prevTier?: string }>();
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  // prevScore and prevTier were captured before the COMPLETE_MISSION dispatch
  // and passed as route params. state.score reflects the post-completion values.
  const prevScore = prevScoreParam != null ? parseFloat(prevScoreParam) : state.score.value;
  const prevTier  = (prevTierParam ?? state.score.tier) as RankTierId;

  // The mission was removed from activeMissions; look it up from the static library.
  const libraryMission =
    state.completedMissions.find(m => m.id === id) ??
    mockAvailableMissions.find(m => m.id === id);

  const result = libraryMission
    ? {
        missionId:   libraryMission.id,
        title:       libraryMission.title,
        category:    libraryMission.category,
        rewardScore: libraryMission.rewardScore ?? 0,
        rewardRP:    rpForMissionComplete(libraryMission),
        prevScore,
        newScore:    state.score.value,
        prevTier,
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
        prevScore,
        newScore:    state.score.value,
        prevTier,
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
