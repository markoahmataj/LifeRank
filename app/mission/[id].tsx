// app/mission/[id].tsx
// Full operation detail file.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { MissionDetailScreen } from '@/src/screens/MissionDetailScreen';
import { useApp } from '@/src/store/AppContext';
import { useAuth } from '@/src/auth/AuthProvider';
import { getTier } from '@/src/design-system/tokens';
import { rpForMissionComplete } from '@/src/design-system/scoringModel';
import * as Sync from '@/src/services/liferankSync';
import { mockAvailableMissions } from '@/src/design-system/mockData';
import { useEffect } from 'react';

export default function MissionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, acceptMission, abandonMission, completeMission, toggleMissionTask } = useApp();
  const { user } = useAuth();
  const tier = getTier(state.score.tier);

  // Active missions come from real state. Available missions are the static
  // library (allowed — not fake user progress). No other fallbacks.
  const mission =
    state.activeMissions.find(m => m.id === id) ??
    mockAvailableMissions.find(m => m.id === id) ??
    null;

  useEffect(() => {
    if (!mission) router.back();
  }, []);

  if (!mission) return null;

  return (
    <MissionDetailScreen
      tier={tier}
      mission={mission}
      onBack={() => router.back()}
      onAccept={(m) => {
        acceptMission(m);
        // Log the lifecycle event; life_state syncs via the write-through effect.
        if (user) Sync.insertMissionEvent(user.id, { missionId: m.id, eventType: 'accepted', missionSnapshot: m });
        router.back();
      }}
      onAbandon={(m) => {
        abandonMission(m.id);
        if (user) Sync.insertMissionEvent(user.id, { missionId: m.id, eventType: 'abandoned', missionSnapshot: m });
        router.replace(`/mission/failed/${m.id}`);
      }}
      onToggleTask={(taskId) => {
        toggleMissionTask(mission.id, taskId);
      }}
      onComplete={(m) => {
        const prevScore = state.score.value;
        const prevTier  = state.score.tier;
        completeMission(m.id);
        if (user) {
          Sync.insertMissionEvent(user.id, {
            missionId: m.id,
            eventType: 'completed',
            missionSnapshot: m,
            rpEarned: rpForMissionComplete(m),
            scoreImpact: m.rewardScore,
          });
        }
        router.replace(`/mission/complete/${m.id}?prevScore=${prevScore}&prevTier=${prevTier}`);
      }}
      onContinue={() => router.back()}
      onViewResult={(m) => router.push(`/mission/complete/${m.id}`)}
    />
  );
}
