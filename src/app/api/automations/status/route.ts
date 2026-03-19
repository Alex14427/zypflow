import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Returns automation health status for the dashboard
// Checks whether follow-ups, reminders, and reviews are firing correctly
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');
  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [followUpsRes, appointmentsRes, reviewsRes, leadsRes] = await Promise.all([
    // Recent follow-ups sent (column is sent_at, not created_at)
    supabaseAdmin
      .from('follow_ups')
      .select('id, sent_at, step_number', { count: 'exact' })
      .eq('business_id', businessId)
      .gte('sent_at', sevenDaysAgo.toISOString()),

    // Upcoming confirmed appointments (to check if reminders are working)
    supabaseAdmin
      .from('appointments')
      .select('id, reminder_48h_sent, reminder_24h_sent, reminder_2h_sent, status')
      .eq('business_id', businessId)
      .eq('status', 'confirmed')
      .gte('datetime', now.toISOString()),

    // Recent review requests
    supabaseAdmin
      .from('reviews')
      .select('id, requested_at, completed_at, rating', { count: 'exact' })
      .eq('business_id', businessId)
      .gte('requested_at', sevenDaysAgo.toISOString()),

    // Leads in follow-up pipeline
    supabaseAdmin
      .from('leads')
      .select('id, status', { count: 'exact' })
      .eq('business_id', businessId)
      .in('status', ['new', 'contacted']),
  ]);

  const followUps = followUpsRes.data || [];
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
      avgRating: reviews.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / Math.max(reviews.filter(r => r.rating).length, 1),
      status: (reviewsRes.count || 0) > 0 ? 'healthy' : 'idle',
    },
  });
}
