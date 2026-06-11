// app/checkin/results.tsx
// Post check-in cinematic reveal.

import { useRouter } from 'expo-router';
import { ResultsScreen } from '@/src/screens/ResultsScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier, categories } from '@/src/design-system/tokens';
import { mockBuild, mockAvailableMissions } from '@/src/design-system/mockData';
import type { Diagnosis, CategoryScore } from '@/src/design-system/types';

export default function CheckInResultsRoute() {
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  const prevScore = +(state.score.value - (state.score.delta ?? 0)).toFixed(1);
  const newScore  = state.score.value;

  // Real category deltas from the last check-in.
  const categoryMovement = state.categories.map(c => ({ id: c.id, delta: c.delta }));

  const sorted = [...state.categories].sort((a, b) => b.delta - a.delta);
  const strongest = sorted[0];
  const weakest   = sorted[sorted.length - 1];

  const high = [...state.categories].sort((a, b) => b.value - a.value)[0];
  const low  = [...state.categories].sort((a, b) => a.value - b.value)[0];
  const gap  = +(high.value - low.value).toFixed(1);

  const nextMission =
    mockAvailableMissions.find(m => m.category === weakest.id && m.status !== 'locked')
    ?? mockAvailableMissions.find(m => m.status === 'featured')
    ?? mockAvailableMissions[0];

  const diagnosis: Diagnosis = {
    strongest: { category: strongest.id, delta: strongest.delta },
    weakest:   { category: weakest.id,   delta: weakest.delta   },
    imbalance: gap >= 0.8 ? { gap, high: high.id, low: low.id } : undefined,
    narrative:
      `${categories[strongest.id].name} moved fastest (${strongest.delta >= 0 ? '+' : ''}${strongest.delta.toFixed(1)}). ` +
      `${categories[weakest.id].name} needs attention (${weakest.delta >= 0 ? '+' : ''}${weakest.delta.toFixed(1)}).`,
    nextMissionId: nextMission?.id,
  };

  return (
    <ResultsScreen
      tier={tier}
      prevScore={prevScore}
      newScore={newScore}
      diagnosis={diagnosis}
      build={state.build ?? mockBuild}
      nextMission={nextMission}
      categoryMovement={categoryMovement}
      onShare={() => router.push('/(tabs)/share')}
      onContinue={() => router.replace('/(tabs)')}
      onNextMissionPress={(id) => router.push(`/mission/${id}`)}
    />
  );
}
