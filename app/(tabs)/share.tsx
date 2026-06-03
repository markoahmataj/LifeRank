// app/(tabs)/share.tsx
// Share / broadcast screen.

import { Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { ShareScreen } from '@/src/screens/ShareScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier } from '@/src/design-system/tokens';

export default function ShareRoute() {
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  const handleBroadcast = async () => {
    const message =
      `LifeRank · ${tier.name} · ${state.score.value.toFixed(1)}/10\n` +
      `Streak: ${state.score.streak} days\n` +
      `Handle: ${state.handle}`;
    try {
      await Share.share({ message, title: 'My LifeRank' });
    } catch {
      Alert.alert('Broadcast unavailable', 'Could not open the share sheet on this device.');
    }
  };

  return (
    <ShareScreen
      tier={tier}
      score={state.score}
      categoryScores={state.categories}
      handle={state.handle}
      onBack={() => router.back()}
      onBroadcast={handleBroadcast}
      onSendTo={(channel) => {
        Alert.alert(
          'Share channel',
          `Direct ${channel.toUpperCase()} sharing arrives once view-shot is installed. Use Broadcast for the system share sheet.`,
        );
      }}
    />
  );
}
