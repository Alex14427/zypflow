import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { getAnthropic } from '@/lib/ai-client';
import { sendEmail } from '@/lib/email';
import { runClientOverseer } from '@/lib/client-overseer';
import { ALERT_EMAIL } from '@/lib/admin-users';

interface Metrics {
  activeBusinesses: number;
  staleClients: number;
  trialsExpiringNoStripe: number;
  brokenConversations: number;
  failedWorkflows: number;
  totalWorkflows: number;
  avgLeadCaptureRate: number | null;
  emailFailures: number;
  stuckScheduledActions: number;
}

interface AutoFix {
  action: string;
  count: number;
}

// Daily Admin AI cron -- called by Vercel cron or Make.com
export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const metrics: Metrics = {
    activeBusinesses: 0,
    staleClients: 0,
    trialsExpiringNoStripe: 0,
    brokenConversations: 0,
    failedWorkflows: 0,
    totalWorkflows: 0,
    avgLeadCaptureRate: null,
    emailFailures: 0,
    stuckScheduledActions: 0,
  };
  const fixes: AutoFix[] = [];
  const errors: string[] = [];

  // ── 1. Collect system metrics ──────────────────────────────────────────────

  try {
    // Active businesses
    const { count } = await supabaseAdmin
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('active', true)
      .not('plan', 'is', null);
    metrics.activeBusinesses = count ?? 0;
  } catch (e) { errors.push(`activeBusinesses: ${e}`); }

  try {
    // Stale clients -- businesses with no leads created in last 14 days
    const { data: allActive } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('active', true)
      .not('plan', 'is', null);

    if (allActive && allActive.length > 0) {
      const { data: recentLeadOrgs } = await supabaseAdmin
        .from('leads')
        .select('org_id')
        .gte('created_at', fourteenDaysAgo);

      const activeOrgIds = new Set(recentLeadOrgs?.map((l) => l.org_id) ?? []);
      metrics.staleClients = allActive.filter((b) => !activeOrgIds.has(b.id)).length;
    }
  } catch (e) { errors.push(`staleClients: ${e}`); }

  try {
    // Trials expiring in 3 days without Stripe
    const { data: expiring } = await supabaseAdmin
      .from('businesses')
      .select('id, stripe_customer_id')
      .eq('plan', 'trial')
      .lte('trial_ends_at', threeDaysFromNow)
      .gte('trial_ends_at', now.toISOString());

    metrics.trialsExpiringNoStripe =
      expiring?.filter((b) => !b.stripe_customer_id).length ?? 0;
  } catch (e) { errors.push(`trialsExpiring: ${e}`); }

  try {
    // Broken conversations -- conversations with no AI response
    const { count } = await supabaseAdmin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('direction', 'inbound')
      .is('ai_response', null);
    metrics.brokenConversations = count ?? 0;
  } catch (e) { errors.push(`brokenConversations: ${e}`); }

  try {
    // Failed workflow executions in last 24h
    const { data: workflows } = await supabaseAdmin
      .from('activity_log')
      .select('metadata')
      .eq('action', 'workflow_executed')
      .gte('created_at', oneDayAgo);

    metrics.totalWorkflows = workflows?.length ?? 0;
    metrics.failedWorkflows = workflows?.filter(
      (w) => w.metadata?.success === false || w.metadata?.status === 'failed'
    ).length ?? 0;
  } catch (e) { errors.push(`failedWorkflows: ${e}`); }

  try {
    // Prompt performance -- avg lead capture rate
    const { data: outcomes } = await supabaseAdmin
      .from('activity_log')
      .select('metadata')
      .eq('action', 'conversation_outcome')
      .gte('created_at', oneDayAgo);

    if (outcomes && outcomes.length > 0) {
      const rates = outcomes
        .map((o) => o.metadata?.lead_capture_rate)
        .filter((r): r is number => typeof r === 'number');
      metrics.avgLeadCaptureRate =
        rates.length > 0 ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) / 100 : null;
    }
  } catch (e) { errors.push(`leadCaptureRate: ${e}`); }

  try {
    // Email delivery failures in last 24h
    const { count } = await supabaseAdmin
      .from('activity_log')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'email_send_failed')
      .gte('created_at', oneDayAgo);
    metrics.emailFailures = count ?? 0;
  } catch (e) { errors.push(`emailFailures: ${e}`); }

  try {
    // Stuck scheduled actions (pending > 2 hours)
    const { count } = await supabaseAdmin
      .from('scheduled_actions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lte('scheduled_for', twoHoursAgo);
    metrics.stuckScheduledActions = count ?? 0;
  } catch (e) { errors.push(`stuckScheduledActions: ${e}`); }

  // ── 2. Automated fixes ─────────────────────────────────────────────────────

  try {
    // Fix stale scheduled_actions: mark pending > 2h as failed
    const { data: staleActions } = await supabaseAdmin
      .from('scheduled_actions')
      .update({ status: 'failed', failure_reason: 'timeout_admin_ai' })
      .eq('status', 'pending')
      .lte('scheduled_for', twoHoursAgo)
      .select('id');

    if (staleActions && staleActions.length > 0) {
      fixes.push({ action: 'timeout_stale_scheduled_actions', count: staleActions.length });
    }
  } catch (e) { errors.push(`fix_stale_actions: ${e}`); }

  try {
    // Fix hot leads stuck as 'new' for > 48h: auto-update to 'contacted'
    const { data: hotStaleLeads } = await supabaseAdmin
      .from('leads')
      .select('id, org_id')
      .eq('status', 'new')
      .gte('score', 80)
      .lte('created_at', twoDaysAgo);

    if (hotStaleLeads && hotStaleLeads.length > 0) {
      const ids = hotStaleLeads.map((l) => l.id);
      await supabaseAdmin
        .from('leads')
        .update({ status: 'contacted' })
        .in('id', ids);

      // Log each fix
      const logEntries = hotStaleLeads.map((l) => ({
        org_id: l.org_id,
        action: 'admin_ai_auto_fix' as const,
        description: `Auto-updated lead ${l.id} from 'new' to 'contacted' (score >= 80, stale > 48h)`,
        metadata: { lead_id: l.id, fix: 'hot_lead_status_update' },
      }));
      await supabaseAdmin.from('activity_log').insert(logEntries);

      fixes.push({ action: 'auto_contact_hot_leads', count: hotStaleLeads.length });
    }
  } catch (e) { errors.push(`fix_hot_leads: ${e}`); }

  // ── 3. AI-powered daily digest ─────────────────────────────────────────────

  let digest = '';
  try {
    const anthropic = getAnthropic();
    const workflowFailRate = metrics.totalWorkflows > 0
      ? ((metrics.failedWorkflows / metrics.totalWorkflows) * 100).toFixed(1)
      : '0';

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are the Zypflow system administrator AI. Analyze these daily metrics and provide a concise digest.

Metrics:
- Active businesses: ${metrics.activeBusinesses}
- Businesses with no leads in 14 days (stale): ${metrics.staleClients}
- Trials expiring in 3 days without Stripe: ${metrics.trialsExpiringNoStripe}
- Inbound conversations with no AI response (broken): ${metrics.brokenConversations}
- Workflow executions (24h): ${metrics.totalWorkflows} total, ${metrics.failedWorkflows} failed (${workflowFailRate}%)
- Avg lead capture rate: ${metrics.avgLeadCaptureRate ?? 'N/A'}
- Email delivery failures (24h): ${metrics.emailFailures}
- Scheduled actions stuck pending > 2h: ${metrics.stuckScheduledActions}
- Auto-fixes applied: ${fixes.map((f) => `${f.action}: ${f.count}`).join(', ') || 'none'}
- Collection errors: ${errors.length > 0 ? errors.join('; ') : 'none'}

Respond in exactly this format:
HEALTH: [one line summary]
TOP RISK: [the single biggest risk right now]
IMPROVEMENT: [one concrete, actionable suggestion]`,
      }],
    });

    digest = response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (e) {
    digest = `AI digest generation failed: ${e}`;
  }

  // ── 4. Store digest in activity_log ────────────────────────────────────────

  try {
    const { data: systemOrg } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .limit(1)
      .single();

    if (systemOrg) {
      await supabaseAdmin.from('activity_log').insert({
        org_id: systemOrg.id,
        action: 'admin_ai_digest',
        description: digest.slice(0, 500),
        metadata: { metrics, fixes, errors, digest, timestamp: now.toISOString() },
      });
    }
  } catch {
    console.warn('admin-ai: could not write digest to activity_log');
  }

  // ── 5. Alert email if critical issues found ────────────────────────────────

  const hasCritical =
    metrics.trialsExpiringNoStripe > 0 ||
    metrics.brokenConversations > 5 ||
    metrics.emailFailures > 3 ||
    (metrics.totalWorkflows > 0 && metrics.failedWorkflows / metrics.totalWorkflows > 0.2) ||
    metrics.stuckScheduledActions > 10;

  if (hasCritical) {
    try {
      await sendEmail({
        to: ALERT_EMAIL,
        subject: `[Admin AI] Zypflow Daily Digest -- ${new Date().toLocaleDateString('en-GB')}`,
        html: `
          <h2 style="color:#dc2626;margin-bottom:4px">Admin AI -- Critical Issues Detected</h2>
          <p style="color:#6b7280;margin-top:0">${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>

          <h3 style="margin-bottom:8px">AI Digest</h3>
          <pre style="background:#f9fafb;padding:16px;border-radius:8px;white-space:pre-wrap;font-size:14px;line-height:1.5">${digest}</pre>

          <h3 style="margin-bottom:8px">Key Metrics</h3>
          <table style="width:100%;border-collapse:collapse;margin:12px 0">
            <tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">Active Businesses</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${metrics.activeBusinesses}</td></tr>
            <tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">Stale Clients (14d no leads)</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${metrics.staleClients}</td></tr>
            <tr style="background:#fef2f2"><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#991b1b">Trials Expiring (no Stripe)</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;color:#991b1b">${metrics.trialsExpiringNoStripe}</td></tr>
            <tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">Broken Conversations</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${metrics.brokenConversations}</td></tr>
            <tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">Failed Workflows (24h)</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${metrics.failedWorkflows}/${metrics.totalWorkflows}</td></tr>
            <tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">Email Failures (24h)</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${metrics.emailFailures}</td></tr>
            <tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">Stuck Scheduled Actions</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${metrics.stuckScheduledActions}</td></tr>
          </table>

          ${fixes.length > 0 ? `<h3 style="margin-bottom:8px">Auto-Fixes Applied</h3><ul>${fixes.map((f) => `<li><strong>${f.action}</strong>: ${f.count} items</li>`).join('')}</ul>` : ''}

          <p style="color:#6b7280;font-size:13px;margin-top:24px">Automated report from Zypflow Admin AI.</p>
        `,
      });
    } catch (e) {
      errors.push(`alert_email: ${e}`);
    }
  }

  // ── 6. Per-client AI overseer ───────────────────────────────────────────────

  let overseerResult = { clientsReviewed: 0, actionsPerformed: [] as Array<{ orgId: string; action: string; detail: string }>, errors: [] as string[] };
  try {
    overseerResult = await runClientOverseer();
    if (overseerResult.errors.length > 0) {
      errors.push(...overseerResult.errors.map((e) => `overseer: ${e}`));
    }
  } catch (e) {
    errors.push(`client_overseer: ${e}`);
  }

  // ── Response ───────────────────────────────────────────────────────────────

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    metrics,
    digest,
    fixes,
    overseer: {
      clientsReviewed: overseerResult.clientsReviewed,
      actionsPerformed: overseerResult.actionsPerformed,
    },
    errors: errors.length > 0 ? errors : undefined,
    alertSent: hasCritical,
  });
}
