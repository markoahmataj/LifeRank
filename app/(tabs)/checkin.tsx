// app/(tabs)/checkin.tsx
// Daily 5-step check-in flow. Manages stepIndex locally; dispatches
// SUBMIT_CHECKIN on completion and navigates to results / rank change.

import { useState, useRef } from 'react';
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
  const answers = useRef<CheckInAnswer[]>([]);

  return (
    <CheckInScreen
      tier={tier}
      streak={state.score.streak}
      stepIndex={stepIndex}
      onNext={(answer) => {
        answers.current = [...answers.current, answer];
        if (stepIndex < 4) {
          setStepIndex(stepIndex + 1);
        } else {
          // Build rawRatings map + collect tags
          const rawRatings: Record<CategoryId, number> = {} as Record<CategoryId, number>;
          const tags = new Set<string>();
          answers.current.forEach(a => {
            rawRatings[a.category] = a.score;
            a.tags.forEach(t => tags.add(t));
          });
          // Ensure all categories have a value (fallback to 5)
          CATEGORY_ORDER.forEach(id => {
            if (rawRatings[id] === undefined) rawRatings[id] = 5;
          });

          const { prevTier, newTier, prevScore, newScore, entry, rpEarned } = submitCheckIn(rawRatings, { tags: Array.from(tags) });
          const direction = compareTiers(prevTier, newTier);

          Sync.insertCheckin(entry, rpEarned);

          answers.current = [];
          setStepIndex(0);

          if (direction > 0) {
            router.push(`/rank/promotion?prevTier=${prevTier}&newTier=${newTier}&prevScore=${prevScore}&newScore=${newScore}`);
          } else if (direction < 0) {
            router.push(`/rank/demotion-risk?prevTier=${prevTier}&newTier=${newTier}&prevScore=${prevScore}&newScore=${newScore}`);
          } else {
            router.push('/checkin/results');
          }
        }
      }}
      onBack={() => {
        if (stepIndex > 0) {
          answers.current = answers.current.slice(0, -1);
          setStepIndex(stepIndex - 1);
        }
      }}
      onCancel={() => {
        answers.current = [];
        setStepIndex(0);
      }}
    />
  );
}
