import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendBookingConfirmation } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { payload } = await req.json();
  if (!payload) return NextResponse.json({ error: 'No payload' }, { status: 400 });

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

  // Fire Make.com webhook for appointment
  if (process.env.MAKE_APPOINTMENT_COMPLETED_WEBHOOK) {
    fetch(process.env.MAKE_APPOINTMENT_COMPLETED_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: businessId, lead_id: leadId, email, name, service,
        datetime: payload.startTime,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
