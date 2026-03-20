import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { smsInputSchema } from '@/lib/validators';
import { createClient } from '@supabase/supabase-js';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || ''
);

export async function POST(req: NextRequest) {
  // Verify the request comes from an authenticated dashboard user
  const supabaseRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.+?)\.supabase/)?.[1];
  const authCookie = req.cookies.get(`sb-${supabaseRef}-auth-token`)?.value;

  if (!authCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parsed = JSON.parse(authCookie);
    const accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const validationResult = smsInputSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      body: validationResult.data.body,
      from: process.env.TWILIO_PHONE_NUMBER || '',
      to: validationResult.data.to,
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (err) {
    console.error('Twilio send error:', err);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}
