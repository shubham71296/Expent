import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  createClient,
  type RealtimeClientOptions,
  type SupabaseClient,
} from '@supabase/supabase-js';

const url = (Constants.expoConfig?.extra?.supabaseUrl as string | undefined)?.trim();
const key = (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined)?.trim();

export const isSupabaseConfigured = Boolean(url && key);

/**
 * Node SSR (e.g. Expo web server) has no `window`. AsyncStorage’s web build uses
 * `window.localStorage`, so we must not use it there — auth-js uses in-memory
 * storage when `persistSession` is false.
 */
function isNodeJsWithoutDom(): boolean {
  if (typeof globalThis.window !== 'undefined') return false;
  if (typeof process === 'undefined' || !process.versions?.node) return false;
  if (
    typeof navigator !== 'undefined' &&
    (navigator as { product?: string }).product === 'ReactNative'
  ) {
    return false;
  }
  return true;
}

const isSsrNode = isNodeJsWithoutDom();

/** Node before v22 has no global WebSocket; Supabase Realtime needs the `ws` package there. */
function realtimeOptionsForCurrentRuntime() {
  if (typeof globalThis.WebSocket !== 'undefined') {
    return undefined;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const transport = require('ws') as RealtimeClientOptions['transport'];
    return { transport };
  } catch {
    return undefined;
  }
}

const optionalRealtime = realtimeOptionsForCurrentRuntime();

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, key!, {
      auth: isSsrNode
        ? {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          }
        : {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
      ...(optionalRealtime ? { realtime: optionalRealtime } : {}),
    })
  : null;
