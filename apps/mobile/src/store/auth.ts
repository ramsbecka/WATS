import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  phone: string;
  display_name: string | null;
  role: string;
  locale: string;
};

type AuthStore = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  setProfile: (p: Profile | null) => void;
  setLoading: (l: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
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
    const { data } = await supabase.from('profiles').select('id, phone, display_name, role, locale').eq('id', userId).single();
    set({ profile: data });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
