// app/(onboarding)/results.tsx
// Calibration result reveal. Computes initial score from answers, then
// dispatches CALIBRATE and navigates to the main app.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalibrationResultsScreen } from '@/src/screens/CalibrationResultsScreen';
import { useApp } from '@/src/store/AppContext';
import * as Sync from '@/src/services/liferankSync';
import { computeLifeScore, tierForScore } from '@/src/design-system/scoringModel';
import type { CalibrationAnswer, CalibrationResult, CategoryScore } from '@/src/design-system/types';
import { mockBuild, mockCalibrationResult, mockAvailableMissions } from '@/src/design-system/mockData';
import { CATEGORY_ORDER } from '@/src/design-system/tokens';

function buildResult(answers: CalibrationAnswer[]): CalibrationResult {
  const categoryScores: CategoryScore[] = CATEGORY_ORDER.map(id => {
    const ans = answers.find(a => a.category === id);
    return { id, value: ans?.score ?? 5, delta: 0 };
  });

  const lifeScore = computeLifeScore({
    categoryScores,
    streakDays: 0,
    activeMissions: [],
  });
  const tier = tierForScore(lifeScore);

  const sorted = [...categoryScores].sort((a, b) => b.value - a.value);

  return {
    initialScore: lifeScore,
    initialTier: tier,
    strongest: sorted[0],
    weakest: sorted[sorted.length - 1],
    build: mockBuild,
    firstMissionId: mockCalibrationResult.firstMissionId,
    narrative: `System baseline recorded. Life Score ${lifeScore.toFixed(1)} detected. ${tier.toUpperCase()} tier confirmed. First operation assigned.`,
  };
}

export default function CalibrationResultsRoute() {
  const { answers: answersParam } = useLocalSearchParams<{ answers?: string }>();
  const router = useRouter();
  const { calibrate, state } = useApp();

  const answers: CalibrationAnswer[] = answersParam
    ? (JSON.parse(answersParam) as CalibrationAnswer[])
    : [];

  const result = answers.length === 5 ? buildResult(answers) : mockCalibrationResult;

  const firstMission =
    mockAvailableMissions.find(m => m.id === result.firstMissionId) ??
    mockAvailableMissions[0];

  const categoryScores: CategoryScore[] = CATEGORY_ORDER.map(id => {
    const ans = answers.find(a => a.category === id);
    return { id, value: ans?.score ?? 5, delta: 0 };
  });

  return (
    <CalibrationResultsScreen
      result={result}
      firstMission={firstMission}
      showScannerFor={1800}
      onContinue={() => {
        const score = {
          value: result.initialScore,
          delta: 0,
          tier: result.initialTier,
          nextRankAt: 3.0,
          streak: 0,
        };
        calibrate({
          score,
          categories: categoryScores,
          build: result.build,
          handle: state.handle,
          displayName: state.displayName,
        });
        // Write the freshly-calibrated state to Supabase. The AppContext
        // write-through effect also covers this, but we call it explicitly so
        // the user's cloud life_state row exists immediately after calibration.
        Sync.syncLifeState({
          ...state,
          isCalibrated: true,
          score,
          categories: categoryScores,
          build: result.build,
        });
        router.replace('/(tabs)');
      }}
    />
  );
}
