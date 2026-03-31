import { NextRequest, NextResponse } from 'next/server';
import { smsInputSchema } from '@/lib/validators';
import { sendSms, isSmsConfigurationError } from '@/services/sms.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedInput = smsInputSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const result = await sendSms(parsedInput.data);

    return NextResponse.json({ success: true, sid: result.sid }, { status: 200 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (isSmsConfigurationError(error)) {
      console.error('SMS configuration error:', error.message);
      return NextResponse.json({ error: 'SMS provider is not configured' }, { status: 500 });
    }

    console.error('Failed to send SMS:', error);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}
