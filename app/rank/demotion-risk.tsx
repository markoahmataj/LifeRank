// app/rank/demotion-risk.tsx
// Demotion risk warning screen.

import { useRouter } from 'expo-router';
import { RankPromotionScreen } from '@/src/screens/RankPromotionScreen';

export default function DemotionRiskRoute() {
  const router = useRouter();

  return (
    <RankPromotionScreen
      mode="demotion-risk"
      onContinue={() => router.replace('/(tabs)/missions')}
    />
  );
}
