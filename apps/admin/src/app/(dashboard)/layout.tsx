'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Layout from '@/components/Layout';

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace('/login');
  }, [session, loading, router]);

  if (loading) return <LoadingScreen />;
  if (!session) return <LoadingScreen />;

  return <Layout>{children}</Layout>;
}
