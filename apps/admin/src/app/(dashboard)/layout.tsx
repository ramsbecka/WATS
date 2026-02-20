'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase, hasValidSupabase } from '@/lib/supabase';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden
        />
        <p className="mt-3 text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  );
}

function NoSupabaseScreen() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="font-medium text-amber-900">Supabase is not connected</p>
        <p className="mt-2 text-sm text-amber-800">
          Set <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
          <code className="rounded bg-amber-100 px-1">.env.local</code> then restart the dev server.
        </p>
        <button
          type="button"
          onClick={() => router.replace('/login')}
          className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [roleCheck, setRoleCheck] = useState<'loading' | 'admin' | 'denied'>('loading');

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      // Subiri kidogo kwa session kuja (baada ya login redirect) kabla ya kurudisha /login
      const t = window.setTimeout(() => router.replace('/login'), 400);
      return () => clearTimeout(t);
    }
    if (!hasValidSupabase) {
      setRoleCheck('denied');
      return;
    }
    void (async () => {
      try {
        const { data } = await supabase
          .from('admin_profile')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();
        setRoleCheck(data?.id ? 'admin' : 'denied');
      } catch {
        setRoleCheck('denied');
      }
    })();
  }, [session, authLoading, router]);

  useEffect(() => {
    if (roleCheck === 'denied' && hasValidSupabase) {
      signOut().then(() => router.replace('/login?reason=not_admin'));
    }
  }, [roleCheck, signOut, router]);

  if (authLoading || !session) return <LoadingScreen />;
  if (!hasValidSupabase) return <NoSupabaseScreen />;
  if (roleCheck === 'loading' || roleCheck === 'denied') return <LoadingScreen />;

  return <Layout>{children}</Layout>;
}
