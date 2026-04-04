import { NextRequest, NextResponse } from 'next/server';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { supabaseAdmin } from '@/lib/supabase';

const OUTREACH_READY_STATUSES = ['new', 'retry_required', 'outreach_sent', 'follow_up_scheduled', 'opened', 'clicked'];

// Daily cron: send due outreach emails natively through Zypflow.
export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: true, reason: 'RESEND_API_KEY not configured' });
  }

  const nowIso = new Date().toISOString();

  const { count } = await supabaseAdmin
    .from('prospects')
    .select('id', { count: 'exact', head: true })
    .not('email', 'is', null)
    .in('status', OUTREACH_READY_STATUSES)
    .or(`next_follow_up_at.is.null,next_follow_up_at.lte.${nowIso}`);

  if (!count || count === 0) {
    return NextResponse.json({ sent: 0, message: 'No prospects ready for outreach' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com';

  try {
    const res = await fetch(`${appUrl}/api/outreach/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET || ''}`,
      },
      body: JSON.stringify({ limit: 50 }),
    });

    const data = await res.json();
    return NextResponse.json({ cron: 'native_outreach_send', queued: count, ...data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
