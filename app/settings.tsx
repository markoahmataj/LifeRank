// app/settings.tsx
// Settings & privacy screen.

import { Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { SettingsPrivacyScreen } from '@/src/screens/SettingsPrivacyScreen';
import { useApp } from '@/src/store/AppContext';
import { useAuth } from '@/src/auth/AuthProvider';
import { getTier } from '@/src/design-system/tokens';
import type { UserSettings } from '@/src/design-system/types';

export default function SettingsRoute() {
  const router = useRouter();
  const { state, reset, setSettings } = useApp();
  const { signOut } = useAuth();
  const tier = getTier(state.score.tier);

  const tierLabel = `${tier.name} · ${tier.sublabel.replace('TIER ', '')}`;

  const handleReset = () => {
    Alert.alert(
      'Reset calibration?',
      'This will clear your scores, missions, logbook, and identity. The next launch will start at onboarding.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            reset();
            router.replace('/(onboarding)');
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete local data?',
      'Wipe the device cache. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            reset();
            router.replace('/(onboarding)');
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign out?',
      'You will return to the sign-in screen. Your data is preserved in the cloud and restored on next sign-in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          // signOut() triggers the auth listener (clears local cache + RESET);
          // RouteGuard then redirects to /auth automatically.
          onPress: () => { signOut(); },
        },
      ],
    );
  };

  const handleExport = async () => {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        handle:        state.handle,
        displayName:   state.displayName,
        score:         state.score,
        categories:    state.categories,
        activeMissions: state.activeMissions,
        rp:            state.rp,
        logbook:       state.logbook,
        build:         state.build,
      },
      null,
      2,
    );
    try {
      await Share.share({ message: payload, title: 'LifeRank export' });
    } catch {
      Alert.alert('Export failed', 'Could not open the share sheet.');
    }
  };

  return (
    <SettingsPrivacyScreen
      tier={tier}
      onBack={() => router.back()}
      handle={state.handle}
      displayName={state.displayName}
      tierLabel={tierLabel}
      buildName={state.build?.name ?? 'Unassigned'}
      settings={state.settings}
      onToggleSetting={(key: keyof UserSettings, value: boolean) => setSettings({ [key]: value })}
      onResetCalibration={handleReset}
      onDeleteLocalData={handleDelete}
      onExportData={handleExport}
      onSignOut={handleSignOut}
    />
  );
}
