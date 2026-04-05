import { NextRequest, NextResponse } from 'next/server';
import { verifyAutomationAuth } from '@/lib/auth-automation';

/**
 * Daily orchestrator — single cron entry point for Vercel Hobby plan.
 * Runs at 7am UTC and calls all automation routes in sequence.
 * This replaces multiple individual crons that require Vercel Pro.
 */
export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zypflow.co.uk';
  const cronSecret = process.env.CRON_SECRET || '';

  const routes = [
    '/api/automations/lead-score-refresh',
    '/api/automations/lifecycle',
    '/api/automations/reminders',
    '/api/automations/follow-up',
    '/api/automations/execute',
    '/api/outreach/cron',
    '/api/automations/review-request',
    '/api/automations/watchdog',
    '/api/automations/admin-ai',
    '/api/scrape/cron',
  ];

  const results: Array<{ route: string; status: number; ok: boolean }> = [];

  for (const route of routes) {
    try {
      const res = await fetch(`${baseUrl}${route}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(55_000),
      });
      results.push({ route, status: res.status, ok: res.ok });
    } catch (err) {
      results.push({ route, status: 0, ok: false });
    }
  }

  const failed = results.filter((r) => !r.ok);

  return NextResponse.json({
    ok: failed.length === 0,
    timestamp: new Date().toISOString(),
    total: results.length,
    succeeded: results.length - failed.length,
    failed: failed.length,
    results,
  });
}
