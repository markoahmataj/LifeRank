// app/weekly-report.tsx
// Weekly report screen.

import { useRouter } from 'expo-router';
import { WeeklyReportScreen } from '@/src/screens/WeeklyReportScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';

export default function WeeklyReportRoute() {
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  return (
    <WeeklyReportScreen
      tier={tier}
      onBack={() => router.back()}
      onShare={() => router.push('/(tabs)/share')}
    />
  );
}
