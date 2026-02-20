import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Check kama tuko server-side (static export build)
const isServerSide = typeof window === 'undefined';
const isWeb = Platform.OS === 'web';

// Lazy load AsyncStorage - haitaki server-side
// AsyncStorage ina-try ku-access window internally, hivyo lazima tu-disable kwa server-side
// Use dynamic import ili ku-avoid module initialization wakati wa server-side
let AsyncStorageModule: any = null;
function getAsyncStorage() {
  if (isServerSide || isWeb) return null;
  if (AsyncStorageModule === null) {
    try {
      // Dynamic require - haitaki initialize wakati wa module load
      AsyncStorageModule = require('@react-native-async-storage/async-storage').default;
    } catch (e) {
      AsyncStorageModule = false; // Mark as failed
    }
  }
  return AsyncStorageModule || null;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const hasValidSupabase = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.startsWith('https://placeholder'));

// Use placeholder so app loads even when .env is missing (avoids white screen)
const effectiveUrl = supabaseUrl || 'https://placeholder.supabase.co';
const effectiveKey = supabaseAnonKey || 'placeholder-anon-key';

// Auth storage: Use localStorage kwa web (kwa static export), AsyncStorage kwa native
// Kwa static export, AsyncStorage haifanyi kazi kwa sababu window haipo server-side

// Safe storage wrapper - handles server-side rendering
const storage = isWeb && !isServerSide
  ? {
      // Use localStorage kwa web (client-side only)
      getItem: (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return Promise.resolve(localStorage.getItem(key));
        }
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(key, value);
        }
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(key);
        }
        return Promise.resolve();
      },
    }
  : isServerSide
  ? {
      // Server-side: return empty storage (session ita-load client-side)
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    }
  : (() => {
      const AsyncStorage = getAsyncStorage();
      return AsyncStorage
        ? {
            // Use AsyncStorage kwa native platforms
            getItem: (key: string) => AsyncStorage.getItem(key),
            setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
            removeItem: (key: string) => AsyncStorage.removeItem(key),
          }
        : {
            // Fallback kama AsyncStorage haipo
            getItem: () => Promise.resolve(null),
            setItem: () => Promise.resolve(),
            removeItem: () => Promise.resolve(),
          };
    })();

// Kwa server-side rendering (static export), disable session persistence
// Session ita-load client-side baada ya hydration
const authConfig = isServerSide
  ? {
      storage: storage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      flowType: 'pkce' as const,
    }
  : {
      storage: storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce' as const,
    };

export const supabase = createClient(effectiveUrl, effectiveKey, {
  auth: authConfig,
});
