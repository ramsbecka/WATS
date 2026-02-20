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

// Safe storage wrapper - handles server-side rendering and invalid tokens
const storage = isWeb && !isServerSide
  ? {
      // Use localStorage kwa web (client-side only)
      getItem: async (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            return localStorage.getItem(key);
          }
        } catch (e) {
          // Clear invalid token kama kuna error
          if (key.includes('auth-token')) {
            try {
              localStorage.removeItem(key);
            } catch {}
          }
        }
        return null;
      },
      setItem: async (key: string, value: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(key, value);
          }
        } catch (e) {
          // Ignore storage errors
        }
      },
      removeItem: async (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Ignore storage errors
        }
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
            // Use AsyncStorage kwa native platforms with error handling
            getItem: async (key: string) => {
              try {
                return await AsyncStorage.getItem(key);
              } catch (e) {
                // Clear invalid token kama kuna error
                if (key.includes('auth-token')) {
                  try {
                    await AsyncStorage.removeItem(key);
                  } catch {}
                }
                return null;
              }
            },
            setItem: async (key: string, value: string) => {
              try {
                await AsyncStorage.setItem(key, value);
              } catch (e) {
                // Ignore storage errors
              }
            },
            removeItem: async (key: string) => {
              try {
                await AsyncStorage.removeItem(key);
              } catch (e) {
                // Ignore storage errors
              }
            },
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

// Handle refresh token errors gracefully - suppress and clear invalid tokens
if (!isServerSide) {
  // Temporarily suppress "Invalid Refresh Token" errors during initialization
  // These errors occur when Supabase tries to refresh a token that doesn't exist
  const originalError = console.error;
  let suppressInitErrors = true;
  const suppressTimeout = setTimeout(() => {
    suppressInitErrors = false;
  }, 2000);
  
  // Override console.error to suppress refresh token errors during initialization
  console.error = (...args: any[]) => {
    if (suppressInitErrors) {
      const errorStr = args.join(' ');
      // Only suppress specific refresh token errors during initialization
      if (
        errorStr.includes('Invalid Refresh Token') ||
        errorStr.includes('Refresh Token Not Found') ||
        (errorStr.includes('AuthApiError') && errorStr.includes('Refresh Token'))
      ) {
        // Suppress this specific error during initialization
        return;
      }
    }
    originalError(...args);
  };
  
  // Listen for auth errors and clear invalid tokens
  supabase.auth.onAuthStateChange(async (event, session) => {
    // If token refresh fails or user is signed out, clear storage
    if (event === 'SIGNED_OUT' && !session) {
      // Clear all auth-related storage keys
      try {
        const projectRef = effectiveUrl.split('//')[1]?.split('.')[0];
        if (projectRef) {
          const authKey = `sb-${projectRef}-auth-token`;
          await storage.removeItem(authKey);
        }
      } catch (e) {
        // Ignore errors when clearing
      }
    }
  });
  
  // Proactively clear invalid tokens on initialization
  setTimeout(async () => {
    try {
      const { error } = await supabase.auth.getSession();
      // If there's an error getting session, it might be due to invalid token
      // The error will be handled by onAuthStateChange above
    } catch (e: any) {
      // If error is about refresh token, clear storage
      if (e?.message?.includes('Refresh Token') || e?.message?.includes('Invalid Refresh Token')) {
        try {
          const projectRef = effectiveUrl.split('//')[1]?.split('.')[0];
          if (projectRef) {
            const authKey = `sb-${projectRef}-auth-token`;
            await storage.removeItem(authKey);
          }
        } catch {}
      }
    }
    // Clear suppression timeout after handling
    clearTimeout(suppressTimeout);
  }, 100);
}
