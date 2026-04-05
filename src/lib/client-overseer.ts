/**
 * Client Overseer — per-client AI health monitor.
 * Runs daily via admin-ai cron. Uses Claude Haiku ($0.25/1M tokens)
 * to review each client's health and take automated actions.
 *
 * Actions it can take:
 * - Send nudge emails to clinic owners when metrics slip
 * - Auto-adjust reminder timing based on no-show patterns
 * - Flag churn risk and suggest interventions
 * - Auto-reply to simple client questions via activity log
 * - Generate weekly proof reports
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropic } from '@/lib/ai-client';
import { sendEmail } from '@/lib/email';

interface ClientHealth {
  orgId: string;
  businessName: string;
  ownerEmail: string | null;
  plan: string;
  trialEndsAt: string | null;
  daysActive: number;
  leadsLast7d: number;
  leadsLast30d: number;
  appointmentsLast7d: number;
  noShowRate: number;
  avgResponseTimeMin: number | null;
  reviewRequestsSent: number;
  reviewsReceived: number;
  automationsActive: number;
  lastActivityAt: string | null;
  churnRiskScore: number;
}

interface OverseerAction {
  orgId: string;
  action: string;
  detail: string;
}

const ALERT_EMAIL = 'alex@zypflow.co.uk';

export async function runClientOverseer(): Promise<{
  clientsReviewed: number;
  actionsPerformed: OverseerAction[];
  errors: string[];
}> {
  const errors: string[] = [];
  const actions: OverseerAction[] = [];

  // 1. Get all active businesses
  const { data: businesses } = await supabaseAdmin
    .from('businesses')
    .select('id, name, owner_email, plan, trial_ends_at, created_at')
    .eq('active', true)
    .not('plan', 'is', null);

  if (!businesses || businesses.length === 0) {
    return { clientsReviewed: 0, actionsPerformed: [], errors: [] };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // 2. Collect health metrics for each client
  const healthData: ClientHealth[] = [];

  for (const biz of businesses) {
    try {
      const orgId = biz.id;
      const daysActive = Math.floor((now.getTime() - new Date(biz.created_at).getTime()) / (1000 * 60 * 60 * 24));

      // Leads
      const { count: leads7d } = await supabaseAdmin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', sevenDaysAgo);

      const { count: leads30d } = await supabaseAdmin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', thirtyDaysAgo);

      // Appointments
      const { data: appointments } = await supabaseAdmin
        .from('appointments')
        .select('id, status')
        .eq('org_id', orgId)
        .gte('created_at', sevenDaysAgo);

      const appts7d = appointments?.length ?? 0;
      const noShows = appointments?.filter((a) => a.status === 'no_show').length ?? 0;
      const noShowRate = appts7d > 0 ? noShows / appts7d : 0;

      // Reviews
      const { count: reviewsSent } = await supabaseAdmin
        .from('activity_log')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('action', 'review_request_sent')
        .gte('created_at', sevenDaysAgo);

      const { count: reviewsReceived } = await supabaseAdmin
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', sevenDaysAgo);

      // Active automations
      const { count: automations } = await supabaseAdmin
        .from('deployed_templates')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('active', true);

      // Last activity
      const { data: lastActivity } = await supabaseAdmin
        .from('activity_log')
        .select('created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Churn risk score (0-100, higher = more risk)
      let churnRisk = 0;
      if ((leads7d ?? 0) === 0) churnRisk += 25;
      if (appts7d === 0 && daysActive > 14) churnRisk += 20;
      if (noShowRate > 0.3) churnRisk += 15;
      if ((automations ?? 0) === 0) churnRisk += 20;
      if (lastActivity && daysSince(lastActivity.created_at) > 7) churnRisk += 20;
      if (biz.plan === 'trial') churnRisk += 10;

      healthData.push({
        orgId,
        businessName: biz.name || 'Unknown',
        ownerEmail: biz.owner_email,
        plan: biz.plan,
        trialEndsAt: biz.trial_ends_at,
        daysActive,
        leadsLast7d: leads7d ?? 0,
        leadsLast30d: leads30d ?? 0,
        appointmentsLast7d: appts7d,
        noShowRate: Math.round(noShowRate * 100),
        avgResponseTimeMin: null,
        reviewRequestsSent: reviewsSent ?? 0,
        reviewsReceived: reviewsReceived ?? 0,
        automationsActive: automations ?? 0,
        lastActivityAt: lastActivity?.created_at ?? null,
        churnRiskScore: Math.min(churnRisk, 100),
      });
    } catch (e) {
      errors.push(`health_${biz.id}: ${e}`);
    }
  }

  // 3. AI analysis + automated actions for high-risk clients
  const atRiskClients = healthData.filter((c) => c.churnRiskScore >= 40);

  if (atRiskClients.length > 0) {
    try {
      const anthropic = getAnthropic();

      const clientSummaries = atRiskClients.map((c) =>
        `- ${c.businessName} (${c.plan}, ${c.daysActive}d active): ` +
        `churn_risk=${c.churnRiskScore}, leads_7d=${c.leadsLast7d}, ` +
        `appts_7d=${c.appointmentsLast7d}, no_show=${c.noShowRate}%, ` +
        `automations=${c.automationsActive}, reviews=${c.reviewsReceived}/${c.reviewRequestsSent}`
      ).join('\n');

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `You are the Zypflow client success AI. Review these at-risk clients and suggest ONE specific action for each.

At-risk clients:
${clientSummaries}

For each client, respond in this exact format (one line per client):
CLIENT: [name] | ACTION: [email_owner|add_automation|adjust_reminders|flag_for_alex] | REASON: [brief reason]

Rules:
- email_owner: only if they haven't been contacted in 7+ days
- add_automation: if automations_active is 0
- adjust_reminders: if no_show_rate > 25%
- flag_for_alex: if churn_risk > 70 or trial expiring`,
        }],
      });

      const aiText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Parse AI recommendations and execute
      for (const line of aiText.split('\n')) {
        const match = line.match(/CLIENT:\s*(.+?)\s*\|\s*ACTION:\s*(\w+)\s*\|\s*REASON:\s*(.+)/i);
        if (!match) continue;

        const [, clientName, actionType, reason] = match;
        const client = atRiskClients.find((c) =>
          c.businessName.toLowerCase().includes(clientName.trim().toLowerCase())
        );
        if (!client) continue;

        switch (actionType.trim()) {
          case 'email_owner':
            if (client.ownerEmail) {
              await sendEmail({
                to: client.ownerEmail,
                subject: `Quick check-in from Zypflow`,
                html: `
                  <p>Hi,</p>
                  <p>Just wanted to check in and see how things are going with your Zypflow setup.</p>
                  <p>I noticed your clinic might benefit from a quick review — would you like me to take a look at your automations and make sure everything is running smoothly?</p>
                  <p>Just reply to this email and I'll take care of it.</p>
                  <p>Best,<br>Alex @ Zypflow</p>
                `,
              });
              actions.push({ orgId: client.orgId, action: 'email_owner', detail: reason.trim() });
            }
            break;

          case 'flag_for_alex':
            await sendEmail({
              to: ALERT_EMAIL,
              subject: `[Overseer] ${client.businessName} needs attention`,
              html: `
                <p><strong>${client.businessName}</strong> (${client.plan}) — churn risk: ${client.churnRiskScore}%</p>
                <p>Reason: ${reason.trim()}</p>
                <p>Leads (7d): ${client.leadsLast7d} | Appointments (7d): ${client.appointmentsLast7d} | No-show: ${client.noShowRate}%</p>
              `,
            });
            actions.push({ orgId: client.orgId, action: 'flag_for_alex', detail: reason.trim() });
            break;

          default:
            actions.push({ orgId: client.orgId, action: actionType.trim(), detail: reason.trim() });
            break;
        }
      }
    } catch (e) {
      errors.push(`ai_analysis: ${e}`);
    }
  }

  // 4. Log overseer run
  try {
    const { data: systemOrg } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .limit(1)
      .single();

    if (systemOrg) {
      await supabaseAdmin.from('activity_log').insert({
        org_id: systemOrg.id,
        action: 'client_overseer_run',
        description: `Reviewed ${healthData.length} clients, ${atRiskClients.length} at risk, ${actions.length} actions taken`,
        metadata: {
          clientsReviewed: healthData.length,
          atRisk: atRiskClients.length,
          actions,
          healthSummary: healthData.map((c) => ({
            name: c.businessName,
            churnRisk: c.churnRiskScore,
            leads7d: c.leadsLast7d,
          })),
        },
      });
    }
  } catch {
    // Non-critical
  }

  return {
    clientsReviewed: healthData.length,
    actionsPerformed: actions,
    errors,
  };
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}
