import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  isValidTwilioWebhookSignature,
  parseTwilioFormData,
  persistIncomingSms,
  validateIncomingSmsPayload,
} from '@/services/sms-incoming.service';

const twimlResponseHeaders = { 'Content-Type': 'text/xml' };
const emptyTwiml = '<Response></Response>';

export async function POST(req: NextRequest) {
  try {
    const twilioSignature = req.headers.get('x-twilio-signature') ?? '';
    const formData = await req.formData();
    const params = parseTwilioFormData(formData);
    const webhookUrl = `${(process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin).replace(/\/$/, '')}/api/sms/incoming`;

    const isValidSignature = isValidTwilioWebhookSignature({
      twilioSignature,
      url: webhookUrl,
      params,
    });

    if (!isValidSignature) {
      console.error('Rejected incoming SMS webhook: invalid Twilio signature.');
      return new NextResponse('<Response><Message>Unauthorized</Message></Response>', {
        status: 403,
        headers: twimlResponseHeaders,
      });
    }

    const payload = validateIncomingSmsPayload(params);
    await persistIncomingSms(payload);

    return new NextResponse(emptyTwiml, { headers: twimlResponseHeaders });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Incoming SMS payload validation failed.', error.flatten());
      return new NextResponse(emptyTwiml, { status: 400, headers: twimlResponseHeaders });
    }

    console.error('Incoming SMS webhook failed.', error);
    return new NextResponse(emptyTwiml, { status: 500, headers: twimlResponseHeaders });
  }
}
