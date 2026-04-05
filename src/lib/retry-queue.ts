import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

// ---------------------------------------------------------------------------
// Retry / Dead-Letter Queue
// Lightweight retry system built on the existing `scheduled_actions` table.
//
// NOTE: The scheduled_actions CHECK constraint may need updating to allow
// 'dead_letter' and 'completed' statuses. Run:
//   ALTER TABLE scheduled_actions DROP CONSTRAINT scheduled_actions_status_check;
//   ALTER TABLE scheduled_actions ADD CONSTRAINT scheduled_actions_status_check
//     CHECK (status IN ('pending','executed','completed','failed','cancelled','dead_letter'));
// ---------------------------------------------------------------------------

interface EnqueueRetryParams {
  orgId: string;
  actionType: string;
  actionData: Record<string, unknown>;
  maxRetries?: number;
  backoffMinutes?: number;
  leadId?: string;
  templateId?: string;
}

/**
 * Enqueue an action for retry (or move to dead-letter if max retries exceeded).
 */
export async function enqueueRetry(params: EnqueueRetryParams): Promise<void> {
  const {
    orgId,
    actionType,
    actionData,
    maxRetries = 3,
    backoffMinutes = 5,
    leadId,
    templateId,
  } = params;

  const retryCount = (actionData.retry_count as number) ?? 0;

  // If we've exhausted retries, dead-letter it
  if (retryCount >= maxRetries) {
    const { error } = await supabaseAdmin.from('scheduled_actions').insert({
      org_id: orgId,
      action_type: actionType,
      action_data: { ...actionData, retry_count: retryCount, dead_letter: true },
      status: 'dead_letter',
      scheduled_for: new Date().toISOString(),
      ...(leadId ? { lead_id: leadId } : {}),
      ...(templateId ? { template_id: templateId } : {}),
    });
    if (error) {
      console.error('[retry-queue] Failed to dead-letter action:', error.message);
    }
    return;
  }

  // Schedule with exponential-ish backoff: retryCount * backoffMinutes
  const delayMs = (retryCount + 1) * backoffMinutes * 60 * 1000;
  const scheduledFor = new Date(Date.now() + delayMs);

  const { error } = await supabaseAdmin.from('scheduled_actions').insert({
    org_id: orgId,
    action_type: actionType,
    action_data: { ...actionData, retry_count: retryCount },
    status: 'pending',
    scheduled_for: scheduledFor.toISOString(),
    ...(leadId ? { lead_id: leadId } : {}),
    ...(templateId ? { template_id: templateId } : {}),
  });

  if (error) {
    console.error('[retry-queue] Failed to enqueue retry:', error.message);
  }
}

/**
 * Execute a single action based on its type and data.
 * Throws on failure so the caller can handle retries.
 */
async function executeAction(
  actionType: string,
  actionData: Record<string, unknown>,
): Promise<void> {
  switch (actionType) {
    case 'send_email': {
      await sendEmail({
        to: actionData.to as string,
        subject: actionData.subject as string,
        html: actionData.html as string,
      });
      break;
    }

    case 'send_sms': {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionData),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => 'unknown');
        throw new Error(`SMS send failed (${res.status}): ${body}`);
      }
      break;
    }

    case 'webhook': {
      const url = actionData.url as string;
      const payload = actionData.payload ?? {};
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => 'unknown');
        throw new Error(`Webhook failed (${res.status}): ${body}`);
      }
      break;
    }

    default:
      throw new Error(`Unknown action_type: ${actionType}`);
  }
}

/**
 * Process pending retry queue items that are due.
 * Returns a summary of what happened.
 */
export async function processRetryQueue(): Promise<{
  processed: number;
  succeeded: number;
  deadLettered: number;
}> {
  const summary = { processed: 0, succeeded: 0, deadLettered: 0 };

  const { data: actions, error } = await supabaseAdmin
    .from('scheduled_actions')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(50);

  if (error) {
    console.error('[retry-queue] Failed to fetch pending actions:', error.message);
    return summary;
  }

  if (!actions || actions.length === 0) return summary;

  for (const action of actions) {
    summary.processed++;
    const actionData = (action.action_data ?? {}) as Record<string, unknown>;
    const retryCount = (actionData.retry_count as number) ?? 0;

    try {
      await executeAction(action.action_type, actionData);

      // Mark completed
      await supabaseAdmin
        .from('scheduled_actions')
        .update({ status: 'completed', executed_at: new Date().toISOString() })
        .eq('id', action.id);

      summary.succeeded++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(
        `[retry-queue] Action ${action.id} failed (attempt ${retryCount + 1}):`,
        errorMsg,
      );

      // Mark current row as failed
      await supabaseAdmin
        .from('scheduled_actions')
        .update({ status: 'failed', error: errorMsg })
        .eq('id', action.id);

      // Enqueue next retry (or dead-letter)
      const nextRetryCount = retryCount + 1;
      await enqueueRetry({
        orgId: action.org_id,
        actionType: action.action_type,
        actionData: { ...actionData, retry_count: nextRetryCount },
        leadId: action.lead_id ?? undefined,
        templateId: action.template_id ?? undefined,
      });

      if (nextRetryCount >= 3) {
        summary.deadLettered++;
      }
    }
  }

  return summary;
}

/**
 * Retrieve dead-lettered actions for manual review.
 */
export async function getDeadLetters(
  orgId?: string,
): Promise<
  Array<{
    id: string;
    action_type: string;
    action_data: unknown;
    created_at: string;
  }>
> {
  let query = supabaseAdmin
    .from('scheduled_actions')
    .select('id, action_type, action_data, created_at')
    .eq('status', 'dead_letter')
    .order('created_at', { ascending: false });

  if (orgId) {
    query = query.eq('org_id', orgId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[retry-queue] Failed to fetch dead letters:', error.message);
    return [];
  }

  return (data ?? []) as Array<{
    id: string;
    action_type: string;
    action_data: unknown;
    created_at: string;
  }>;
}
