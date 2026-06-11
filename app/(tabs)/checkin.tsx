// app/(tabs)/checkin.tsx
// Daily 5-step check-in flow. Manages stepIndex + per-step answers locally;
// dispatches SUBMIT_CHECKIN on completion and navigates to results / rank change.

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { CheckInScreen } from '@/src/screens/CheckInScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier, CATEGORY_ORDER } from '@/src/design-system/tokens';
import { compareTiers } from '@/src/design-system/scoringModel';
import * as Sync from '@/src/services/liferankSync';
import type { CheckInAnswer, CategoryId } from '@/src/design-system/types';

export default function CheckInRoute() {
  const router = useRouter();
  const { state, submitCheckIn } = useApp();
  const tier = getTier(state.score.tier);

  const [stepIndex, setStepIndex] = useState(0);
  // Answers indexed by category step, so stepping back restores the prior answer.
  const [answers, setAnswers] = useState<CheckInAnswer[]>([]);

  const resetFlow = () => {
    setAnswers([]);
    setStepIndex(0);
  };

  const exitToHome = () => {
    resetFlow();
    router.replace('/(tabs)');
  };

  // Restore a previously-entered answer when the user steps back to a category.
  const savedAnswer = answers[stepIndex];

  return (
    <CheckInScreen
      // Remount per step so each category starts from a clean (or restored) state
      // instead of bleeding the previous category's score/tags.
      key={stepIndex}
      tier={tier}
      streak={state.score.streak}
      stepIndex={stepIndex}
      initialScore={savedAnswer?.score}
      initialTags={savedAnswer?.tags}
      onNext={(answer) => {
        const updated = [...answers];
        updated[stepIndex] = answer;
        setAnswers(updated);

        if (stepIndex < CATEGORY_ORDER.length - 1) {
          setStepIndex(stepIndex + 1);
          return;
        }

        // Final category — build rawRatings map + collect tags from every answer.
        const rawRatings: Record<CategoryId, number> = {} as Record<CategoryId, number>;
        const tags = new Set<string>();
        updated.forEach(a => {
          rawRatings[a.category] = a.score;
          a.tags.forEach(t => tags.add(t));
        });
        // Ensure all categories have a value (fallback to 5).
        CATEGORY_ORDER.forEach(id => {
          if (rawRatings[id] === undefined) rawRatings[id] = 5;
        });

        const { prevTier, newTier, prevScore, newScore, entry, rpEarned } = submitCheckIn(rawRatings, { tags: Array.from(tags) });
        const direction = compareTiers(prevTier, newTier);

        Sync.insertCheckin(entry, rpEarned);

        resetFlow();

        if (direction > 0) {
          router.push(`/rank/promotion?prevTier=${prevTier}&newTier=${newTier}&prevScore=${prevScore}&newScore=${newScore}`);
        } else if (direction < 0) {
          router.push(`/rank/demotion-risk?prevTier=${prevTier}&newTier=${newTier}&prevScore=${prevScore}&newScore=${newScore}`);
        } else {
          router.push('/checkin/results');
        }
      }}
      onBack={() => {
        if (stepIndex > 0) {
          setStepIndex(stepIndex - 1);
        } else {
          // Category 1 — back exits the flow to the home dashboard.
          exitToHome();
        }
      }}
      onCancel={exitToHome}
    />
  );
}
