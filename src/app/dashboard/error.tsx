'use client';

import { useEffect } from 'react';
import { captureException } from '@/lib/monitoring';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, 'dashboard-error');
  }, [error]);

  return (
    <div className="flex items-center justify-center py-24">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple/10">
          <svg className="h-7 w-7 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[var(--app-text)]">Something went wrong</h2>
        <p className="mt-2 text-sm text-[var(--app-text-muted)]">
          This error has been reported. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-brand-purple px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-purple-dark"
        >
          Try again
        </button>
        {error.digest && (
          <p className="mt-4 text-xs text-[var(--app-text-soft)]">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
