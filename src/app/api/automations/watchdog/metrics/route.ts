import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { ADMIN_EMAILS } from '@/lib/admin-users';

// Admin metrics endpoint — returns current system-wide metrics for a dashboard
export async function GET(req: NextRequest) {
  // Allow access via automation secret/cron token OR admin email query param
  const authError = verifyAutomationAuth(req);
  if (authError) {
    // Fall back to admin email check via query param (for quick dashboard access)
    const adminEmail = req.nextUrl.searchParams.get('admin_email');
    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
      return authError;
    }
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [
    totalOrgsResult,
    totalLeadsResult,
    conversationsResult,
    appointmentsResult,
    activeTrialsResult,
    paidSubsResult,
    workflowsResult,
    pendingActionsResult,
    auditsResult,
  ] = await Promise.allSettled([
    // Total active organisations
    supabaseAdmin
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('active', true),

    // Total leads across all orgs
    supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact', head: true }),

    // Conversations in last 7 days
    supabaseAdmin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo),

    // Appointments in last 7 days
    supabaseAdmin
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo),

    // Active trials
    supabaseAdmin
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('plan', 'trial')
      .eq('active', true)
      .gte('trial_ends_at', now.toISOString()),

    // Paid subscribers (any non-trial active plan)
    supabaseAdmin
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .neq('plan', 'trial')
      .eq('active', true),

    // Workflow executions in last 24h
    supabaseAdmin
      .from('activity_log')
      .select('action, metadata')
      .eq('action', 'workflow_executed')
      .gte('created_at', oneDayAgo),

    // Pending scheduled actions
    supabaseAdmin
      .from('scheduled_actions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // Audit submissions in last 7 days
    supabaseAdmin
      .from('audits')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo),
  ]);

  // ── Workflow success/fail breakdown ───────────────────────────────────────
  let workflowTotal = 0;
  let workflowSuccess = 0;
  let workflowFailed = 0;

  if (workflowsResult.status === 'fulfilled' && workflowsResult.value.data) {
    const workflows = workflowsResult.value.data;
    workflowTotal = workflows.length;
    workflowFailed = workflows.filter(
      (r) => r.metadata?.success === false || r.metadata?.status === 'failed'
    ).length;
    workflowSuccess = workflowTotal - workflowFailed;
  }

  // ── Safe count extractor ──────────────────────────────────────────────────
  function safeCount(
    result: PromiseSettledResult<{ count: number | null; error: unknown }>
  ): number | null {
    if (result.status === 'fulfilled') return result.value.count ?? 0;
    return null;
  }

  const metrics = {
    timestamp: now.toISOString(),
    organisations: {
      total_active: safeCount(totalOrgsResult as PromiseSettledResult<{ count: number | null; error: unknown }>),
      active_trials: safeCount(activeTrialsResult as PromiseSettledResult<{ count: number | null; error: unknown }>),
      paid_subscribers: safeCount(paidSubsResult as PromiseSettledResult<{ count: number | null; error: unknown }>),
    },
    leads: {
      total: safeCount(totalLeadsResult as PromiseSettledResult<{ count: number | null; error: unknown }>),
    },
    conversations: {
      last_7_days: safeCount(conversationsResult as PromiseSettledResult<{ count: number | null; error: unknown }>),
    },
    appointments: {
      last_7_days: safeCount(appointmentsResult as PromiseSettledResult<{ count: number | null; error: unknown }>),
    },
    workflows: {
      last_24h_total: workflowTotal,
      last_24h_success: workflowSuccess,
      last_24h_failed: workflowFailed,
      failure_rate_pct:
        workflowTotal > 0 ? Math.round((workflowFailed / workflowTotal) * 100) : 0,
    },
    scheduled_actions: {
      pending:
        pendingActionsResult.status === 'fulfilled'
          ? (pendingActionsResult.value.count ?? 0)
          : null,
    },
    audits: {
      submissions_last_7_days: safeCount(auditsResult as PromiseSettledResult<{ count: number | null; error: unknown }>),
    },
  };

  return NextResponse.json(metrics);
}
