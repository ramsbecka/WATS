import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const hasValidSupabase = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.startsWith('https://placeholder'));

// Use placeholder so app loads even when .env is missing (avoids white screen)
const effectiveUrl = supabaseUrl || 'https://placeholder.supabase.co';
const effectiveKey = supabaseAnonKey || 'placeholder-anon-key';

// Auth storage: AsyncStorage on all platforms (avoids SecureStore 2KB limit that breaks session + upload)
// On web we could use localStorage; AsyncStorage works on web too when using react-native-web
const storage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const supabase = createClient(effectiveUrl, effectiveKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Refresh token before it expires (refresh every 30 minutes)
    flowType: 'pkce',
  },
});
