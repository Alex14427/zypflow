import { NextRequest, NextResponse } from 'next/server';
import { calBookingWebhookSchema } from '@/lib/validators';
import {
  handleBookingCreatedWebhook,
  verifyCalWebhookSignature,
} from '@/services/booking.service';

export async function POST(req: NextRequest) {
  const calWebhookSecret = process.env.CAL_WEBHOOK_SECRET;

  if (process.env.NODE_ENV === 'production' && !calWebhookSecret) {
    console.error('CAL_WEBHOOK_SECRET must be configured in production.');
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 500 });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-cal-signature-256');

    const isValidSignature = verifyCalWebhookSignature({
      rawBody,
      signature,
      secret: calWebhookSecret,
    });

    if (!isValidSignature) {
      return NextResponse.json({ error: 'Unauthorized webhook signature' }, { status: 401 });
    }

    let jsonBody: unknown;
    try {
      jsonBody = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsed = calBookingWebhookSchema.safeParse(jsonBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid booking payload' }, { status: 400 });
    }

    await handleBookingCreatedWebhook({ payload: parsed.data.payload });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Booking created webhook failed:', error);
    return NextResponse.json({ error: 'Failed to process booking webhook' }, { status: 500 });
  }
}
