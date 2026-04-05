import { PostHog } from 'posthog-node';

// ---------------------------------------------------------------------------
// Lazy PostHog Node client – no-ops when the key is missing so the app never
// crashes in environments without PostHog configured.
// ---------------------------------------------------------------------------

let _client: PostHog | null = null;

function getClient(): PostHog | null {
  if (_client) return _client;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key) return null;

  _client = new PostHog(key, { host: host || 'https://eu.i.posthog.com' });
  return _client;
}

// ---------------------------------------------------------------------------
// Generic track helper
// ---------------------------------------------------------------------------

export function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): void {
  const client = getClient();
  if (!client) return;
  client.capture({ distinctId, event, properties });
}

// ---------------------------------------------------------------------------
// Event name constants
// ---------------------------------------------------------------------------

export const EVENTS = {
  LEAD_CREATED: 'lead_created',
  APPOINTMENT_BOOKED: 'appointment_booked',
  CONVERSATION_STARTED: 'conversation_started',
  AUDIT_COMPLETED: 'audit_completed',
  WORKFLOW_EXECUTED: 'workflow_executed',
  OUTREACH_SENT: 'outreach_sent',
  TRIAL_STARTED: 'trial_started',
  SUBSCRIPTION_CREATED: 'subscription_created',
  CHURN_RISK: 'churn_risk',
} as const;

// ---------------------------------------------------------------------------
// Convenience functions
// ---------------------------------------------------------------------------

export function trackLeadCreated(
  orgId: string,
  leadId: string,
  source: string,
  score: number,
): void {
  trackEvent(orgId, EVENTS.LEAD_CREATED, { leadId, source, score });
}

export function trackAppointmentBooked(
  orgId: string,
  appointmentId: string,
  leadId?: string,
  service?: string,
): void {
  trackEvent(orgId, EVENTS.APPOINTMENT_BOOKED, {
    appointmentId,
    leadId,
    service,
  });
}

export function trackConversationStarted(
  orgId: string,
  conversationId: string,
  channel: string,
): void {
  trackEvent(orgId, EVENTS.CONVERSATION_STARTED, { conversationId, channel });
}

export function trackAuditCompleted(
  auditId: string,
  score: number,
  hasEmail: boolean,
): void {
  trackEvent(auditId, EVENTS.AUDIT_COMPLETED, { score, hasEmail });
}

export function trackWorkflowExecuted(
  orgId: string,
  templateId: string,
  success: boolean,
  stepsExecuted: number,
  stepsFailed: number,
): void {
  trackEvent(orgId, EVENTS.WORKFLOW_EXECUTED, {
    templateId,
    success,
    stepsExecuted,
    stepsFailed,
  });
}

export function trackOutreachSent(
  orgId: string,
  leadId: string,
  templateType: string,
): void {
  trackEvent(orgId, EVENTS.OUTREACH_SENT, { leadId, templateType });
}

export function trackTrialStarted(orgId: string, plan: string): void {
  trackEvent(orgId, EVENTS.TRIAL_STARTED, { plan });
}

export function trackSubscriptionCreated(
  orgId: string,
  plan: string,
  mrr: number,
): void {
  trackEvent(orgId, EVENTS.SUBSCRIPTION_CREATED, { plan, mrr });
}

export function trackChurnRisk(
  orgId: string,
  riskLevel: string,
  reason: string,
): void {
  trackEvent(orgId, EVENTS.CHURN_RISK, { riskLevel, reason });
}
