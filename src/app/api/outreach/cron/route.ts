import { NextRequest, NextResponse } from 'next/server';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Daily cron: auto-push new prospects to Instantly.ai outreach.
 * Runs every day at 7 AM — picks up prospects scraped by the weekly scrape cron
 * and pushes them to Instantly for cold email campaigns.
 */
export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  const apiKey = process.env.INSTANTLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ skipped: true, reason: 'INSTANTLY_API_KEY not configured' });
  }

  // Count how many new prospects are waiting
  const { count } = await supabaseAdmin
    .from('prospects')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new')
    .not('email', 'is', null);

  if (!count || count === 0) {
    return NextResponse.json({ pushed: 0, message: 'No new prospects to push' });
  }

  // Call the outreach push endpoint internally
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com';
  try {
    const res = await fetch(`${appUrl}/api/outreach/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
      },
      body: JSON.stringify({ limit: 50 }),
    });

    const data = await res.json();
    return NextResponse.json({ cron: 'outreach_push', ...data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
