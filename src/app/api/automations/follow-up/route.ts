import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import twilio from 'twilio';

const smsClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || ''
);

// Follow-up sequences for leads that haven't booked
// Called by Make.com on a schedule or Vercel cron (daily)
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
  // Build query — optionally filter by business
  let query = supabaseAdmin
    .from('leads')
    .select('id, org_id, name, email, phone, status, service_interest, created_at, businesses(name, booking_url)')
    .in('status', ['new', 'contacted'])
    .order('created_at', { ascending: true });

  if (orgId) {
    query = query.eq('org_id', orgId);
  }

  const { data: leads } = await query.limit(100);
  if (!leads) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const lead of leads as Record<string, unknown>[]) {
    const biz = lead.businesses as Record<string, string> | null;
    if (!biz) continue;

    const leadEmail = lead.email as string;
    const leadPhone = lead.phone as string;
    const leadName = (lead.name as string) || 'there';
    const bizName = biz.name || 'us';
    const bookingUrl = biz.booking_url || '';
    const service = (lead.service_interest as string) || 'our services';
    const leadId = lead.id as string;
    const orgIdVal = lead.org_id as string;

    // Check what follow-ups have already been sent
    const { data: existingFollowUps } = await supabaseAdmin
      .from('follow_ups')
      .select('step_number')
      .eq('lead_id', leadId)
      .order('step_number', { ascending: false })
      .limit(1);

    const lastStep = existingFollowUps?.[0]?.step_number || 0;
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(lead.created_at as string).getTime()) / (1000 * 60 * 60 * 24)
    );

    let smsContent = '';
    let emailHtml = '';
    let emailSubject = '';
    let stepNumber = 0;

    const bookingCta = bookingUrl
      ? `<p style="margin-top:20px"><a href="${bookingUrl}" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Book Your Appointment</a></p>`
      : '<p style="margin-top:16px">Just reply to this email and we\'ll get you booked in!</p>';

    // Follow-up schedule: Day 1, Day 3, Day 7
    if (lastStep === 0 && daysSinceCreated >= 1) {
      stepNumber = 1;
      smsContent = `Hi ${leadName}! Thanks for your interest in ${service} at ${bizName}. Would you like to book a consultation? ${bookingUrl || 'Reply YES and we\'ll get you sorted!'}`;
      emailSubject = `${bizName} — Still interested in ${service}?`;
      emailHtml = `<h2 style="color:#1f2937">Thanks for your interest!</h2>
        <p>Hi ${leadName},</p>
        <p>We noticed you recently enquired about <strong>${service}</strong> at <strong>${bizName}</strong>.</p>
        <p>We'd love to help you take the next step. You can book a consultation at a time that suits you:</p>
        ${bookingCta}
        <p style="margin-top:20px;color:#6b7280;font-size:14px">If you have any questions, just reply to this email — we're happy to help.</p>`;
    } else if (lastStep === 1 && daysSinceCreated >= 3) {
      stepNumber = 2;
      smsContent = `Hi ${leadName}, just checking in! We'd love to help you with ${service}. ${bookingUrl ? `Book your slot here: ${bookingUrl}` : 'Let us know if you have any questions!'}`;
      emailSubject = `${bizName} — A quick reminder about ${service}`;
      emailHtml = `<h2 style="color:#1f2937">Just checking in</h2>
        <p>Hi ${leadName},</p>
        <p>We wanted to follow up on your enquiry about <strong>${service}</strong>.</p>
        <p>Many of our clients tell us they wish they'd booked sooner! We have availability coming up and would love to see you:</p>
        ${bookingCta}
        <p style="margin-top:20px;color:#6b7280;font-size:14px">No pressure at all — we're here whenever you're ready.</p>`;
    } else if (lastStep === 2 && daysSinceCreated >= 7) {
      stepNumber = 3;
      smsContent = `Hi ${leadName}, this is our last follow-up about ${service} at ${bizName}. If you're still interested, we're here to help! ${bookingUrl || ''} Reply STOP to opt out.`;
      emailSubject = `${bizName} — Last chance to book ${service}`;
      emailHtml = `<h2 style="color:#1f2937">We don't want you to miss out</h2>
        <p>Hi ${leadName},</p>
        <p>This is our final follow-up about <strong>${service}</strong> at <strong>${bizName}</strong>.</p>
        <p>If the timing isn't right, no worries at all. But if you'd still like to book, we're here:</p>
        ${bookingCta}
        <p style="margin-top:20px;color:#6b7280;font-size:14px">We won't send any more follow-ups after this. Wishing you all the best!</p>`;
    }

    if (!stepNumber) continue;

    try {
      // Send via SMS
      if (leadPhone && smsContent) {
        await smsClient.messages.create({
          body: smsContent,
          from: process.env.TWILIO_PHONE_NUMBER || '',
          to: leadPhone,
        });
      }

      // Send via email
      if (leadEmail && emailHtml) {
        await sendEmail({
          to: leadEmail,
          subject: emailSubject,
          html: emailHtml,
        });
      }

      // Record follow-up
      await supabaseAdmin.from('follow_ups').insert({
        lead_id: leadId,
        org_id: orgIdVal,
        sequence_name: 'new_lead_nurture',
        step_number: stepNumber,
        channel: leadPhone ? 'sms' : 'email',
        message_content: smsContent,
        sent_at: new Date().toISOString(),
      });

      // Update lead status
      if (stepNumber === 3) {
        await supabaseAdmin.from('leads')
          .update({ status: 'cold' }).eq('id', leadId);
      } else {
        await supabaseAdmin.from('leads')
          .update({ status: 'contacted' }).eq('id', leadId);
      }

      sent++;
    } catch (err) {
      console.error(`Follow-up error for lead ${leadId}:`, err);
    }
  }

  return NextResponse.json({ sent });
}
