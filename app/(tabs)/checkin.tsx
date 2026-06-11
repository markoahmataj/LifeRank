// app/(tabs)/checkin.tsx
// Daily check-in flow: 5 category steps, then (if there are active missions) a
// mission-progress step. Dispatches SUBMIT_CHECKIN on completion and navigates
// to results / rank change.

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { CheckInScreen } from '@/src/screens/CheckInScreen';
import { MissionCheckInScreen } from '@/src/screens/MissionCheckInScreen';
import { useApp } from '@/src/store/AppContext';
import { useAuth } from '@/src/auth/AuthProvider';
import { getTier, CATEGORY_ORDER } from '@/src/design-system/tokens';
import { compareTiers, rpForMissionComplete } from '@/src/design-system/scoringModel';
import * as Sync from '@/src/services/liferankSync';
import type { CheckInAnswer, CategoryId } from '@/src/design-system/types';

export default function CheckInRoute() {
  const router = useRouter();
  const { state, submitCheckIn } = useApp();
  const { user } = useAuth();
  const tier = getTier(state.score.tier);

  const activeMissions = state.activeMissions;
  const hasMissionStep = activeMissions.length > 0;

  // 'category' = rating the 5 pillars; 'mission' = confirming active missions.
  const [phase, setPhase] = useState<'category' | 'mission'>('category');
  const [stepIndex, setStepIndex] = useState(0);
  // Answers indexed by category step, so stepping back restores the prior answer.
  const [answers, setAnswers] = useState<CheckInAnswer[]>([]);
  // missionId → done today.
  const [missionDaily, setMissionDaily] = useState<Record<string, boolean>>({});

  const resetFlow = () => {
    setAnswers([]);
    setStepIndex(0);
    setMissionDaily({});
    setPhase('category');
  };

  const exitToHome = () => {
    resetFlow();
    router.replace('/(tabs)');
  };

  // Shared submit — builds rawRatings/tags from category answers, dispatches the
  // check-in (with mission daily answers), fires mission_events for any mission
  // that completed, then routes to results / rank change.
  const finishCheckIn = (collected: CheckInAnswer[]) => {
    const rawRatings: Record<CategoryId, number> = {} as Record<CategoryId, number>;
    const tags = new Set<string>();
    collected.forEach(a => {
      rawRatings[a.category] = a.score;
      a.tags.forEach(t => tags.add(t));
    });
    CATEGORY_ORDER.forEach(id => {
      if (rawRatings[id] === undefined) rawRatings[id] = 5;
    });

    const { prevTier, newTier, prevScore, newScore, entry, rpEarned, newlyCompletedMissions } =
      submitCheckIn(rawRatings, { tags: Array.from(tags), missionDaily });
    const direction = compareTiers(prevTier, newTier);

    Sync.insertCheckin(entry, rpEarned);

    // Log a completion event for each mission that finished via this check-in.
    if (user) {
      newlyCompletedMissions.forEach(m => {
        Sync.insertMissionEvent(user.id, {
          missionId: m.id,
          eventType: 'completed',
          missionSnapshot: m,
          rpEarned: rpForMissionComplete(m),
          scoreImpact: m.rewardScore,
        });
      });
    }

    resetFlow();

    if (direction > 0) {
      router.push(`/rank/promotion?prevTier=${prevTier}&newTier=${newTier}&prevScore=${prevScore}&newScore=${newScore}`);
    } else if (direction < 0) {
      router.push(`/rank/demotion-risk?prevTier=${prevTier}&newTier=${newTier}&prevScore=${prevScore}&newScore=${newScore}`);
    } else {
      router.push('/checkin/results');
    }
  };

  // ── MISSION PHASE ───────────────────────────────────────────────────
  if (phase === 'mission') {
    return (
      <MissionCheckInScreen
        tier={tier}
        missions={activeMissions}
        answers={missionDaily}
        streak={state.score.streak}
        onToggle={(missionId, done) => setMissionDaily(prev => ({ ...prev, [missionId]: done }))}
        onBack={() => setPhase('category')}
        onCancel={exitToHome}
        onSubmit={() => finishCheckIn(answers)}
      />
    );
  }

  // ── CATEGORY PHASE ──────────────────────────────────────────────────
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
      isFinalStep={!hasMissionStep}
      onNext={(answer) => {
        const updated = [...answers];
        updated[stepIndex] = answer;
        setAnswers(updated);

        if (stepIndex < CATEGORY_ORDER.length - 1) {
          setStepIndex(stepIndex + 1);
          return;
        }

        // Last category done. Go to the mission step if there are active missions,
        // otherwise submit immediately.
        if (hasMissionStep) {
          setPhase('mission');
        } else {
          finishCheckIn(updated);
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
