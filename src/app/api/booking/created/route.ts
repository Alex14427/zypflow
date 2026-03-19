import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { payload } = await req.json();
  if (!payload) return NextResponse.json({ error: 'No payload' }, { status: 400 });

  const email = payload.attendees?.[0]?.email;
  const name = payload.attendees?.[0]?.name;
  const businessId = payload.metadata?.businessId;

  if (!businessId) return NextResponse.json({ error: 'No businessId' }, { status: 400 });

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

  await supabaseAdmin.from('appointments').insert({
    business_id: businessId,
    lead_id: leadId,
    service: payload.title || 'Consultation',
    datetime: payload.startTime,
    duration_minutes: Math.round(
      (new Date(payload.endTime).getTime() - new Date(payload.startTime).getTime()) / 60000
    ),
  });

  return NextResponse.json({ success: true });
}
