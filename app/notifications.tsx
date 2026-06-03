// app/notifications.tsx
// Signal inbox / notifications.

import { useRouter } from 'expo-router';
import { NotificationsScreen } from '@/src/screens/NotificationsScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';
import type { LRNotification } from '@/src/design-system/types';

export default function NotificationsRoute() {
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  const handleSelect = (n: LRNotification) => {
    switch (n.kind) {
      case 'mission-reminder':
      case 'mission-unlocked':
        router.push('/(tabs)/missions');
        break;
      case 'promotion':
        router.push('/rank/promotion');
        break;
      case 'demotion':
        router.push('/rank/demotion-risk');
        break;
      case 'weekly-report':
        router.push('/weekly-report');
        break;
      default:
        break;
    }
  };

  return (
    <NotificationsScreen
      tier={tier}
      notifications={[]}
      onBack={() => router.back()}
      onSelect={handleSelect}
    />
  );
}
