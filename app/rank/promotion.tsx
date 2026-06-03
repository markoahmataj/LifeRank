// app/rank/promotion.tsx
// Rank promotion reveal.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { RankPromotionScreen } from '@/src/screens/RankPromotionScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';
import { mockAvailableMissions } from '@/src/design-system/mockData';
import type { RankTierId } from '@/src/design-system/types';

export default function RankPromotionRoute() {
  const router = useRouter();
  const { state } = useApp();
  const params = useLocalSearchParams<{ prevTier?: string; newTier?: string; prevScore?: string; newScore?: string }>();

  const prevTier = (params.prevTier ?? state.score.tier) as RankTierId;
  const newTier  = (params.newTier  ?? state.score.tier) as RankTierId;
  const prevScore = params.prevScore ? parseFloat(params.prevScore) : +(state.score.value - state.score.delta).toFixed(1);
  const newScore  = params.newScore  ? parseFloat(params.newScore)  : state.score.value;
  const newTierObj = getTier(newTier);

  // Show missions that unlock at the new tier from the static library.
  const unlockedMissions = mockAvailableMissions.filter(
    m => m.requiredTier === newTier || (m.status === 'featured' && newTier === 'apex'),
  );

  const narrative = `You crossed ${prevScore.toFixed(1)} → ${newScore.toFixed(1)}. ${newTierObj.name} unlocked. New operations available.`;

  return (
    <RankPromotionScreen
      mode="promotion"
      prevTier={prevTier}
      newTier={newTier}
      prevScore={prevScore}
      newScore={newScore}
      unlockedMissions={unlockedMissions}
      narrative={narrative}
      onShare={() => router.push('/(tabs)/share')}
      onContinue={() => router.replace('/(tabs)')}
    />
  );
}
