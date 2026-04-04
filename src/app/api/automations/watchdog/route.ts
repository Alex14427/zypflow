import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { sendEmail } from '@/lib/email';

const ALERT_EMAIL = 'alex@zypflow.co.uk';

interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  value?: number;
}

interface HealthReport {
  status: 'healthy' | 'warning' | 'critical';
  checks: HealthCheck[];
  timestamp: string;
}

// Daily health check cron — called by Vercel cron or Make.com
export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  const checks: HealthCheck[] = [];
  const now = new Date();
  const timestamp = now.toISOString();

  // ── a) API health — validate Supabase connection first ───────────────────
  try {
    const { error } = await supabaseAdmin
      .from('organisations')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) throw error;
    checks.push({ name: 'API Health', status: 'pass', message: 'Supabase connection is healthy' });
  } catch (err) {
    checks.push({
      name: 'API Health',
      status: 'fail',
      message: `Supabase connection failed: ${String(err)}`,
    });
    // If DB is down, skip remaining checks and report immediately
    const report = buildReport(checks, timestamp);
    await alertIfNeeded(report);
    return NextResponse.json(report);
  }

  // ── b) Webhook health — messages and appointments received recently ───────
  try {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ count: recentMessages }, { count: activeLeads }, { count: recentAppts }] =
      await Promise.all([
        supabaseAdmin
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', oneDayAgo),
        supabaseAdmin
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .in('status', ['new', 'contacted', 'qualified']),
        supabaseAdmin
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo),
      ]);

    const messages24h = recentMessages ?? 0;
    const leads = activeLeads ?? 0;
    const appts7d = recentAppts ?? 0;

    if (leads > 0 && messages24h === 0) {
      checks.push({
        name: 'Webhook Health',
        status: 'warn',
        message: `No webhook messages in last 24h, but ${leads} active leads exist — webhooks may be down`,
        value: messages24h,
      });
    } else {
      checks.push({
        name: 'Webhook Health',
        status: 'pass',
        message: `${messages24h} messages in last 24h, ${appts7d} appointments in last 7 days`,
        value: messages24h,
      });
    }

    if (appts7d === 0) {
      checks.push({
        name: 'Appointment Intake',
        status: 'warn',
        message: 'No new appointments created in the last 7 days',
        value: 0,
      });
    } else {
      checks.push({
        name: 'Appointment Intake',
        status: 'pass',
        message: `${appts7d} appointments created in the last 7 days`,
        value: appts7d,
      });
    }
  } catch (err) {
    checks.push({ name: 'Webhook Health', status: 'fail', message: `Check failed: ${String(err)}` });
  }

  // ── c) Automation failure rate ────────────────────────────────────────────
  try {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentWorkflows } = await supabaseAdmin
      .from('activity_log')
      .select('action, metadata')
      .eq('action', 'workflow_executed')
      .gte('created_at', oneDayAgo);

    const total = recentWorkflows?.length ?? 0;
    const failures = recentWorkflows?.filter(
      (r) => r.metadata?.success === false || r.metadata?.status === 'failed'
    ).length ?? 0;
    const failureRate = total > 0 ? (failures / total) * 100 : 0;

    if (total === 0) {
      checks.push({
        name: 'Automation Failure Rate',
        status: 'pass',
        message: 'No workflow executions in last 24h',
        value: 0,
      });
    } else if (failureRate > 20) {
      checks.push({
        name: 'Automation Failure Rate',
        status: 'fail',
        message: `High failure rate: ${failureRate.toFixed(1)}% (${failures}/${total} workflows failed in last 24h)`,
        value: Math.round(failureRate),
      });
    } else {
      checks.push({
        name: 'Automation Failure Rate',
        status: 'pass',
        message: `Failure rate is ${failureRate.toFixed(1)}% (${failures}/${total} workflows in last 24h)`,
        value: Math.round(failureRate),
      });
    }
  } catch (err) {
    checks.push({ name: 'Automation Failure Rate', status: 'fail', message: `Check failed: ${String(err)}` });
  }

  // ── d) Trial conversion tracking ─────────────────────────────────────────
  try {
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: expiringTrials } = await supabaseAdmin
      .from('organisations')
      .select('id, stripe_customer_id')
      .eq('plan', 'trial')
      .lte('trial_ends_at', threeDaysFromNow)
      .gte('trial_ends_at', now.toISOString());

    const total = expiringTrials?.length ?? 0;
    const withStripe = expiringTrials?.filter((o) => o.stripe_customer_id).length ?? 0;
    const withoutStripe = total - withStripe;

    checks.push({
      name: 'Trial Conversions',
      status: total > 0 ? 'warn' : 'pass',
      message:
        total > 0
          ? `${total} trials expiring in 3 days — ${withStripe} likely to convert (have Stripe), ${withoutStripe} at risk`
          : 'No trials expiring in the next 3 days',
      value: total,
    });
  } catch (err) {
    checks.push({ name: 'Trial Conversions', status: 'fail', message: `Check failed: ${String(err)}` });
  }

  // ── e) Stale leads ────────────────────────────────────────────────────────
  try {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: staleLeadsByOrg } = await supabaseAdmin
      .from('leads')
      .select('org_id')
      .eq('status', 'new')
      .lte('created_at', sevenDaysAgo);

    // Group by org_id and find the worst offender
    const countsByOrg: Record<string, number> = {};
    for (const lead of staleLeadsByOrg ?? []) {
      countsByOrg[lead.org_id] = (countsByOrg[lead.org_id] ?? 0) + 1;
    }

    const maxStaleForAnyOrg = Math.max(0, ...Object.values(countsByOrg));
    const totalStale = staleLeadsByOrg?.length ?? 0;

    if (maxStaleForAnyOrg > 10) {
      checks.push({
        name: 'Stale Leads',
        status: 'fail',
        message: `One or more orgs have >10 stale new leads (uncontacted 7+ days). Worst org: ${maxStaleForAnyOrg} stale leads. Total across platform: ${totalStale}`,
        value: maxStaleForAnyOrg,
      });
    } else if (totalStale > 0) {
      checks.push({
        name: 'Stale Leads',
        status: 'warn',
        message: `${totalStale} leads with status 'new' older than 7 days across all orgs`,
        value: totalStale,
      });
    } else {
      checks.push({
        name: 'Stale Leads',
        status: 'pass',
        message: 'No stale leads — all new leads followed up within 7 days',
        value: 0,
      });
    }
  } catch (err) {
    checks.push({ name: 'Stale Leads', status: 'fail', message: `Check failed: ${String(err)}` });
  }

  // ── f) Email delivery ─────────────────────────────────────────────────────
  try {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { data: emailFailures } = await supabaseAdmin
      .from('activity_log')
      .select('id, description, metadata')
      .eq('action', 'email_send_failed')
      .gte('created_at', oneDayAgo);

    const count = emailFailures?.length ?? 0;

    if (count > 0) {
      checks.push({
        name: 'Email Delivery',
        status: 'fail',
        message: `${count} email send failures logged in the last 24h`,
        value: count,
      });
    } else {
      checks.push({
        name: 'Email Delivery',
        status: 'pass',
        message: 'No email delivery failures in the last 24h',
        value: 0,
      });
    }
  } catch (err) {
    checks.push({ name: 'Email Delivery', status: 'fail', message: `Check failed: ${String(err)}` });
  }

  // ── g) Scheduled actions backlog ──────────────────────────────────────────
  try {
    // scheduled_actions table may not exist yet — handle gracefully
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    const { count: backlog, error } = await supabaseAdmin
      .from('scheduled_actions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lte('scheduled_for', oneHourAgo);

    if (error) {
      // Table doesn't exist or inaccessible — skip gracefully
      checks.push({
        name: 'Scheduled Actions Backlog',
        status: 'pass',
        message: 'Scheduled actions table not available — skipped',
        value: 0,
      });
    } else {
      const pendingCount = backlog ?? 0;
      if (pendingCount > 10) {
        checks.push({
          name: 'Scheduled Actions Backlog',
          status: 'fail',
          message: `${pendingCount} overdue pending scheduled actions (>1 hour late) — processor may be stuck`,
          value: pendingCount,
        });
      } else if (pendingCount > 0) {
        checks.push({
          name: 'Scheduled Actions Backlog',
          status: 'warn',
          message: `${pendingCount} overdue pending scheduled actions`,
          value: pendingCount,
        });
      } else {
        checks.push({
          name: 'Scheduled Actions Backlog',
          status: 'pass',
          message: 'No backlog — scheduled actions are being processed on time',
          value: 0,
        });
      }
    }
  } catch (err) {
    checks.push({ name: 'Scheduled Actions Backlog', status: 'fail', message: `Check failed: ${String(err)}` });
  }

  // ── Compile report ────────────────────────────────────────────────────────
  const report = buildReport(checks, timestamp);

  // ── Send alert emails ─────────────────────────────────────────────────────
  await alertIfNeeded(report);

  // ── Store in activity_log ─────────────────────────────────────────────────
  // activity_log requires org_id NOT NULL, so we use a sentinel system org
  // or skip logging if no system org exists. We attempt to find the first org.
  try {
    const { data: systemOrg } = await supabaseAdmin
      .from('organisations')
      .select('id')
      .limit(1)
      .single();

    if (systemOrg) {
      await supabaseAdmin.from('activity_log').insert({
        org_id: systemOrg.id,
        action: 'watchdog_health_check',
        description: report.status,
        metadata: report,
      });
    }
  } catch {
    // Non-fatal — logging failure shouldn't break the health check response
    console.warn('watchdog: could not write to activity_log');
  }

  return NextResponse.json(report);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildReport(checks: HealthCheck[], timestamp: string): HealthReport {
  const hasFail = checks.some((c) => c.status === 'fail');
  const hasWarn = checks.some((c) => c.status === 'warn');

  return {
    status: hasFail ? 'critical' : hasWarn ? 'warning' : 'healthy',
    checks,
    timestamp,
  };
}

async function alertIfNeeded(report: HealthReport) {
  const failures = report.checks.filter((c) => c.status === 'fail');
  const warnings = report.checks.filter((c) => c.status === 'warn');

  if (failures.length > 0) {
    const checkRows = [...failures, ...warnings]
      .map(
        (c) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #fee2e2;font-weight:600;color:${
              c.status === 'fail' ? '#991b1b' : '#92400e'
            }">${c.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #fee2e2;color:#374151">${c.message}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #fee2e2;text-align:center">
              <span style="background:${
                c.status === 'fail' ? '#fef2f2' : '#fffbeb'
              };color:${
                c.status === 'fail' ? '#991b1b' : '#92400e'
              };padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600;text-transform:uppercase">${
                c.status
              }</span>
            </td>
          </tr>`
      )
      .join('');

    await sendEmail({
      to: ALERT_EMAIL,
      subject: `[CRITICAL] Zypflow Health Alert — ${failures.length} issue${failures.length === 1 ? '' : 's'} detected`,
      html: `
        <h2 style="color:#dc2626;margin-bottom:4px">System Health Alert</h2>
        <p style="color:#6b7280;margin-top:0">Detected at ${new Date(report.timestamp).toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
        <p><strong>${failures.length} critical issue${failures.length === 1 ? '' : 's'}</strong> require${failures.length === 1 ? 's' : ''} your attention:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fef2f2;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#fee2e2">
              <th style="padding:10px 12px;text-align:left;color:#991b1b;font-size:13px">Check</th>
              <th style="padding:10px 12px;text-align:left;color:#991b1b;font-size:13px">Details</th>
              <th style="padding:10px 12px;text-align:center;color:#991b1b;font-size:13px">Status</th>
            </tr>
          </thead>
          <tbody>${checkRows}</tbody>
        </table>
        <p>Overall system status: <strong style="color:#dc2626">CRITICAL</strong></p>
        <p style="color:#6b7280;font-size:13px">This is an automated alert from the Zypflow health watchdog.</p>
      `,
    });
  } else if (warnings.length > 0) {
    const warnRows = warnings
      .map(
        (c) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #fde68a;font-weight:600;color:#92400e">${c.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #fde68a;color:#374151">${c.message}${
              c.value !== undefined ? ` (value: ${c.value})` : ''
            }</td>
          </tr>`
      )
      .join('');

    await sendEmail({
      to: ALERT_EMAIL,
      subject: `[WARNING] Zypflow Health Check — ${warnings.length} item${warnings.length === 1 ? '' : 's'} need attention`,
      html: `
        <h2 style="color:#d97706;margin-bottom:4px">Health Check — Warnings</h2>
        <p style="color:#6b7280;margin-top:0">Detected at ${new Date(report.timestamp).toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
        <p>${warnings.length} item${warnings.length === 1 ? '' : 's'} need your attention (no critical failures):</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fffbeb;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#fef3c7">
              <th style="padding:10px 12px;text-align:left;color:#92400e;font-size:13px">Check</th>
              <th style="padding:10px 12px;text-align:left;color:#92400e;font-size:13px">Details</th>
            </tr>
          </thead>
          <tbody>${warnRows}</tbody>
        </table>
        <p>Overall system status: <strong style="color:#d97706">WARNING</strong></p>
        <p style="color:#6b7280;font-size:13px">This is an automated alert from the Zypflow health watchdog.</p>
      `,
    });
  }
  // All pass — no email
}
