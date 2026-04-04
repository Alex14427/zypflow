import { captureMessage } from '@/lib/monitoring';

/**
 * Fire a webhook with retry logic.
 * Retries up to 2 times with exponential backoff (1s, 3s).
 * Logs errors locally for review.
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

      if (res.ok) {
        return true;
      }

      console.error(`Webhook ${label} returned ${res.status} (attempt ${attempt + 1})`);
    } catch (err) {
      console.error(`Webhook ${label} failed (attempt ${attempt + 1}):`, err);
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1500));
    }
  }

  captureMessage(`Webhook failed after ${maxRetries + 1} attempts: ${label}`, {
    url,
    payload,
    label,
  });

  return false;
}
