import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSms } from '@/services/sms.service';
import { isLocalSmokeMode } from '@/lib/local-mode';

const AUTO_REVIEW_LOOKBACK_DAYS = 4;
const COMPLETED_APPOINTMENT_STATUSES = ['completed', 'attended'];

type AppointmentReviewRecord = {
  id: string;
  lead_id: string | null;
  org_id: string;
  service: string | null;
  datetime: string;
  satisfaction_score: number | null;
  leads: { name?: string | null; email?: string | null; phone?: string | null } | null;
  businesses: { name?: string | null; google_review_link?: string | null } | null;
};

export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  const now = new Date();
  const lookback = new Date(now);
  lookback.setDate(lookback.getDate() - AUTO_REVIEW_LOOKBACK_DAYS);

  const { data: appointments, error } = await supabaseAdmin
    .from('appointments')
    .select(
      'id, lead_id, org_id, service, datetime, satisfaction_score, leads(name, email, phone), businesses(name, google_review_link)'
    )
    .in('status', COMPLETED_APPOINTMENT_STATUSES)
    .gte('datetime', lookback.toISOString())
    .lte('datetime', now.toISOString())
    .order('datetime', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Auto review appointment lookup failed:', error);
    if (isLocalSmokeMode()) {
      return NextResponse.json({
        scanned: 0,
        sent: 0,
        skipped: 1,
        errors: [],
        reason: 'Local smoke mode is active and completed appointments are not available without a real database.',
      });
    }
    return NextResponse.json({ error: 'Failed to load completed appointments.' }, { status: 500 });
  }

  const results = {
    scanned: appointments?.length || 0,
    sent: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const appointment of (appointments || []) as AppointmentReviewRecord[]) {
    const outcome = await sendReviewRequestForAppointment(appointment, appointment.satisfaction_score);

    if (outcome.status === 'sent') {
      results.sent++;
    } else if (outcome.status === 'skipped') {
      results.skipped++;
    } else {
      results.errors.push(`${appointment.id}: ${outcome.reason}`);
    }
  }

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  const { appointmentId, satisfactionScore } = await req.json().catch(() => ({
    appointmentId: null,
    satisfactionScore: null,
  }));

  if (!appointmentId || typeof appointmentId !== 'string') {
    return NextResponse.json({ error: 'appointmentId required' }, { status: 400 });
  }

  const appointment = await fetchAppointmentForReview(appointmentId);
  if (!appointment) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  const outcome = await sendReviewRequestForAppointment(appointment, satisfactionScore);
  if (outcome.status === 'error') {
    return NextResponse.json({ error: outcome.reason }, { status: 500 });
  }

  return NextResponse.json({
    success: outcome.status === 'sent',
    skipped: outcome.status === 'skipped',
    reason: outcome.reason,
  });
}

async function fetchAppointmentForReview(appointmentId: string) {
  const { data: appointment } = await supabaseAdmin
    .from('appointments')
    .select(
      'id, lead_id, org_id, service, datetime, satisfaction_score, leads(name, email, phone), businesses(name, google_review_link)'
    )
    .eq('id', appointmentId)
    .maybeSingle();

  return appointment as AppointmentReviewRecord | null;
}

async function sendReviewRequestForAppointment(
  appointment: AppointmentReviewRecord,
  satisfactionScoreOverride?: unknown
) {
  const score =
    typeof satisfactionScoreOverride === 'number'
      ? satisfactionScoreOverride
      : typeof appointment.satisfaction_score === 'number'
        ? appointment.satisfaction_score
        : 5;

  if (score < 4) {
    return { status: 'skipped' as const, reason: 'Satisfaction score below threshold' };
  }

  if (!appointment.lead_id) {
    return { status: 'error' as const, reason: 'Appointment is missing a lead reference' };
  }

  const lead = appointment.leads;
  const business = appointment.businesses;

  if (!lead || !business) {
    return { status: 'error' as const, reason: 'Lead or business details missing' };
  }

  const reviewLink = business.google_review_link || '';
  if (!reviewLink) {
    return { status: 'skipped' as const, reason: 'No review link configured' };
  }

  if (!lead.phone && !lead.email) {
    return { status: 'skipped' as const, reason: 'No contact channel available' };
  }

  const alreadyRequested = await hasRecentReviewRequest(
    appointment.lead_id,
    appointment.org_id,
    appointment.datetime
  );
  if (alreadyRequested) {
    return { status: 'skipped' as const, reason: 'Review request already sent for this visit window' };
  }

  const leadName = lead.name || 'there';
  const businessName = business.name || 'our office';

  try {
    await supabaseAdmin.from('reviews').insert({
      lead_id: appointment.lead_id,
      org_id: appointment.org_id,
      platform: 'google',
      requested_at: new Date().toISOString(),
    });

    if (lead.phone) {
      await sendSms({
        body: `Hi ${leadName}! Thanks for visiting ${businessName}. We would love your feedback: ${reviewLink} Reply STOP to opt out.`,
        to: lead.phone,
      });
    }

    if (lead.email) {
      await sendEmail({
        to: lead.email,
        subject: `How was your experience at ${businessName}?`,
        html: `<h2 style="color:#1f2937">We would love your feedback!</h2>
         <p>Hi ${leadName},</p>
         <p>Thank you for choosing <strong>${businessName}</strong>. We hope your visit went brilliantly.</p>
         <p>If you have 30 seconds, we would really appreciate a quick Google review:</p>
         <p style="margin:24px 0"><a href="${reviewLink}" style="display:inline-block;background:#6c3cff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">Leave a review</a></p>
         <p style="color:#6b7280;font-size:14px">Your feedback helps future patients feel confident booking with you.</p>`,
      });
    }

    return { status: 'sent' as const, reason: 'Review request sent' };
  } catch (error) {
    console.error(`Review request failed for appointment ${appointment.id}:`, error);
    return { status: 'error' as const, reason: String(error) };
  }
}

async function hasRecentReviewRequest(leadId: string, orgId: string, appointmentDateTime: string) {
  const visitWindowStart = new Date(appointmentDateTime);
  visitWindowStart.setHours(visitWindowStart.getHours() - 12);

  const { data } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('lead_id', leadId)
    .eq('org_id', orgId)
    .gte('requested_at', visitWindowStart.toISOString())
    .limit(1);

  return Boolean(data && data.length > 0);
}
