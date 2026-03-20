import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendBookingConfirmation } from '@/lib/email';
import { fireWebhook } from '@/lib/webhook';

export async function POST(req: NextRequest) {
  // Verify Cal.com webhook signature if secret is configured
  const calSecret = process.env.CAL_WEBHOOK_SECRET;
  if (calSecret) {
    const signature = req.headers.get('x-cal-signature-256');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
    const body = await req.text();
    const crypto = await import('crypto');
    const expected = crypto.createHmac('sha256', calSecret).update(body).digest('hex');
    if (signature !== expected) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    // Parse the verified body
    const { payload } = JSON.parse(body);
    if (!payload) return NextResponse.json({ error: 'No payload' }, { status: 400 });
    return handleBooking(payload);
  }

  const { payload } = await req.json();
  if (!payload) return NextResponse.json({ error: 'No payload' }, { status: 400 });
  return handleBooking(payload);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleBooking(payload: any) {
  const email = payload.attendees?.[0]?.email;
  const name = payload.attendees?.[0]?.name;
  const businessId = payload.metadata?.businessId;

  if (!businessId) return NextResponse.json({ error: 'No businessId' }, { status: 400 });

  // Get business name for confirmation email
  const { data: biz } = await supabaseAdmin.from('businesses')
    .select('name').eq('id', businessId).single();

  let leadId = null;
  if (email) {
    const { data: existing } = await supabaseAdmin.from('leads')
      .select('id').eq('business_id', businessId).eq('email', email).limit(1).maybeSingle();

    if (existing) {
      leadId = existing.id;
      await supabaseAdmin.from('leads').update({ status: 'booked' }).eq('id', leadId);
    } else {
      const { data: newLead } = await supabaseAdmin.from('leads')
        .insert({
          business_id: businessId, name, email,
          source: 'booking', status: 'booked', score: 85,
        })
        .select('id').single();
      leadId = newLead?.id;
    }
  }

  const service = payload.title || 'Consultation';
  const startTime = new Date(payload.startTime);

  await supabaseAdmin.from('appointments').insert({
    business_id: businessId,
    lead_id: leadId,
    service,
    datetime: payload.startTime,
    duration_minutes: Math.round(
      (new Date(payload.endTime).getTime() - startTime.getTime()) / 60000
    ),
    status: 'confirmed',
  });

  // Send booking confirmation email
  if (email && name) {
    await sendBookingConfirmation(email, name, service, startTime, biz?.name || 'our office');
  }

  // Fire Make.com webhook for appointment (with retry)
  if (process.env.MAKE_APPOINTMENT_COMPLETED_WEBHOOK) {
    fireWebhook(
      process.env.MAKE_APPOINTMENT_COMPLETED_WEBHOOK,
      { business_id: businessId, lead_id: leadId, email, name, service, datetime: payload.startTime },
      'make_appointment_completed'
    ).catch(() => {}); // fire and forget — retries happen inside fireWebhook
  }

  return NextResponse.json({ success: true });
}
