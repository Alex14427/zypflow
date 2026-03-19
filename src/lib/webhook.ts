import * as Sentry from '@sentry/nextjs';

/**
 * Fire a webhook with retry logic.
 * Retries up to 2 times with exponential backoff (1s, 3s).
 * Logs errors to console and Sentry.
 */
export async function fireWebhook(
  url: string,
  payload: Record<string, unknown>,
  label: string
): Promise<boolean> {
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) return true;

      console.error(`Webhook ${label} returned ${res.status} (attempt ${attempt + 1})`);
    } catch (err) {
      console.error(`Webhook ${label} failed (attempt ${attempt + 1}):`, err);
    }

    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, (attempt + 1) * 1500));
    }
  }

  // All retries exhausted — report to Sentry
  Sentry.captureMessage(`Webhook failed after ${maxRetries + 1} attempts: ${label}`, {
    level: 'error',
    extra: { url, payload, label },
  });

  return false;
}
