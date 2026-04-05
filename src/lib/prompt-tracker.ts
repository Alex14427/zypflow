import { supabaseAdmin } from '@/lib/supabase';

/**
 * Prompt performance tracking system.
 *
 * Tracks key metrics for each conversation to enable prompt A/B testing
 * and self-improvement loops. Stores results in activity_log so the
 * watchdog/admin AI can analyze and suggest prompt improvements.
 *
 * Metrics tracked:
 * - lead_extracted: did the AI successfully extract contact info?
 * - booking_intent: did the conversation show booking intent?
 * - message_count: how many exchanges before outcome?
 * - response_length: average AI response length (shorter = better UX)
 * - sentiment: positive/neutral/negative end state
 * - model_used: which model handled this conversation
 * - duration_seconds: total conversation duration
 */

interface ConversationOutcome {
  orgId: string;
  conversationId: string;
  leadExtracted: boolean;
  bookingIntentDetected: boolean;
  messageCount: number;
  avgResponseLength: number;
  modelUsed: string;
  durationSeconds: number;
  leadId?: string;
  appointmentCreated?: boolean;
}

/**
 * Log a conversation outcome for prompt performance analysis.
 * Called at the end of meaningful conversations (3+ messages).
 */
export async function trackConversationOutcome(outcome: ConversationOutcome): Promise<void> {
  try {
    await supabaseAdmin.from('activity_log').insert({
      org_id: outcome.orgId,
      action: 'conversation_outcome',
      description: outcome.leadExtracted
        ? `Lead captured${outcome.appointmentCreated ? ' + appointment booked' : ''}`
        : `No lead captured after ${outcome.messageCount} messages`,
      target_type: 'conversation',
      target_id: outcome.conversationId,
      metadata: {
        lead_extracted: outcome.leadExtracted,
        booking_intent: outcome.bookingIntentDetected,
        message_count: outcome.messageCount,
        avg_response_length: outcome.avgResponseLength,
        model_used: outcome.modelUsed,
        duration_seconds: outcome.durationSeconds,
        lead_id: outcome.leadId ?? null,
        appointment_created: outcome.appointmentCreated ?? false,
      },
    });
  } catch (err) {
    console.error('[prompt-tracker] Failed to log conversation outcome:', err);
  }
}

/**
 * Analyze prompt performance over a time period.
 * Returns aggregate metrics per org for the admin AI / watchdog.
 */
export async function getPromptPerformance(orgId: string, days: number = 7): Promise<{
  totalConversations: number;
  leadCaptureRate: number;
  bookingIntentRate: number;
  avgMessagesToCapture: number;
  avgResponseLength: number;
  modelBreakdown: Record<string, number>;
}> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: outcomes } = await supabaseAdmin
    .from('activity_log')
    .select('metadata')
    .eq('org_id', orgId)
    .eq('action', 'conversation_outcome')
    .gte('created_at', since);

  interface OutcomeRecord { metadata: Record<string, unknown> | null }
  const records = (outcomes ?? []) as OutcomeRecord[];
  const total = records.length;

  if (total === 0) {
    return {
      totalConversations: 0,
      leadCaptureRate: 0,
      bookingIntentRate: 0,
      avgMessagesToCapture: 0,
      avgResponseLength: 0,
      modelBreakdown: {},
    };
  }

  const leadsExtracted = records.filter((r: OutcomeRecord) => r.metadata?.lead_extracted).length;
  const bookingIntents = records.filter((r: OutcomeRecord) => r.metadata?.booking_intent).length;

  const capturedConversations = records.filter((r: OutcomeRecord) => r.metadata?.lead_extracted);
  const avgMessages = capturedConversations.length > 0
    ? capturedConversations.reduce((sum: number, r: OutcomeRecord) => sum + (Number(r.metadata?.message_count) || 0), 0) / capturedConversations.length
    : 0;

  const avgResponseLen = records.reduce((sum: number, r: OutcomeRecord) => sum + (Number(r.metadata?.avg_response_length) || 0), 0) / total;

  const modelBreakdown: Record<string, number> = {};
  for (const r of records) {
    const model = String(r.metadata?.model_used ?? 'unknown');
    modelBreakdown[model] = (modelBreakdown[model] ?? 0) + 1;
  }

  return {
    totalConversations: total,
    leadCaptureRate: Math.round((leadsExtracted / total) * 100),
    bookingIntentRate: Math.round((bookingIntents / total) * 100),
    avgMessagesToCapture: Math.round(avgMessages * 10) / 10,
    avgResponseLength: Math.round(avgResponseLen),
    modelBreakdown,
  };
}
