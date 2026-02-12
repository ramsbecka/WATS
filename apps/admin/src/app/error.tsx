'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="max-w-md text-center text-sm text-slate-600">{error.message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
