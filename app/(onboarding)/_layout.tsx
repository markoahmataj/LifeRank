// app/(onboarding)/_layout.tsx
// Onboarding group layout — no header, dark background.

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#080C14' } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="calibration/[step]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="results" options={{ headerShown: false, animation: 'slide_from_right' }} />
    </Stack>
  );
}
