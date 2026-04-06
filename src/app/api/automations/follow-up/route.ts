import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { sendEmail } from '@/lib/email';
import { canUseSupabaseAdmin, isLocalSmokeMode } from '@/lib/local-mode';
import { captureException, captureMessage } from '@/lib/monitoring';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSms } from '@/services/sms.service';

export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;
  return runFollowUps(null);
}

export async function POST(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  const { orgId } = await req.json().catch(() => ({ orgId: null }));
  return runFollowUps(orgId);
}

async function runFollowUps(orgId: string | null) {
  const runId = randomUUID();

  if (isLocalSmokeMode() && !canUseSupabaseAdmin()) {
    return NextResponse.json({
      sent: 0,
      errors: 0,
      runId,
      reason: 'Local smoke mode is active and follow-up automation needs a real database.',
    });
  }

  let query = supabaseAdmin
    .from('leads')
    .select(
      'id, org_id, name, email, phone, status, service_interest, created_at, last_contact_at, businesses(name, booking_url)'
    )
    .in('status', ['new', 'contacted'])
    .order('created_at', { ascending: true });

  if (orgId) {
    query = query.eq('org_id', orgId);
  }

  const { data: leads, error: leadsError } = await query.limit(100);
  if (leadsError) {
    captureException(leadsError, {
      context: 'follow-up-load-leads',
      tags: { route: 'follow-up', runId },
      extra: { orgId },
    });
    return NextResponse.json({ error: 'Unable to load follow-up queue.' }, { status: 500 });
  }

  if (!leads) {
    return NextResponse.json({ sent: 0, errors: 0, runId });
  }

  let sent = 0;
  let errors = 0;

  for (const lead of leads as Record<string, unknown>[]) {
    const business = lead.businesses as Record<string, string> | null;
    if (!business) continue;

    const leadId = lead.id as string;
    const businessId = lead.org_id as string;
    const leadName = (lead.name as string) || 'there';
    const leadEmail = lead.email as string | null;
    const leadPhone = lead.phone as string | null;
    const service = (lead.service_interest as string) || 'our services';
    const businessName = business.name || 'our clinic';
    const bookingUrl = business.booking_url || '';

    const { data: existingFollowUps, error: historyError } = await supabaseAdmin
      .from('follow_ups')
      .select('step_number, sent_at')
      .eq('lead_id', leadId)
      .order('step_number', { ascending: false })
      .limit(1);

    if (historyError) {
      errors++;
      captureException(historyError, {
        context: 'follow-up-load-history',
        tags: { route: 'follow-up', leadId, runId },
        extra: { businessId },
      });
      continue;
    }

    const lastStep = existingFollowUps?.[0]?.step_number || 0;
    const lastSentAt = existingFollowUps?.[0]?.sent_at;

    // Duplicate prevention: skip if the last step was sent today
    if (lastSentAt) {
      const lastSentDate = new Date(lastSentAt as string).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      if (lastSentDate === today) continue;
    }

    const createdAt = new Date(lead.created_at as string);
    const lastContactAt = lead.last_contact_at ? new Date(lead.last_contact_at as string) : createdAt;
    const daysSinceCreated = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastTouch = Math.floor((Date.now() - lastContactAt.getTime()) / (1000 * 60 * 60 * 24));

    let stepNumber = 0;
    let smsContent = '';
    let emailSubject = '';
    let emailHtml = '';

    const bookingCta = bookingUrl
      ? `<p style="margin-top:20px"><a href="${bookingUrl}" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Book Your Appointment</a></p>`
      : '<p style="margin-top:16px">Just reply to this email and we will help you get booked in.</p>';

    if (lastStep === 0 && daysSinceCreated >= 1 && daysSinceLastTouch >= 1) {
      stepNumber = 1;
      smsContent = `Hi ${leadName}! Thanks for your interest in ${service} at ${businessName}. Would you like to book a consultation? ${bookingUrl || 'Reply YES and we will help you get sorted.'}`;
      emailSubject = `${businessName} - Still interested in ${service}?`;
      emailHtml = `<h2 style="color:#1f2937">Thanks for your interest</h2>
        <p>Hi ${leadName},</p>
        <p>We noticed you recently enquired about <strong>${service}</strong> at <strong>${businessName}</strong>.</p>
        <p>We would love to help you take the next step. You can book a consultation at a time that suits you:</p>
        ${bookingCta}
        <p style="margin-top:20px;color:#6b7280;font-size:14px">If you have any questions, just reply to this email and we will help.</p>`;
    } else if (lastStep === 1 && daysSinceLastTouch >= 2) {
      stepNumber = 2;
      smsContent = `Hi ${leadName}, just checking in. We would still love to help you with ${service}. ${bookingUrl ? `Book your slot here: ${bookingUrl}` : 'Let us know if you want help choosing the next step.'}`;
      emailSubject = `${businessName} - A quick reminder about ${service}`;
      emailHtml = `<h2 style="color:#1f2937">Just checking in</h2>
        <p>Hi ${leadName},</p>
        <p>We wanted to follow up on your enquiry about <strong>${service}</strong>.</p>
        <p>We still have availability coming up and would love to help you book the right appointment:</p>
        ${bookingCta}
        <p style="margin-top:20px;color:#6b7280;font-size:14px">No pressure. We are here whenever you are ready.</p>`;
    } else if (lastStep === 2 && daysSinceLastTouch >= 4) {
      stepNumber = 3;
      smsContent = `Hi ${leadName}, this is our last follow-up about ${service} at ${businessName}. If you are still interested, we are here to help. ${bookingUrl || ''} Reply STOP to opt out.`;
      emailSubject = `${businessName} - Last chance to book ${service}`;
      emailHtml = `<h2 style="color:#1f2937">We do not want you to miss out</h2>
        <p>Hi ${leadName},</p>
        <p>This is our final follow-up about <strong>${service}</strong> at <strong>${businessName}</strong>.</p>
        <p>If the timing is not right, no worries. But if you would still like to book, we are here:</p>
        ${bookingCta}
        <p style="margin-top:20px;color:#6b7280;font-size:14px">We will not send any more follow-ups after this.</p>`;
    }

    if (!stepNumber) continue;

    try {
      if (leadPhone && smsContent) {
        await sendSms({ body: smsContent, to: leadPhone });
      }

      if (leadEmail && emailHtml) {
        await sendEmail({ to: leadEmail, subject: emailSubject, html: emailHtml });
      }

      const sentAt = new Date().toISOString();
      const [{ error: insertError }, { error: leadError }] = await Promise.all([
        supabaseAdmin.from('follow_ups').insert({
          lead_id: leadId,
          org_id: businessId,
          business_id: businessId,
          sequence_name: 'new_lead_nurture',
          step_number: stepNumber,
          channel: leadPhone ? 'sms' : 'email',
          message_content: smsContent || emailSubject,
          sent_at: sentAt,
        }),
        supabaseAdmin
          .from('leads')
          .update({
            status: stepNumber === 3 ? 'cold' : 'contacted',
            last_contact_at: sentAt,
          })
          .eq('id', leadId),
      ]);

      if (insertError) throw insertError;
      if (leadError) throw leadError;

      captureMessage('Follow-up sent', {
        context: 'follow-up-sent',
        tags: { route: 'follow-up', leadId, stepNumber, runId },
        extra: { businessId, channel: leadPhone ? 'sms' : 'email' },
        level: 'info',
      });
      sent++;
    } catch (error) {
      errors++;
      captureException(error, {
        context: 'follow-up-send',
        tags: { route: 'follow-up', leadId, stepNumber, runId },
        extra: { businessId, channel: leadPhone ? 'sms' : 'email' },
      });
    }
  }

  return NextResponse.json({ sent, errors, runId });
}
