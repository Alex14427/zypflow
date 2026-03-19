import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { smsInputSchema } from '@/lib/validators';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || ''
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = smsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      body: parsed.data.body,
      from: process.env.TWILIO_PHONE_NUMBER || '',
      to: parsed.data.to,
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (err) {
    console.error('Twilio send error:', err);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}
