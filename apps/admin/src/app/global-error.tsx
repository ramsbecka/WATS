'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          .global-error-root { margin: 0; font-family: system-ui, sans-serif; background: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .global-error-box { text-align: center; padding: 2rem; max-width: 28rem; }
          .global-error-title { font-size: 1.25rem; font-weight: 600; color: #0f172a; margin-bottom: 0.5rem; }
          .global-error-text { font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem; }
          .global-error-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
          .global-error-btn { padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; border-radius: 0.5rem; cursor: pointer; }
          .global-error-btn-secondary { border: 1px solid #cbd5e1; background: #fff; color: #334155; }
          .global-error-btn-primary { background: #0078D4; color: #fff; text-decoration: none; border: none; }
        `}</style>
      </head>
      <body className="global-error-root">
        <div className="global-error-box">
          <h1 className="global-error-title">Something went wrong</h1>
          <p className="global-error-text">{error.message}</p>
          <div className="global-error-actions">
            <button
              type="button"
              onClick={() => reset()}
              className="global-error-btn global-error-btn-secondary"
            >
              Try again
            </button>
            <a href="/" className="global-error-btn global-error-btn-primary">
              Back to Dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
