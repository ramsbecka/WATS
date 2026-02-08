import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <p className="text-6xl font-bold text-slate-200">404</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you are looking for does not exist or was moved.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        <Home className="h-4 w-4" /> Back to Dashboard
      </Link>
    </div>
  );
}
