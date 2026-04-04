import * as Sentry from '@sentry/nextjs';

type MonitoringMeta = {
  context?: string;
  tags?: Record<string, string | number | boolean | null | undefined>;
  extra?: Record<string, unknown>;
  level?: 'info' | 'warning' | 'error';
};

function applyScope(meta?: MonitoringMeta) {
  if (!meta) return;

  if (meta.context) {
    Sentry.setContext('zypflow-context', { context: meta.context });
  }

  Object.entries(meta.tags || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    Sentry.setTag(key, String(value));
  });

  Object.entries(meta.extra || {}).forEach(([key, value]) => {
    Sentry.setExtra(key, value);
  });
}

function normalizeMeta(input?: string | MonitoringMeta): MonitoringMeta | undefined {
  if (!input) return undefined;
  if (typeof input === 'string') {
    return { context: input };
  }
  return input;
}

export function captureException(error: unknown, input?: string | MonitoringMeta) {
  const meta = normalizeMeta(input);

  try {
    Sentry.withScope(() => {
      applyScope(meta);
      Sentry.captureException(error);
    });
  } catch {
    // Monitoring should never crash the app.
  }

  console.error('[monitoring] exception captured', {
    context: meta?.context || 'unknown',
    tags: meta?.tags || {},
    extra: meta?.extra || {},
    error,
  });
}

export function captureMessage(message: string, input?: Record<string, unknown> | MonitoringMeta) {
  const meta =
    input && 'extra' in input
      ? (input as MonitoringMeta)
      : input
        ? { extra: input as Record<string, unknown> }
        : undefined;

  try {
    Sentry.withScope(() => {
      applyScope(meta);
      Sentry.captureMessage(
        message,
        meta?.level === 'warning' ? 'warning' : meta?.level === 'info' ? 'info' : 'error'
      );
    });
  } catch {
    // Monitoring should never crash the app.
  }

  console.error('[monitoring] message captured', {
    message,
    context: meta?.context || 'unknown',
    tags: meta?.tags || {},
    extra: meta?.extra || {},
  });
}
