// src/lib/supabase.ts
// Supabase client singleton.
//
// Session storage uses the official Supabase "LargeSecureStore" hybrid:
//   - a per-key AES-256 encryption key is stored in expo-secure-store
//   - the encrypted session payload is stored in AsyncStorage
// SecureStore has a 2048-byte value limit; Supabase JWT/refresh tokens exceed
// it, so we encrypt-then-store-in-AsyncStorage rather than using SecureStore
// directly. We never use plain AsyncStorage as the auth storage on native.
//
// `react-native-get-random-values` MUST be imported first so that
// `crypto.getRandomValues` exists before aes-js / supabase-js touch it.
import 'react-native-get-random-values';

import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True when both env vars are present. AuthProvider uses this to avoid
 *  hitting a placeholder backend before the project is configured. */
export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
      'Auth and cloud sync are disabled until they are added to .env.',
  );
}

/**
 * Hybrid secure storage adapter for the Supabase auth session.
 * On web, expo-secure-store is unavailable, so the payload is stored in
 * AsyncStorage (localStorage) without the extra encryption hop.
 */
class LargeSecureStore {
  private get useSecureStore() {
    return Platform.OS !== 'web';
  }

  private async _encrypt(key: string, value: string): Promise<string> {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async _decrypt(key: string, value: string): Promise<string | null> {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return null;
    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string): Promise<string | null> {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return stored;
    if (!this.useSecureStore) return stored;
    return this._decrypt(key, stored);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.useSecureStore) {
      await AsyncStorage.setItem(key, value);
      return;
    }
    const encrypted = await this._encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    if (this.useSecureStore) {
      await SecureStore.deleteItemAsync(key);
    }
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: new LargeSecureStore(),
      autoRefreshToken: true,
      persistSession: true,
      // On web, Supabase must parse the ?code= query param returned by the
      // OAuth redirect and exchange it for a session automatically. On native
      // we handle deep-link auth ourselves, so this must stay false there.
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
);
