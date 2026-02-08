import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">404</h1>
      <p className="text-slate-600">Page not found.</p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
