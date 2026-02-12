import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const hasValidSupabase = Boolean(url && anonKey && !url.startsWith('https://placeholder'));

const effectiveUrl = url || 'https://placeholder.supabase.co';
const effectiveKey = anonKey || 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(effectiveUrl, effectiveKey);
