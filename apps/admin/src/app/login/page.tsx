'use client';

import { Suspense } from 'react';
import Login from '@/components/Login';

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <Login />
    </Suspense>
  );
}
