import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { getApiUser } from '@/lib/api-auth';
import { sendEmail } from '@/lib/email';
import { executeWorkflow } from '@/lib/automation-engine';

// ---------------------------------------------------------------------------
// GET — Process pending scheduled actions (called by cron / Make.com)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  return processScheduledActions();
}

async function processScheduledActions() {
  const now = new Date().toISOString();

  // Fetch all pending actions whose scheduled_for time has passed
  const { data: pendingActions, error: fetchError } = await supabaseAdmin
    .from('scheduled_actions')
    .select('id, org_id, lead_id, action_type, action_data, scheduled_for')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(100);

  if (fetchError) {
    console.error('[automations/execute] Failed to fetch scheduled_actions:', fetchError);
    return NextResponse.json(
      { error: 'Failed to query scheduled actions', details: fetchError.message },
      { status: 500 }
    );
  }

  if (!pendingActions || pendingActions.length === 0) {
    return NextResponse.json({ processed: 0, succeeded: 0, failed: 0 });
  }

  let succeeded = 0;
  let failed = 0;

  for (const action of pendingActions) {
    const actionId = action.id as string;
    const actionType = action.action_type as string;
    const actionData = (action.action_data ?? {}) as Record<string, string>;

    try {
      // Execute based on action_type
      if (actionType === 'send_email') {
        const { to, subject, html } = actionData;

        if (!to || !subject || !html) {
          throw new Error(
            `Missing required email fields — to: "${to}", subject: "${subject}", html provided: ${Boolean(html)}`
          );
        }

        await sendEmail({ to, subject, html });
      } else if (actionType === 'send_sms') {
        const { to, body } = actionData;

        if (!to || !body) {
          throw new Error(`Missing required SMS fields — to: "${to}", body provided: ${Boolean(body)}`);
        }

        // Lazy-load Twilio only when needed so missing env vars don't break other action types
        const twilio = (await import('twilio')).default;
        const smsClient = twilio(
          process.env.TWILIO_ACCOUNT_SID || '',
          process.env.TWILIO_AUTH_TOKEN || ''
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
      console.error(`[automations/execute] Action ${actionId} (${actionType}) failed:`, err);

      // Mark as failed with error details
      await supabaseAdmin
        .from('scheduled_actions')
        .update({
          status: 'failed',
          executed_at: new Date().toISOString(),
          error: errorMessage,
        })
        .eq('id', actionId);

      failed++;
    }
  }

  console.log(
    `[automations/execute] Processed ${pendingActions.length} scheduled actions — succeeded: ${succeeded}, failed: ${failed}`
  );

  return NextResponse.json({
    processed: pendingActions.length,
    succeeded,
    failed,
  });
}

// ---------------------------------------------------------------------------
// POST — Manually trigger a workflow
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // Accept automation auth (cron / Make.com) OR a logged-in dashboard user
  const automationAuthError = verifyAutomationAuth(req);
  if (automationAuthError) {
    // Not an automation caller — check for a dashboard session instead
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
      { status: 400 }
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
      `[automations/execute] Manual trigger — template: ${templateId}, org: ${orgId}, lead: ${leadId ?? 'none'}`
    );

    return NextResponse.json(result);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(
      `[automations/execute] executeWorkflow failed for template ${templateId} (org: ${orgId}):`,
      err
    );
    return NextResponse.json(
      { error: 'Workflow execution failed', details: errorMessage },
      { status: 500 }
    );
  }
}
