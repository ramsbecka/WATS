'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      router.replace('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Check email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
            W
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">WATS</h1>
            <p className="text-sm text-slate-500">Admin dashboard</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
              placeholder="admin@example.com"
              required
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
              required
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>
          {error && (
            <div
              id="login-error"
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
