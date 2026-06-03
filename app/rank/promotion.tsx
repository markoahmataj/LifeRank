// app/rank/promotion.tsx
// Rank promotion reveal.

import { useRouter } from 'expo-router';
import { RankPromotionScreen } from '@/src/screens/RankPromotionScreen';

export default function RankPromotionRoute() {
  const router = useRouter();

  return (
    <RankPromotionScreen
      mode="promotion"
      onShare={() => router.push('/(tabs)/share')}
      onContinue={() => router.replace('/(tabs)')}
    />
  );
}
