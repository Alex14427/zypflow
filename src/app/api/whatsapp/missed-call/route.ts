import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { supabaseAdmin } from '@/lib/supabase';

const WHATSAPP_API = 'https://graph.facebook.com/v19.0';

// Missed call statuses that should trigger a WhatsApp auto-reply
const MISSED_CALL_STATUSES = ['no-answer', 'busy', 'failed'];

export async function POST(req: NextRequest) {
  // Parse form-encoded Twilio webhook body
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  const {
    CallStatus,
    From,
    To,
    Called,
  } = params;

  // Validate Twilio webhook signature
  const signature = req.headers.get('x-twilio-signature') || '';
  const url = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/whatsapp/missed-call`;

  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN || '',
    signature,
    url,
    params
  );

  if (!isValid) {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response/>',
      {
        status: 403,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  }

  // Only act on missed/unanswered/busy calls
  if (!MISSED_CALL_STATUSES.includes(CallStatus)) {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response/>',
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  // The number that was called — could be in "To" or "Called"
  const calledNumber = Called || To;
  // Normalise the caller's number for WhatsApp (E.164 without leading +)
  const callerNumber = From?.replace(/\s+/g, '');

  if (!callerNumber || !calledNumber) {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response/>',
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  try {
    // Look up the business by the Twilio phone number that was dialled
    // First try the env var override, then fall back to the businesses table
    const twilioPhoneNumber =
      process.env.TWILIO_PHONE_NUMBER || calledNumber;

    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('id, name, wa_phone_number_id, wa_access_token, twilio_phone_number')
      .or(
        `twilio_phone_number.eq.${calledNumber},twilio_phone_number.eq.${twilioPhoneNumber}`
      )
      .maybeSingle();

    if (bizError || !business) {
      console.error('[missed-call] Business not found for number:', calledNumber, bizError);
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response/>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    if (!business.wa_phone_number_id || !business.wa_access_token) {
      console.error('[missed-call] Business has no WhatsApp credentials:', business.id);
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response/>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Use a pre-approved template for first contact (required by Meta outside 24h window)
    // Falls back to text message if template fails (e.g. template not approved yet)
    const templatePayload = {
      messaging_product: 'whatsapp',
      to: callerNumber,
      type: 'template',
      template: {
        name: 'missed_call_reply',
        language: { code: 'en_GB' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: business.name }],
          },
        ],
      },
    };

    const textFallbackPayload = {
      messaging_product: 'whatsapp',
      to: callerNumber,
      type: 'text',
      text: {
        body: `Hi! Sorry we missed your call at ${business.name}. How can we help? Reply here and we'll get back to you shortly.`,
      },
    };

    // Try template first, fall back to text
    let waResponse = await fetch(
      `${WHATSAPP_API}/${business.wa_phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${business.wa_access_token}`,
        },
        body: JSON.stringify(templatePayload),
      }
    );

    if (!waResponse.ok) {
      console.info('[missed-call] Template failed, falling back to text message');
      waResponse = await fetch(
        `${WHATSAPP_API}/${business.wa_phone_number_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${business.wa_access_token}`,
          },
          body: JSON.stringify(textFallbackPayload),
        }
      );
    }

    if (!waResponse.ok) {
      const errBody = await waResponse.text();
      console.error('[missed-call] WhatsApp API error:', waResponse.status, errBody);
    } else {
      console.info(
        '[missed-call] WhatsApp reply sent',
        { orgId: business.id, to: callerNumber, callStatus: CallStatus }
      );
    }
  } catch (err) {
    console.error('[missed-call] Unexpected error:', err);
  }

  // Always return an empty TwiML response so Twilio doesn't play anything
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response/>',
    { headers: { 'Content-Type': 'text/xml' } }
  );
}
