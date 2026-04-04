import { supabaseAdmin } from '@/lib/supabase';
import { executeWorkflow } from '@/lib/automation-engine';

type EventType =
  | 'new_lead'
  | 'appointment_created'
  | 'appointment_completed'
  | 'lead_score_update'
  | 'lead_inactive';

interface FireEventParams {
  eventType: EventType;
  orgId: string;
  leadId?: string;
  appointmentId?: string;
  context?: Record<string, string>;
}

interface TemplateResult {
  templateId: string;
  success: boolean;
  error?: string;
}

interface FireEventResult {
  triggered: number;
  succeeded: number;
  failed: number;
  results: TemplateResult[];
}

/**
 * Core event dispatcher. Finds all active deployed templates for the org
 * that match the given trigger_type, then executes each one via automation-engine.
 */
export async function fireEvent(params: FireEventParams): Promise<FireEventResult> {
  const { eventType, orgId, leadId, appointmentId, context } = params;

  // Query deployed_templates joined with workflow_templates to find matching triggers
  const { data: deployedTemplates, error } = await supabaseAdmin
    .from('deployed_templates')
    .select(`
      id,
      org_id,
      template_id,
      is_active,
      workflow_templates!inner (
        id,
        trigger_type
      )
    `)
    .eq('org_id', orgId)
    .eq('is_active', true)
    .eq('workflow_templates.trigger_type', eventType);

  if (error) {
    console.error(`[workflow-triggers] Error querying deployed_templates for event "${eventType}" (org: ${orgId}):`, error);
    return { triggered: 0, succeeded: 0, failed: 0, results: [] };
  }

  if (!deployedTemplates || deployedTemplates.length === 0) {
    return { triggered: 0, succeeded: 0, failed: 0, results: [] };
  }

  const results: TemplateResult[] = [];

  for (const deployed of deployedTemplates) {
    const templateId = deployed.template_id as string;

    try {
      await executeWorkflow({
        templateId,
        orgId,
        leadId,
        appointmentId,
        context,
      });

      results.push({ templateId, success: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[workflow-triggers] executeWorkflow failed for template ${templateId} (org: ${orgId}):`, err);
      results.push({ templateId, success: false, error: errorMessage });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    triggered: results.length,
    succeeded,
    failed,
    results,
  };
}

// ---------------------------------------------------------------------------
// Convenience helpers — one per supported event type
// ---------------------------------------------------------------------------

/**
 * Fire when a new lead is created.
 */
export async function onNewLead(orgId: string, leadId: string): Promise<void> {
  const result = await fireEvent({ eventType: 'new_lead', orgId, leadId });
  console.log(
    `[workflow-triggers] onNewLead — org: ${orgId}, lead: ${leadId} — triggered: ${result.triggered}, succeeded: ${result.succeeded}, failed: ${result.failed}`
  );
}

/**
 * Fire when an appointment is created.
 */
export async function onAppointmentCreated(
  orgId: string,
  appointmentId: string,
  leadId?: string
): Promise<void> {
  const result = await fireEvent({
    eventType: 'appointment_created',
    orgId,
    appointmentId,
    leadId,
  });
  console.log(
    `[workflow-triggers] onAppointmentCreated — org: ${orgId}, appointment: ${appointmentId} — triggered: ${result.triggered}, succeeded: ${result.succeeded}, failed: ${result.failed}`
  );
}

/**
 * Fire when an appointment is completed.
 */
export async function onAppointmentCompleted(
  orgId: string,
  appointmentId: string,
  leadId?: string
): Promise<void> {
  const result = await fireEvent({
    eventType: 'appointment_completed',
    orgId,
    appointmentId,
    leadId,
  });
  console.log(
    `[workflow-triggers] onAppointmentCompleted — org: ${orgId}, appointment: ${appointmentId} — triggered: ${result.triggered}, succeeded: ${result.succeeded}, failed: ${result.failed}`
  );
}

/**
 * Fire when a lead's score changes. Passes the new score in context.
 */
export async function onLeadScoreUpdate(
  orgId: string,
  leadId: string,
  newScore: number
): Promise<void> {
  const result = await fireEvent({
    eventType: 'lead_score_update',
    orgId,
    leadId,
    context: { new_score: String(newScore) },
  });
  console.log(
    `[workflow-triggers] onLeadScoreUpdate — org: ${orgId}, lead: ${leadId}, score: ${newScore} — triggered: ${result.triggered}, succeeded: ${result.succeeded}, failed: ${result.failed}`
  );
}
