import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import twilio from 'twilio';

const smsClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || ''
);

// Follow-up sequences for leads that haven't booked
// Called by Make.com on a schedule (e.g. daily)
export async function POST(req: NextRequest) {
  const { businessId } = await req.json().catch(() => ({ businessId: null }));

  // Build query — optionally filter by business
  let query = supabaseAdmin
    .from('leads')
    .select('id, business_id, name, email, phone, status, service_interest, created_at, businesses(name, booking_url)')
    .in('status', ['new', 'contacted'])
    .order('created_at', { ascending: true });

  if (businessId) {
    query = query.eq('business_id', businessId);
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
    const businessIdVal = lead.business_id as string;

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

    let messageContent = '';
    let stepNumber = 0;

    // Follow-up schedule: Day 1, Day 3, Day 7
    if (lastStep === 0 && daysSinceCreated >= 1) {
      stepNumber = 1;
      messageContent = `Hi ${leadName}! Thanks for your interest in ${service} at ${bizName}. Would you like to book a consultation? ${bookingUrl ? bookingUrl : 'Reply YES and we\'ll get you sorted!'}`;
    } else if (lastStep === 1 && daysSinceCreated >= 3) {
      stepNumber = 2;
      messageContent = `Hi ${leadName}, just checking in! We'd love to help you with ${service}. ${bookingUrl ? `Book your slot here: ${bookingUrl}` : 'Let us know if you have any questions!'}`;
    } else if (lastStep === 2 && daysSinceCreated >= 7) {
      stepNumber = 3;
      messageContent = `Hi ${leadName}, this is our last follow-up about ${service} at ${bizName}. If you're still interested, we're here to help! ${bookingUrl ? bookingUrl : ''} Reply STOP to opt out.`;
    }

    if (!messageContent || !stepNumber) continue;

    try {
      // Send via SMS
      if (leadPhone) {
        await smsClient.messages.create({
          body: messageContent,
          from: process.env.TWILIO_PHONE_NUMBER || '',
          to: leadPhone,
        });
      }

      // Send via email
      if (leadEmail) {
        await sendEmail({
          to: leadEmail,
          subject: `${bizName} — Following up on ${service}`,
          html: `<p>${messageContent.replace(/\n/g, '<br>')}</p>`,
        });
      }

      // Record follow-up
      await supabaseAdmin.from('follow_ups').insert({
        lead_id: leadId,
        business_id: businessIdVal,
        sequence_name: 'new_lead_nurture',
        step_number: stepNumber,
        channel: leadPhone ? 'sms' : 'email',
        message_content: messageContent,
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
