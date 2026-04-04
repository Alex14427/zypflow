import * as Sentry from '@sentry/nextjs';

const sentryDsn = process.env.SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    environment: process.env.NODE_ENV,
    integrations: process.env.NODE_ENV === 'production' ? [Sentry.replayIntegration()] : [],
  });
}

export const onRouterTransitionStart = sentryDsn
  ? Sentry.captureRouterTransitionStart
  : () => undefined;
