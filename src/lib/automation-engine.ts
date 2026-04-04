import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StepResult {
  action: string;
  success: boolean;
  message: string;
  error?: string;
}

export interface WorkflowResult {
  success: boolean;
  stepsExecuted: number;
  stepsFailed: number;
  results: StepResult[];
  durationMs: number;
}

interface VariableContext {
  lead_name: string;
  lead_email: string;
  lead_phone: string;
  lead_score: string;
  org_name: string;
  org_email: string;
  org_phone: string;
  booking_url: string;
  google_review_link: string;
  service_interest: string;
  appointment_date: string;
  appointment_time: string;
  report_date?: string;
  generated_report?: string;
  [key: string]: string | undefined;
}

// A generic action step parsed from actions_json
type ActionStep = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Variable replacement
// ---------------------------------------------------------------------------

function replaceVariables(text: string, ctx: VariableContext): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return ctx[key] ?? `{{${key}}}`;
  });
}

/**
 * Recursively replace {{variables}} in all string values of an object.
 */
function applyContext(action: ActionStep, ctx: VariableContext): ActionStep {
  const result: ActionStep = {};
  for (const [k, v] of Object.entries(action)) {
    if (typeof v === 'string') {
      result[k] = replaceVariables(v, ctx);
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = applyContext(v as ActionStep, ctx);
    } else {
      result[k] = v;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Individual action handlers
// ---------------------------------------------------------------------------

async function handleDelay(action: ActionStep): Promise<StepResult> {
  const minutes = Number(action.minutes ?? 0);
  return {
    action: 'delay',
    success: true,
    message: `Delay of ${minutes} minute(s) noted — handled by scheduler, skipping inline.`,
  };
}

async function handleSendEmail(
  action: ActionStep,
  defaultTo: string
): Promise<StepResult> {
  const to = (action.to as string | undefined) || defaultTo;
  const subject = (action.subject as string | undefined) ?? '(no subject)';
  const body = (action.body as string | undefined) ?? '';

  if (!to) {
    return {
      action: 'send_email',
      success: false,
      message: 'No recipient address — lead has no email and action has no "to" field.',
    };
  }

  const html = body.replace(/\n/g, '<br>');
  const { error } = await sendEmail({ to, subject, html });

  if (error) {
    return {
      action: 'send_email',
      success: false,
      message: `Failed to send email to ${to}`,
      error: String(error),
    };
  }

  return {
    action: 'send_email',
    success: true,
    message: `Email sent to ${to} — "${subject}"`,
  };
}

async function handleSendSms(
  action: ActionStep,
  defaultTo: string
): Promise<StepResult> {
  const to = (action.to as string | undefined) || defaultTo;
  const body = (action.body as string | undefined) ?? '';

  if (!to) {
    return {
      action: 'send_sms',
      success: false,
      message: 'No phone number — lead has no phone and action has no "to" field.',
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const secret = process.env.AUTOMATION_SECRET ?? '';

  const resp = await fetch(`${appUrl}/api/sms/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-automation-secret': secret,
    },
    body: JSON.stringify({ to, body }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    return {
      action: 'send_sms',
      success: false,
      message: `SMS send failed (HTTP ${resp.status})`,
      error: errText,
    };
  }

  return {
    action: 'send_sms',
    success: true,
    message: `SMS dispatched to ${to}`,
  };
}

async function handleScheduleReminder(
  action: ActionStep,
  orgId: string,
  leadId: string | undefined,
  appointmentId: string | undefined,
  templateId: string
): Promise<StepResult> {
  const beforeMinutes = Number(action.before_minutes ?? 0);
  const channel = (action.channel as string | undefined) ?? 'email';
  const body = (action.body as string | undefined) ?? '';
  const subject = (action.subject as string | undefined) ?? undefined;

  // scheduled_for is computed relative to the appointment time; for now we
  // record the offset and let the scheduler resolve the absolute timestamp.
  // We store a placeholder timestamp of now() + before_minutes so the row is
  // queryable and the scheduler can compute the correct time against the
  // appointment.
  const scheduledFor = new Date(Date.now() + beforeMinutes * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin.from('scheduled_actions').insert({
    org_id: orgId,
    lead_id: leadId ?? null,
    appointment_id: appointmentId ?? null,
    template_id: templateId,
    action_type: `send_${channel}`,
    action_data: { channel, subject, body, before_minutes: beforeMinutes },
    scheduled_for: scheduledFor,
    status: 'pending',
  });

  if (error) {
    return {
      action: 'schedule_reminder',
      success: false,
      message: `Failed to schedule ${channel} reminder`,
      error: error.message,
    };
  }

  return {
    action: 'schedule_reminder',
    success: true,
    message: `${channel} reminder scheduled (${beforeMinutes} min before appointment)`,
  };
}

async function handleUpdateLead(
  action: ActionStep,
  leadId: string | undefined
): Promise<StepResult> {
  if (!leadId) {
    return {
      action: 'update_lead',
      success: false,
      message: 'No leadId provided — cannot update lead status.',
    };
  }

  const status = (action.status as string | undefined) ?? 'contacted';
  const { error } = await supabaseAdmin
    .from('leads')
    .update({ status })
    .eq('id', leadId);

  if (error) {
    return {
      action: 'update_lead',
      success: false,
      message: `Failed to update lead status to "${status}"`,
      error: error.message,
    };
  }

  return {
    action: 'update_lead',
    success: true,
    message: `Lead status updated to "${status}"`,
  };
}

/**
 * Returns { passed: boolean } — if false the caller should stop the workflow.
 */
function handleCondition(
  action: ActionStep,
  ctx: VariableContext
): { passed: boolean; result: StepResult } {
  const field = (action.field as string | undefined) ?? '';
  const operator = (action.operator as string | undefined) ?? 'eq';
  const expected = action.value;

  const rawActual = ctx[field];
  const actual = rawActual !== undefined ? rawActual : undefined;

  // Coerce to numbers for numeric operators
  const numOperators = ['gt', 'gte', 'lt', 'lte'];
  let passed: boolean;

  if (numOperators.includes(operator)) {
    const numActual = Number(actual);
    const numExpected = Number(expected);
    if (operator === 'gt') passed = numActual > numExpected;
    else if (operator === 'gte') passed = numActual >= numExpected;
    else if (operator === 'lt') passed = numActual < numExpected;
    else passed = numActual <= numExpected; // lte
  } else if (operator === 'eq') {
    passed = String(actual) === String(expected);
  } else if (operator === 'neq') {
    passed = String(actual) !== String(expected);
  } else {
    passed = false;
  }

  if (passed) {
    return {
      passed: true,
      result: {
        action: 'condition',
        success: true,
        message: `Condition passed: ${field} ${operator} ${expected} (actual: ${actual})`,
      },
    };
  }

  return {
    passed: false,
    result: {
      action: 'condition',
      success: false,
      message: `Condition failed: ${field} ${operator} ${expected} (actual: ${actual}) — stopping workflow.`,
    },
  };
}

async function handleGenerateReport(
  action: ActionStep,
  orgId: string,
  ctx: VariableContext
): Promise<{ result: StepResult; reportText: string }> {
  const metrics = (action.metrics as string[] | undefined) ?? [];
  const period = (action.period as string | undefined) ?? '7d';
  const days = parseInt(period.replace('d', ''), 10) || 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const reportLines: string[] = [
    `Weekly Performance Report — ${ctx.org_name}`,
    `Period: Last ${days} days`,
    '',
  ];

  try {
    if (metrics.includes('new_leads')) {
      const { count } = await supabaseAdmin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', since);
      reportLines.push(`New Leads: ${count ?? 0}`);
    }

    if (metrics.includes('total_conversations')) {
      const { count } = await supabaseAdmin
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', since);
      reportLines.push(`Total Conversations: ${count ?? 0}`);
    }

    if (metrics.includes('appointments_booked')) {
      const { count } = await supabaseAdmin
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', since);
      reportLines.push(`Appointments Booked: ${count ?? 0}`);
    }

    if (metrics.includes('reviews_received')) {
      const { count } = await supabaseAdmin
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', since);
      reportLines.push(`Reviews Received: ${count ?? 0}`);
    }

    if (metrics.includes('conversion_rate')) {
      const { count: leads } = await supabaseAdmin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', since);
      const { count: appts } = await supabaseAdmin
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', since);
      const rate =
        leads && leads > 0 ? Math.round(((appts ?? 0) / leads) * 100) : 0;
      reportLines.push(`Lead → Booking Conversion Rate: ${rate}%`);
    }
  } catch (err) {
    console.error('[automation-engine] generate_report query error:', err);
    reportLines.push('(Some metrics could not be retrieved)');
  }

  const reportText = reportLines.join('\n');

  return {
    reportText,
    result: {
      action: 'generate_report',
      success: true,
      message: `Report generated for last ${days} days (${metrics.length} metric(s))`,
    },
  };
}

async function handleQueryAppointments(
  action: ActionStep,
  orgId: string
): Promise<{ result: StepResult; appointments: unknown[] }> {
  const filter = (action.filter as string | undefined) ?? 'completed';
  const olderThanDays = Number(action.older_than_days ?? 0);
  const since = olderThanDays
    ? new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  let query = supabaseAdmin
    .from('appointments')
    .select('id, lead_id, service, datetime, status, org_id')
    .eq('org_id', orgId)
    .eq('status', filter);

  if (since) {
    query = query.lte('datetime', since);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    return {
      appointments: [],
      result: {
        action: 'query_appointments',
        success: false,
        message: 'Failed to query appointments',
        error: error.message,
      },
    };
  }

  return {
    appointments: data ?? [],
    result: {
      action: 'query_appointments',
      success: true,
      message: `Found ${data?.length ?? 0} ${filter} appointment(s)${olderThanDays ? ` older than ${olderThanDays} days` : ''}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Context builder helpers
// ---------------------------------------------------------------------------

function buildContext(params: {
  org: Record<string, unknown>;
  lead?: Record<string, unknown> | null;
  appointment?: Record<string, unknown> | null;
  extra?: Record<string, string>;
}): VariableContext {
  const { org, lead, appointment, extra } = params;

  // Service interest: from lead tags or notes, falling back to generic
  let serviceInterest = 'our services';
  if (lead) {
    if (typeof lead.service_interest === 'string' && lead.service_interest) {
      serviceInterest = lead.service_interest;
    } else if (Array.isArray(lead.tags) && lead.tags.length > 0) {
      serviceInterest = (lead.tags as string[]).join(', ');
    }
  }

  let appointmentDate = '';
  let appointmentTime = '';
  if (appointment && appointment.datetime) {
    const dt = new Date(appointment.datetime as string);
    appointmentDate = dt.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    appointmentTime = dt.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return {
    lead_name: (lead?.name as string | undefined) || (lead?.email as string | undefined) || 'there',
    lead_email: (lead?.email as string | undefined) ?? '',
    lead_phone: (lead?.phone as string | undefined) ?? '',
    lead_score: String(lead?.lead_score ?? lead?.score ?? 0),
    org_name: (org.name as string | undefined) ?? '',
    org_email: (org.email as string | undefined) ?? '',
    org_phone: (org.phone as string | undefined) ?? '',
    booking_url: (org.booking_url as string | undefined) ?? '',
    google_review_link: (org.google_review_link as string | undefined) ?? '',
    service_interest: serviceInterest,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    report_date: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

export async function executeWorkflow(params: {
  templateId: string;
  orgId: string;
  leadId?: string;
  appointmentId?: string;
  context?: Record<string, string>;
}): Promise<WorkflowResult> {
  const { templateId, orgId, leadId, appointmentId, context: extraContext = {} } = params;
  const startMs = Date.now();
  const stepResults: StepResult[] = [];

  // ---- 1. Fetch template ----
  const { data: template, error: templateErr } = await supabaseAdmin
    .from('workflow_templates')
    .select('id, name, actions_json')
    .eq('id', templateId)
    .single();

  if (templateErr || !template) {
    return {
      success: false,
      stepsExecuted: 0,
      stepsFailed: 0,
      results: [
        {
          action: 'init',
          success: false,
          message: `Template "${templateId}" not found`,
          error: templateErr?.message,
        },
      ],
      durationMs: Date.now() - startMs,
    };
  }

  // ---- 2. Fetch org ----
  const { data: org, error: orgErr } = await supabaseAdmin
    .from('businesses')
    .select('id, name, email, phone, booking_url, google_review_link')
    .eq('id', orgId)
    .single();

  if (orgErr || !org) {
    return {
      success: false,
      stepsExecuted: 0,
      stepsFailed: 0,
      results: [
        {
          action: 'init',
          success: false,
          message: `Organisation "${orgId}" not found`,
          error: orgErr?.message,
        },
      ],
      durationMs: Date.now() - startMs,
    };
  }

  // ---- 3. Fetch lead (optional) ----
  let lead: Record<string, unknown> | null = null;
  if (leadId) {
    const { data } = await supabaseAdmin
      .from('leads')
      .select('id, name, email, phone, lead_score, score, status, service_interest, tags')
      .eq('id', leadId)
      .eq('org_id', orgId)
      .single();
    lead = data ?? null;
  }

  // ---- 4. Fetch appointment (optional) ----
  let appointment: Record<string, unknown> | null = null;
  if (appointmentId) {
    const { data } = await supabaseAdmin
      .from('appointments')
      .select('id, datetime, service, status, lead_id')
      .eq('id', appointmentId)
      .eq('org_id', orgId)
      .single();
    appointment = data ?? null;
  }

  // ---- 5. Build variable context ----
  let ctx: VariableContext = buildContext({
    org: org as Record<string, unknown>,
    lead,
    appointment,
    extra: extraContext,
  });

  // ---- 6. Execute actions ----
  const actions: ActionStep[] = Array.isArray(template.actions_json)
    ? (template.actions_json as ActionStep[])
    : [];

  let stepsExecuted = 0;
  let stepsFailed = 0;

  // eslint-disable-next-line no-labels
  outer: for (const rawAction of actions) {
    const action = applyContext(rawAction, ctx);
    const type = action.type as string;
    stepsExecuted++;

    try {
      let stepResult: StepResult | undefined;

      switch (type) {
        case 'delay': {
          stepResult = await handleDelay(action);
          break;
        }

        case 'send_email': {
          stepResult = await handleSendEmail(action, ctx.lead_email);
          break;
        }

        case 'send_sms': {
          stepResult = await handleSendSms(action, ctx.lead_phone);
          break;
        }

        case 'schedule_reminder': {
          stepResult = await handleScheduleReminder(
            action,
            orgId,
            leadId,
            appointmentId,
            templateId
          );
          break;
        }

        case 'update_lead': {
          stepResult = await handleUpdateLead(action, leadId);
          break;
        }

        case 'condition': {
          const { passed, result } = handleCondition(action, ctx);
          stepResults.push(result);
          if (!passed) {
            stepsFailed++;
            // Condition failed — halt the workflow loop entirely
          }
          // Whether passed or failed, the result is already pushed above.
          // Use a goto-style label-break to skip the post-switch push and
          // exit the for-loop when the condition did not pass.
          if (!passed) {
            // eslint-disable-next-line no-labels
            break outer;
          }
          continue; // condition passed, move on to next action
        }

        case 'generate_report': {
          const { result, reportText } = await handleGenerateReport(action, orgId, ctx);
          // Make the generated report available as a variable for subsequent steps
          ctx = { ...ctx, generated_report: reportText };
          stepResult = result;
          break;
        }

        case 'query_appointments': {
          const { result } = await handleQueryAppointments(action, orgId);
          stepResult = result;
          break;
        }

        default: {
          stepResult = {
            action: type ?? 'unknown',
            success: false,
            message: `Unknown action type: "${type}" — skipped.`,
          };
          break;
        }
      }

      stepResults.push(stepResult);
      if (!stepResult.success) {
        stepsFailed++;
      }

      // Stop workflow if a condition failed (added to results above via continue path)
      if (type === 'condition') {
        // We already pushed and incremented inside the case above
        break;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[automation-engine] Error in action "${type}":`, err);
      stepResults.push({
        action: type ?? 'unknown',
        success: false,
        message: `Unexpected error executing "${type}"`,
        error: errorMsg,
      });
      stepsFailed++;
      // Non-fatal — continue with remaining steps
    }
  }

  const durationMs = Date.now() - startMs;
  const overallSuccess = stepsFailed === 0;

  // ---- 7. Log to activity_log ----
  try {
    await supabaseAdmin.from('activity_log').insert({
      org_id: orgId,
      user_id: null,
      action: 'workflow_executed',
      description: `Workflow "${template.name}" executed: ${stepsExecuted - stepsFailed}/${stepsExecuted} steps succeeded`,
      target_type: 'workflow_template',
      target_id: templateId,
      metadata: {
        steps_executed: stepsExecuted,
        steps_succeeded: stepsExecuted - stepsFailed,
        steps_failed: stepsFailed,
        duration_ms: durationMs,
        lead_id: leadId ?? null,
        appointment_id: appointmentId ?? null,
      },
    });
  } catch (logErr) {
    // Never let logging failure break the caller
    console.error('[automation-engine] Failed to write activity_log:', logErr);
  }

  // ---- 8. Return result ----
  return {
    success: overallSuccess,
    stepsExecuted,
    stepsFailed,
    results: stepResults,
    durationMs,
  };
}
