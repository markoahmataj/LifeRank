// app/category/[id].tsx
// Category / pillar detail page.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { CategoryDetailScreen } from '@/src/screens/CategoryDetailScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';
import type { CategoryId } from '@/src/design-system/types';

export default function CategoryDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  return (
    <CategoryDetailScreen
      tier={tier}
      categoryId={(id as CategoryId) ?? 'discipline'}
      onBack={() => router.back()}
    />
  );
}
