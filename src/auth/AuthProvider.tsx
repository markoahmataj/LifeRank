// src/auth/AuthProvider.tsx
// Holds the Supabase auth session and exposes the only two sign-in methods
// LifeRank supports: Continue with Google (native SDK) and Continue with
// Apple (native SDK). No email/password, magic links, OTP, or guest mode.
//
// Both providers use the native ID-token flow (signInWithIdToken) — NOT a
// browser OAuth redirect. Google requires a development build; Apple is
// testable in Expo Go on iOS.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ensureProfile } from '../services/liferankSync';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Configure the native Google SDK once. Web uses the package's web stub and
  // is not a supported sign-in surface, so we skip configuration there.
  useEffect(() => {
    if (Platform.OS !== 'web' && GOOGLE_WEB_CLIENT_ID) {
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    }
  }, []);

  // Track the Supabase session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  /* ── Google (native ID-token flow) ──────────────────────────────────── */
  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      console.warn('[auth] Supabase not configured — cannot sign in with Google.');
      return;
    }
    if (Platform.OS === 'web') {
      console.warn('[auth] Google sign-in requires a development build (not web/Expo Go).');
      return;
    }
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return; // user dismissed the picker
      const idToken = response.data.idToken;
      if (!idToken) throw new Error('Google did not return an idToken.');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) throw error;

      if (data.user) {
        await ensureProfile({
          userId: data.user.id,
          displayName:
            response.data.user.name ??
            (data.user.user_metadata?.full_name as string | undefined) ??
            'LifeRanker',
          providerName: 'google',
          avatarUrl:
            response.data.user.photo ??
            (data.user.user_metadata?.avatar_url as string | undefined) ??
            null,
        });
      }
    } catch (e) {
      if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) return;
      console.warn('[auth] Google sign-in failed:', (e as Error).message);
      throw e;
    }
  }, []);

  /* ── Apple (native ID-token flow) ───────────────────────────────────── */
  const signInWithApple = useCallback(async () => {
    if (!isSupabaseConfigured) {
      console.warn('[auth] Supabase not configured — cannot sign in with Apple.');
      return;
    }
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // CRITICAL: Apple sends fullName ONLY on the first sign-in. Capture it
      // now, before calling Supabase — it will be null on every later attempt.
      const displayName =
        [credential.fullName?.givenName, credential.fullName?.familyName]
          .filter(Boolean)
          .join(' ') || 'LifeRanker';

      if (!credential.identityToken) throw new Error('Apple did not return an identityToken.');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;

      if (data.user) {
        await ensureProfile({
          userId: data.user.id,
          displayName,
          providerName: 'apple',
          avatarUrl: null, // Apple never provides a photo
        });
      }
    } catch (e) {
      // User cancelled the Apple sheet — not an error worth surfacing.
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return;
      console.warn('[auth] Apple sign-in failed:', (e as Error).message);
      throw e;
    }
  }, []);

  /* ── Sign out ───────────────────────────────────────────────────────── */
  const signOut = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        try {
          await GoogleSignin.signOut();
        } catch {
          /* not signed in with Google — ignore */
        }
      }
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[auth] signOut failed:', (e as Error).message);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAuthLoading,
        isAuthenticated: !!session,
        signInWithGoogle,
        signInWithApple,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
