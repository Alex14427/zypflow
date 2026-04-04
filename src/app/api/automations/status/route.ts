import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveRequestOrgAccess } from '@/lib/server-org-access';

export const dynamic = 'force-dynamic';

const orgIdSchema = z.string().uuid().optional();

// Returns automation health status for the dashboard
export async function GET(req: NextRequest) {
  const requestedOrgId = req.nextUrl.searchParams.get('orgId') ?? undefined;
  const parsedOrgId = orgIdSchema.safeParse(requestedOrgId);

  if (!parsedOrgId.success) {
    return NextResponse.json({ error: 'Invalid orgId' }, { status: 400 });
  }

  const access = await resolveRequestOrgAccess(req, {
    requestedOrgId: parsedOrgId.data,
    minimumRole: 'viewer',
  });
  if (access instanceof NextResponse) return access;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [followUpsRes, appointmentsRes, reviewsRes, leadsRes] = await Promise.all([
    supabaseAdmin
      .from('follow_ups')
      .select('id, sent_at, step_number', { count: 'exact' })
      .eq('org_id', access.orgId)
      .gte('sent_at', sevenDaysAgo.toISOString()),

    supabaseAdmin
      .from('appointments')
      .select('id, reminder_48h_sent, reminder_24h_sent, reminder_2h_sent, status')
      .eq('org_id', access.orgId)
      .eq('status', 'confirmed')
      .gte('datetime', now.toISOString()),

    supabaseAdmin
      .from('reviews')
      .select('id, requested_at, completed_at, rating', { count: 'exact' })
      .eq('org_id', access.orgId)
      .gte('requested_at', sevenDaysAgo.toISOString()),

    supabaseAdmin
      .from('leads')
      .select('id, status', { count: 'exact' })
      .eq('org_id', access.orgId)
      .in('status', ['new', 'contacted']),
  ]);

  const appointments = appointmentsRes.data || [];
  const reviews = reviewsRes.data || [];
  const pipelineLeads = leadsRes.count || 0;

  return NextResponse.json({
    followUps: {
      sentLast7Days: followUpsRes.count || 0,
      leadsInPipeline: pipelineLeads,
      status: (followUpsRes.count || 0) > 0 || pipelineLeads === 0 ? 'healthy' : 'warning',
    },
    reminders: {
      upcomingAppointments: appointments.length,
      remindersSent: appointments.filter(a => a.reminder_48h_sent || a.reminder_24h_sent || a.reminder_2h_sent).length,
      status: appointments.length === 0 ? 'idle' : 'healthy',
    },
    reviews: {
      requestedLast7Days: reviewsRes.count || 0,
      completedLast7Days: reviews.filter(r => r.completed_at).length,
      avgRating:
        reviews
          .filter(r => r.rating)
          .reduce((sum, r) => sum + (r.rating || 0), 0) /
        Math.max(reviews.filter(r => r.rating).length, 1),
      status: (reviewsRes.count || 0) > 0 ? 'healthy' : 'idle',
    },
  });
}
