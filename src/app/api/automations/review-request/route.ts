import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import twilio from 'twilio';

const smsClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || ''
);

// Called by Make.com after appointment is marked completed
// Sends a review request to the customer
export async function POST(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  const { appointmentId, satisfactionScore } = await req.json();
  if (!appointmentId) {
    return NextResponse.json({ error: 'appointmentId required' }, { status: 400 });
  }

  // Only request reviews from satisfied customers (score >= 4 out of 5)
  const score = typeof satisfactionScore === 'number' ? satisfactionScore : 5;
  if (score < 4) {
    return NextResponse.json({ skipped: true, reason: 'Satisfaction score below threshold' });
  }

  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id, lead_id, org_id, service, leads(name, email, phone), businesses(name, google_review_link)')
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
    org_id: appt.org_id,
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
      html: `<h2 style="color:#1f2937">We'd love your feedback!</h2>
       <p>Hi ${lead.name || 'there'},</p>
       <p>Thank you for choosing <strong>${bizName}</strong>! We hope you had a great experience.</p>
       <p>We'd really appreciate it if you could leave us a quick Google review — it only takes 30 seconds and helps other customers find us:</p>
       <p style="margin:24px 0"><a href="${reviewLink}" style="display:inline-block;background:#6c3cff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">⭐ Leave a Review</a></p>
       <p style="color:#6b7280;font-size:14px">Your feedback means the world to us. Thank you for your support!</p>`,
    });
  }

  return NextResponse.json({ success: true });
}
