import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const from = formData.get('From') as string;
  const body = formData.get('Body') as string;

  // Find existing lead by phone number
  const { data: lead } = await supabaseAdmin.from('leads')
    .select('id, business_id').eq('phone', from)
    .order('created_at', { ascending: false }).limit(1).single();

  if (lead) {
    const newMsg = { role: 'user', content: body, timestamp: new Date().toISOString() };

    // Find existing SMS conversation
    const { data: conv } = await supabaseAdmin.from('conversations')
      .select('id, messages').eq('lead_id', lead.id).eq('channel', 'sms')
      .order('created_at', { ascending: false }).limit(1).single();

    if (conv) {
      await supabaseAdmin.from('conversations')
        .update({ messages: [...conv.messages, newMsg], updated_at: new Date().toISOString() })
        .eq('id', conv.id);
    } else {
      await supabaseAdmin.from('conversations')
        .insert({ lead_id: lead.id, business_id: lead.business_id, channel: 'sms', messages: [newMsg] });
    }

    // Handle STOP opt-out
    if (body.toUpperCase().includes('STOP')) {
      await supabaseAdmin.from('leads')
        .update({ status: 'lost', notes: 'Opted out via SMS' }).eq('id', lead.id);
    }
  }

  // Twilio expects TwiML response
  return new NextResponse('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  });
}
