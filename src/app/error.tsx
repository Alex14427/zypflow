'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry if available
    if (typeof window !== 'undefined' && 'Sentry' in window) {
      (window as Record<string, unknown>).Sentry;
    }
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple/10">
          <svg className="h-8 w-8 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-[var(--app-text)]">Something went wrong</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">
          An unexpected error occurred. Our team has been notified.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="button-primary px-6 py-3"
          >
            Try again
          </button>
          <a href="/" className="button-secondary px-6 py-3">
            Go home
          </a>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-[var(--app-text-soft)]">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
