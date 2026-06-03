// app/(onboarding)/index.tsx
// Onboarding entry screen.

import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/src/screens/OnboardingScreen';

export default function OnboardingIndex() {
  const router = useRouter();

  return (
    <OnboardingScreen
      onBegin={() => router.push('/(onboarding)/calibration/0')}
      onLearnMore={() => {
        // Could open a modal or external link — no-op for MVP
      }}
    />
  );
}
