'use client';

import { useEffect } from 'react';
import { captureException } from '@/lib/monitoring';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, 'global-error');
  }, [error]);

  return (
    <html>
      <body className="app-shell">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5 py-10 sm:px-8">
          <div className="surface-panel w-full rounded-[36px] p-8 text-center">
            <p className="page-eyebrow">Unexpected error</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--app-text)]">
              Something slipped off the rails.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--app-text-muted)]">
              The issue has been captured for review. Try again now, and if it keeps happening, check the founder portal diagnostics to see whether billing, messaging, or data services need attention.
            </p>
            <div className="mt-6 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] p-4 text-left text-sm text-[var(--app-text-muted)]">
              <p className="font-semibold text-[var(--app-text)]">Suggested next steps</p>
              <ul className="mt-2 space-y-2">
                <li>Retry the action or refresh the page.</li>
                <li>Check diagnostics if the issue affects a live automation flow.</li>
                <li>Escalate with details if the same action fails repeatedly.</li>
              </ul>
            </div>
            <button
              onClick={reset}
              className="mt-6 rounded-full bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-purple-dark"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
