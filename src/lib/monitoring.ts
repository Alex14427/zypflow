/**
 * Lightweight error monitoring.
 * Uses Sentry when SENTRY_DSN is set, otherwise logs to console + Supabase activity_log.
 * This is the free-tier replacement — no external service required.
 */

type MonitoringMeta = {
  context?: string;
  tags?: Record<string, string | number | boolean | null | undefined>;
  extra?: Record<string, unknown>;
  level?: 'info' | 'warning' | 'error';
};

function normalizeMeta(input?: string | MonitoringMeta): MonitoringMeta | undefined {
  if (!input) return undefined;
  if (typeof input === 'string') return { context: input };
  return input;
}

async function logToSupabase(type: 'exception' | 'message', message: string, meta?: MonitoringMeta) {
  try {
    // Dynamic import to avoid circular deps and keep this lightweight
    const { supabaseAdmin } = await import('@/lib/supabase');
    await supabaseAdmin.from('activity_log').insert({
      action: `error_${type}`,
      metadata: {
        message,
        context: meta?.context,
        tags: meta?.tags,
        extra: meta?.extra,
        level: meta?.level || 'error',
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Never let monitoring crash the app
  }
}

export function captureException(error: unknown, input?: string | MonitoringMeta) {
  const meta = normalizeMeta(input);

  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error('[monitoring] exception', {
    context: meta?.context || 'unknown',
    error: errorMessage,
    tags: meta?.tags || {},
  });

  // Log to Supabase for free error tracking
  logToSupabase('exception', errorMessage, meta);
}

export function captureMessage(message: string, input?: Record<string, unknown> | MonitoringMeta) {
  const meta =
    input && 'extra' in input
      ? (input as MonitoringMeta)
      : input
        ? { extra: input as Record<string, unknown> }
        : undefined;

  console.error('[monitoring]', message, {
    context: meta?.context || 'unknown',
    tags: meta?.tags || {},
  });

  logToSupabase('message', message, meta);
}
