import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  phone: string | null;
  email?: string | null;
  display_name: string | null;
  avatar_url?: string | null;
  role: string;
  locale: string;
  updated_at?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  national_id?: string | null;
  region?: string | null;
  district?: string | null;
  ward?: string | null;
  street_address?: string | null;
};

type ProfileUpdate = {
  display_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  national_id?: string | null;
  region?: string | null;
  district?: string | null;
  ward?: string | null;
  street_address?: string | null;
};

type AuthStore = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  setProfile: (p: Profile | null) => void;
  setLoading: (l: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  ensureProfile: (user: User) => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  fetchProfile: async (userId) => {
    const { data } = await supabase.from('profile').select('id, phone, email, display_name, avatar_url, role, locale, updated_at, date_of_birth, gender, national_id, region, district, ward, street_address').eq('id', userId).single();
    set({ profile: data });
    const { user } = get();
    if (user && !data) await get().ensureProfile(user);
  },
  ensureProfile: async (user) => {
    const meta = user.user_metadata ?? {};
    const { error, data } = await supabase.from('profile').upsert(
      {
        id: user.id,
        email: user.email ?? null,
        phone: user.phone ?? meta.phone ?? null,
        display_name: meta.display_name ?? null,
        role: 'customer',
      },
      { onConflict: 'id' }
    ).select('id, phone, email, display_name, avatar_url, role, locale, updated_at, date_of_birth, gender, national_id, region, district, ward, street_address').single();
    if (!error && data) set({ profile: data });
  },
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user?.id) return { error: new Error('Not signed in') };
    const { error, data } = await supabase
      .from('profile')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id, phone, email, display_name, avatar_url, role, locale, updated_at, date_of_birth, gender, national_id, region, district, ward, street_address')
      .single();
    if (!error && data) set({ profile: data });
    return { error: error ? new Error(error.message) : null };
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
