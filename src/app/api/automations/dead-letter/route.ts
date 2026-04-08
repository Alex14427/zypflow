import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { getApiUser } from '@/lib/api-auth';

/**
 * GET /api/automations/dead-letter
 * Returns failed automations for the current org (or all if admin/cron).
 * Supports ?orgId=xxx&limit=50
 */
export async function GET(req: NextRequest) {
  const automationAuthError = verifyAutomationAuth(req);
  if (automationAuthError) {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

  let query = supabaseAdmin
    .from('scheduled_actions')
    .select('id, org_id, action_type, action_data, error, retry_count, max_retries, created_at, executed_at')
    .eq('status', 'dead_letter')
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (orgId) {
    query = query.eq('org_id', orgId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to query dead letter queue', details: error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: data?.length ?? 0,
    items: data ?? [],
  });
}

/**
 * POST /api/automations/dead-letter
 * Retry a specific dead-letter action by resetting it to pending.
 * Body: { actionId: string }
 */
export async function POST(req: NextRequest) {
  const automationAuthError = verifyAutomationAuth(req);
  if (automationAuthError) {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: { actionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { actionId } = body;
  if (!actionId) {
    return NextResponse.json({ error: 'actionId is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('scheduled_actions')
    .update({
      status: 'pending',
      retry_count: 0,
      next_retry_at: null,
      error: null,
      executed_at: null,
      scheduled_for: new Date().toISOString(),
    })
    .eq('id', actionId)
    .eq('status', 'dead_letter');

  if (error) {
    return NextResponse.json({ error: 'Failed to retry action', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Action reset to pending for retry' });
}
