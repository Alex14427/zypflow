import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import twilio from 'twilio';

const { validateRequest } = twilio;

export async function POST(req: NextRequest) {
  // Verify Twilio signature
  const twilioSignature = req.headers.get('x-twilio-signature') || '';
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/incoming`;

  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value as string;
  });

  // Validate the request is actually from Twilio
  if (authToken && !validateRequest(authToken, twilioSignature, webhookUrl, params)) {
    console.error('Invalid Twilio signature — rejecting webhook');
    return new NextResponse('<Response><Message>Unauthorized</Message></Response>', {
      status: 403,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  const from = params.From || null;
  const body = params.Body || null;

  if (!from || !body) {
    return new NextResponse('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Find existing lead by phone number
  const { data: lead } = await supabaseAdmin.from('leads')
    .select('id, org_id').eq('phone', from)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (lead) {
    const newMsg = { role: 'user', content: body, timestamp: new Date().toISOString(), channel: 'sms' };

    try {
      // Find existing SMS conversation
      const { data: conv } = await supabaseAdmin.from('conversations')
        .select('id, messages').eq('lead_id', lead.id).eq('channel', 'sms')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (conv) {
        await supabaseAdmin.from('conversations')
          .update({ messages: [...conv.messages, newMsg], updated_at: new Date().toISOString() })
          .eq('id', conv.id);
      } else {
        await supabaseAdmin.from('conversations')
          .insert({ lead_id: lead.id, org_id: lead.org_id, channel: 'sms', messages: [newMsg] });
      }
    } catch (err) {
      console.error('SMS conversation save error:', err);
    }

    // Handle STOP opt-out (TCPA/GDPR compliance)
    const upperBody = body.toUpperCase().trim();
    if (['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(upperBody)) {
      await supabaseAdmin.from('leads')
        .update({ status: 'lost', sms_opted_out: true }).eq('id', lead.id);
    }
  }

  // Twilio expects TwiML response
  return new NextResponse('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  });
}
