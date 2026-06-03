// app/logbook.tsx
// Check-in history logbook.

import { useRouter } from 'expo-router';
import { LogbookScreen } from '@/src/screens/LogbookScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';
import { mockLogbook } from '@/src/design-system/mockData';

export default function LogbookRoute() {
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  const entries = state.logbook.length > 0 ? state.logbook : mockLogbook;

  return (
    <LogbookScreen
      tier={tier}
      entries={entries}
      onBack={() => router.back()}
      onSelectDay={(date) => {
        // Future: navigate to that day's detail
      }}
    />
  );
}
