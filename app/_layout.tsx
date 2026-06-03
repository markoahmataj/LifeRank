// app/_layout.tsx
// Root layout: font loading, AppProvider, route guard.

import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';

import { AppProvider, useApp } from '@/src/store/AppContext';
import { AuthProvider, useAuth } from '@/src/auth/AuthProvider';

SplashScreen.preventAutoHideAsync();

function RouteGuard() {
  const { state } = useApp();
  const { isCalibrated, isHydrated } = state;
  const { isAuthenticated, isAuthLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait for both the auth check and the local hydrate to settle.
    if (isAuthLoading || !isHydrated) return;

    const seg0 = segments[0] as string | undefined;
    const inAuth = seg0 === 'auth';
    const inOnboarding = seg0 === '(onboarding)';

    if (!isAuthenticated) {
      // No session → the only allowed screen is the auth screen.
      if (!inAuth) router.replace('/auth');
      return;
    }

    // Authenticated.
    if (!isCalibrated) {
      if (!inOnboarding) router.replace('/(onboarding)');
    } else if (inAuth || inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isAuthLoading, isCalibrated, isHydrated, segments]);

  return null;
}

function RootLayoutInner() {
  return (
    <>
      <RouteGuard />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#080C14' } }}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="mission/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="mission/complete/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="mission/failed/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="rank/promotion" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="rank/demotion-risk" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="category/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="checkin/results" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="logbook" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="weekly-report" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="dev/styleguide" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#080C14' }} />;
  }

  return (
    <AuthProvider>
      <AppProvider>
        <RootLayoutInner />
      </AppProvider>
    </AuthProvider>
  );
}
