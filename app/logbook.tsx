// app/logbook.tsx
// Check-in history logbook.

import { useRouter } from 'expo-router';
import { LogbookScreen } from '@/src/screens/LogbookScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';

export default function LogbookRoute() {
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  // Mission lookups for the logbook. `completedDates` is the authoritative,
  // cloud-synced record of which days each mission advanced — so progress stays
  // coherent across a remote reload without any schema change.
  const allMissions = [...state.activeMissions, ...state.completedMissions];
  const missionTitles: Record<string, string> = {};
  const advancedByDate: Record<string, { id: string; title: string }[]> = {};
  allMissions.forEach(m => {
    missionTitles[m.id] = m.title;
    (m.completedDates ?? []).forEach(d => {
      (advancedByDate[d] ??= []).push({ id: m.id, title: m.title });
    });
  });

  return (
    <LogbookScreen
      tier={tier}
      entries={state.logbook}
      missionTitles={missionTitles}
      advancedByDate={advancedByDate}
      onBack={() => router.back()}
      onSelectDay={() => {}}
    />
  );
}
