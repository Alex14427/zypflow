'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-4xl font-bold text-brand-purple mb-2">Oops</p>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-6">
          This error has been reported. Please try again.
        </p>
        <button
          onClick={reset}
          className="bg-brand-purple text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-brand-purple-dark transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
