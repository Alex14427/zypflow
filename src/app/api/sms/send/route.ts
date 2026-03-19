import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req: NextRequest) {
  const { to, body } = await req.json();

  const message = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });

  return NextResponse.json({ success: true, sid: message.sid });
}
