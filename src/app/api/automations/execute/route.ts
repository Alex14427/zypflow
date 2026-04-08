import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { getApiUser } from '@/lib/api-auth';
import { sendEmail } from '@/lib/email';
import { executeWorkflow } from '@/lib/automation-engine';

const MAX_RETRIES = 3;

/** Exponential backoff: 2min, 8min, 32min */
function getRetryDelay(retryCount: number): number {
  return Math.pow(4, retryCount) * 2 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// GET — Process pending + retrying scheduled actions (called by cron)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  return processScheduledActions();
}

async function processScheduledActions() {
  const now = new Date().toISOString();

  // Fetch pending actions AND retrying actions whose retry time has passed
  const { data: pendingActions, error: fetchError } = await supabaseAdmin
    .from('scheduled_actions')
    .select('id, org_id, lead_id, action_type, action_data, scheduled_for, retry_count, max_retries, status')
    .or(`and(status.eq.pending,scheduled_for.lte.${now}),and(status.eq.retrying,next_retry_at.lte.${now})`)
    .order('scheduled_for', { ascending: true })
    .limit(100);

  if (fetchError) {
    console.error('[automations/execute] Failed to fetch scheduled_actions:', fetchError);
    return NextResponse.json(
      { error: 'Failed to query scheduled actions', details: fetchError.message },
      { status: 500 },
    );
  }

  if (!pendingActions || pendingActions.length === 0) {
    return NextResponse.json({ processed: 0, succeeded: 0, failed: 0, retrying: 0, dead_letter: 0 });
  }

  let succeeded = 0;
  let failed = 0;
  let retrying = 0;
  let deadLetter = 0;

  for (const action of pendingActions) {
    const actionId = action.id as string;
    const orgId = action.org_id as string;
    const actionType = action.action_type as string;
    const actionData = (action.action_data ?? {}) as Record<string, string>;
    const currentRetryCount = (action.retry_count as number) ?? 0;
    const maxRetries = (action.max_retries as number) ?? MAX_RETRIES;

    try {
      if (actionType === 'send_email') {
        const { to, subject, html } = actionData;
        if (!to || !subject || !html) {
          throw new Error(
            `Missing required email fields — to: "${to}", subject: "${subject}", html provided: ${Boolean(html)}`,
          );
        }
        await sendEmail({ to, subject, html });
      } else if (actionType === 'send_sms') {
        const { to, body } = actionData;
        if (!to || !body) {
          throw new Error(`Missing required SMS fields — to: "${to}", body provided: ${Boolean(body)}`);
        }
        const twilio = (await import('twilio')).default;
        const smsClient = twilio(
          process.env.TWILIO_ACCOUNT_SID || '',
          process.env.TWILIO_AUTH_TOKEN || '',
        );
        await smsClient.messages.create({
          body,
          from: process.env.TWILIO_PHONE_NUMBER || '',
          to,
        });
      } else {
        throw new Error(`Unknown action_type: "${actionType}"`);
      }

      // Mark as executed
      await supabaseAdmin
        .from('scheduled_actions')
        .update({
          status: 'executed',
          executed_at: new Date().toISOString(),
        })
        .eq('id', actionId);

      succeeded++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[automations/execute] Action ${actionId} (${actionType}) failed (attempt ${currentRetryCount + 1}):`, err);

      // Log to dead-letter audit (non-critical — don't fail the loop)
      try {
        await supabaseAdmin.from('automation_dead_letter').insert({
          action_id: actionId,
          org_id: orgId,
          attempt_number: currentRetryCount + 1,
          error_message: errorMessage,
          error_context: { action_type: actionType, action_data: actionData },
        });
      } catch {
        // Audit logging is best-effort
      }

      if (currentRetryCount + 1 < maxRetries) {
        // Schedule retry with exponential backoff
        const delay = getRetryDelay(currentRetryCount + 1);
        const nextRetryAt = new Date(Date.now() + delay).toISOString();

        await supabaseAdmin
          .from('scheduled_actions')
          .update({
            status: 'retrying',
            retry_count: currentRetryCount + 1,
            next_retry_at: nextRetryAt,
            error: errorMessage,
          })
          .eq('id', actionId);

        retrying++;
        console.log(
          `[automations/execute] Action ${actionId} scheduled for retry ${currentRetryCount + 2}/${maxRetries} at ${nextRetryAt}`,
        );
      } else {
        // Max retries exhausted — move to dead letter
        await supabaseAdmin
          .from('scheduled_actions')
          .update({
            status: 'dead_letter',
            executed_at: new Date().toISOString(),
            retry_count: currentRetryCount + 1,
            error: `Exhausted ${maxRetries} retries. Last error: ${errorMessage}`,
          })
          .eq('id', actionId);

        deadLetter++;
        failed++;
        console.error(
          `[automations/execute] Action ${actionId} moved to dead letter after ${maxRetries} attempts`,
        );
      }
    }
  }

  console.log(
    `[automations/execute] Processed ${pendingActions.length} — succeeded: ${succeeded}, retrying: ${retrying}, dead_letter: ${deadLetter}`,
  );

  return NextResponse.json({
    processed: pendingActions.length,
    succeeded,
    failed,
    retrying,
    dead_letter: deadLetter,
  });
}

// ---------------------------------------------------------------------------
// POST — Manually trigger a workflow
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const automationAuthError = verifyAutomationAuth(req);
  if (automationAuthError) {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: {
    templateId?: string;
    orgId?: string;
    leadId?: string;
    appointmentId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { templateId, orgId, leadId, appointmentId } = body;

  if (!templateId || !orgId) {
    return NextResponse.json(
      { error: 'templateId and orgId are required' },
      { status: 400 },
    );
  }

  try {
    const result = await executeWorkflow({
      templateId,
      orgId,
      leadId,
      appointmentId,
    });

    console.log(
      `[automations/execute] Manual trigger — template: ${templateId}, org: ${orgId}, lead: ${leadId ?? 'none'}`,
    );

    return NextResponse.json(result);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(
      `[automations/execute] executeWorkflow failed for template ${templateId} (org: ${orgId}):`,
      err,
    );
    return NextResponse.json(
      { error: 'Workflow execution failed', details: errorMessage },
      { status: 500 },
    );
  }
}
