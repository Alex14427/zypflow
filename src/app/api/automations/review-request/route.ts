import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import twilio from 'twilio';

const smsClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || ''
);

// Called by Make.com after appointment is marked completed
// Sends a review request to the customer
export async function POST(req: NextRequest) {
  const { appointmentId } = await req.json();
  if (!appointmentId) {
    return NextResponse.json({ error: 'appointmentId required' }, { status: 400 });
  }

  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id, lead_id, business_id, service, leads(name, email, phone), businesses(name, google_review_link)')
    .eq('id', appointmentId)
    .maybeSingle();

  if (!appt) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  const lead = appt.leads as unknown as Record<string, string> | null;
  const biz = appt.businesses as unknown as Record<string, string> | null;
  if (!lead || !biz) {
    return NextResponse.json({ error: 'Lead or business not found' }, { status: 404 });
  }

  const reviewLink = biz.google_review_link || '#';
  const bizName = biz.name || 'our office';

  // Create review record
  await supabaseAdmin.from('reviews').insert({
    lead_id: appt.lead_id,
    business_id: appt.business_id,
    platform: 'google',
    requested_at: new Date().toISOString(),
  });

  // Send review request via SMS
  if (lead.phone) {
    await smsClient.messages.create({
      body: `Hi ${lead.name || 'there'}! Thank you for visiting ${bizName}. We'd love your feedback — it only takes 30 seconds: ${reviewLink} Reply STOP to opt out.`,
      from: process.env.TWILIO_PHONE_NUMBER || '',
      to: lead.phone,
    });
  }

  // Send review request via email
  if (lead.email) {
    await sendEmail({
      to: lead.email,
      subject: `How was your experience at ${bizName}?`,
      html: `<p>Hi ${lead.name || 'there'},</p>
       <p>Thank you for choosing <strong>${bizName}</strong>! We hope you had a great experience.</p>
       <p>We'd really appreciate it if you could leave us a quick review — it helps other customers find us:</p>
       <p><a href="${reviewLink}" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Leave a Review</a></p>
       <p>Thank you for your support!</p>`,
    });
  }

  return NextResponse.json({ success: true });
}
