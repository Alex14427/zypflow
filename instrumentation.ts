import { validateEnv } from '@/lib/env';

export async function register() {
  const shouldStrictlyValidateEnv =
    process.env.NODE_ENV === 'production' &&
    process.env.ZYPFLOW_LOCAL_MODE !== '1' &&
    process.env.CI !== 'true';

  if (shouldStrictlyValidateEnv) {
    validateEnv({ strict: true });
  }

  const sentryDsn = process.env.SENTRY_DSN;
  if (!sentryDsn) {
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: sentryDsn,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0,
      environment: process.env.NODE_ENV,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: sentryDsn,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0,
      environment: process.env.NODE_ENV,
    });
  }
}
