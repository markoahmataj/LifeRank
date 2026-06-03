// app/rank/demotion-risk.tsx
// Demotion risk warning screen.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { RankPromotionScreen } from '@/src/screens/RankPromotionScreen';
import { useApp } from '@/src/store/AppContext';
import type { RankTierId } from '@/src/design-system/types';

export default function DemotionRiskRoute() {
  const router = useRouter();
  const { state } = useApp();
  const params = useLocalSearchParams<{ prevTier?: string; newTier?: string; prevScore?: string; newScore?: string }>();

  const prevTier  = (params.prevTier ?? state.score.tier) as RankTierId;
  const newTier   = (params.newTier  ?? state.score.tier) as RankTierId;
  const prevScore = params.prevScore ? parseFloat(params.prevScore) : +(state.score.value - state.score.delta).toFixed(1);
  const newScore  = params.newScore  ? parseFloat(params.newScore)  : state.score.value;

  return (
    <RankPromotionScreen
      mode="demotion-risk"
      prevTier={prevTier}
      newTier={newTier}
      prevScore={prevScore}
      newScore={newScore}
      onContinue={() => router.replace('/(tabs)/missions')}
    />
  );
}
