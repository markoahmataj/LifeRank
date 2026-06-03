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

  return (
    <LogbookScreen
      tier={tier}
      entries={state.logbook}
      onBack={() => router.back()}
      onSelectDay={() => {}}
    />
  );
}
