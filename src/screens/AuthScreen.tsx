// src/screens/AuthScreen.tsx
// The only entry point into LifeRank. Two providers only:
//   - Continue with Google
//   - Continue with Apple
// No email/password, magic links, OTP, manual sign-up, or guest mode.

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as AppleAuthentication from 'expo-apple-authentication';

import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { RankEmblem } from '../components/RankEmblem';
import { rankTiers, surface, fonts, alpha, spacing, radius } from '../design-system/tokens';

export interface AuthScreenProps {
  onGoogle?: () => void | Promise<void>;
  onApple?: () => void | Promise<void>;
}

export function AuthScreen({ onGoogle, onApple }: AuthScreenProps) {
  const tier = rankTiers.unranked;
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<null | 'google' | 'apple'>(null);

  useEffect(() => {
    let active = true;
    AppleAuthentication.isAvailableAsync()
      .then((v) => {
        if (active) setAppleAvailable(v);
      })
      .catch(() => {
        if (active) setAppleAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const run = async (which: 'google' | 'apple', fn?: () => void | Promise<void>) => {
    if (busy || !fn) return;
    setBusy(which);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.root}>
      <AtmosphereBackground tier={tier} showGrid intensity={0.85} />

      <View style={styles.content}>
        {/* BRAND */}
        <View style={styles.topBar}>
          <Text style={styles.brand}>L · I · F · E   R · A · N · K</Text>
          <Text style={styles.versionTag}>v1.0 · PRE-RELEASE</Text>
        </View>

        {/* EMBLEM */}
        <View style={styles.emblemBlock}>
          <RankEmblem tier={tier} size={200} animated />
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusLabel}>STATUS · SIGNED OUT</Text>
          </View>
        </View>

        {/* HEADLINE */}
        <View style={styles.headlineBlock}>
          <Text style={styles.headline}>
            Sign in to enter{'\n'}
            <Text style={{ color: '#fff' }}>your operating system.</Text>
          </Text>
          <Text style={styles.tagline}>
            Your rank, missions, and history are tied to your account.{'\n'}
            Continue with Google or Apple to begin.
          </Text>
        </View>

        {/* PROVIDERS */}
        <View style={styles.providerBlock}>
          {appleAvailable && (
            <Pressable
              onPress={() => run('apple', onApple)}
              disabled={!!busy}
              style={({ pressed }) => [
                styles.providerBtn,
                styles.appleBtn,
                { opacity: busy && busy !== 'apple' ? 0.5 : pressed ? 0.9 : 1 },
              ]}
            >
              {busy === 'apple' ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <AppleGlyph />
                  <Text style={styles.appleLabel}>Continue with Apple</Text>
                </>
              )}
            </Pressable>
          )}

          <Pressable
            onPress={() => run('google', onGoogle)}
            disabled={!!busy}
            style={({ pressed }) => [
              styles.providerBtn,
              styles.googleBtn,
              { opacity: busy && busy !== 'google' ? 0.5 : pressed ? 0.9 : 1 },
            ]}
          >
            {busy === 'google' ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <GoogleGlyph />
                <Text style={styles.googleLabel}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.legal}>
            No passwords. No guest mode. Your data syncs securely to your account.
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ── Provider glyphs ──────────────────────────────────────────────────── */
function AppleGlyph() {
  return (
    <Svg width={18} height={20} viewBox="0 0 22 24">
      <Path
        d="M16.365 3.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.68-3.43 2.71-1.517.03-1.85-.84-3.59-.84-1.74 0-2.116.81-3.55.87-1.426.06-2.535-1.4-3.49-2.73-1.95-2.73-3.43-7.72-1.43-11.09.98-1.67 2.73-2.71 4.6-2.74 1.466-.03 2.85.99 3.74.99.89 0 2.58-1.22 4.34-1.04.74.03 2.82.3 4.16 2.28-.11.07-2.48 1.45-2.45 4.34.03 3.47 3.04 4.63 3.07 4.64z"
        fill="#000"
      />
    </Svg>
  );
}

function GoogleGlyph() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface.bg },
  content: { flex: 1, paddingBottom: 40 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.hero,
    paddingBottom: 8,
  },
  brand: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 2, color: alpha('#fff', 0.7) },
  versionTag: { fontFamily: fonts.mono, fontSize: 9, color: surface.textMuted, letterSpacing: 1 },

  emblemBlock: { alignItems: 'center', marginTop: 24, gap: 12 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: alpha(rankTiers.unranked.primary, 0.4),
    backgroundColor: alpha(rankTiers.unranked.primary, 0.1),
  },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: rankTiers.unranked.primary },
  statusLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    color: rankTiers.unranked.primary,
    letterSpacing: 1.4,
  },

  headlineBlock: { paddingHorizontal: spacing.xl, marginTop: 36, alignItems: 'center' },
  headline: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    fontWeight: '700',
    color: alpha('#fff', 0.55),
    letterSpacing: -0.8,
    lineHeight: 34,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: surface.textTertiary,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 6,
  },

  providerBlock: {
    marginTop: 'auto',
    paddingHorizontal: spacing.xl,
    gap: 12,
  },
  providerBtn: {
    height: 56,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  appleBtn: { backgroundColor: '#fff' },
  appleLabel: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.2,
  },
  googleBtn: { backgroundColor: '#fff' },
  googleLabel: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
    letterSpacing: 0.2,
  },
  legal: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: surface.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
    paddingHorizontal: 12,
  },
});
