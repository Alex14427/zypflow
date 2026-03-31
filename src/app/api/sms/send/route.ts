import { NextRequest, NextResponse } from 'next/server';
import { smsInputSchema } from '@/lib/validators';
import { getApiUser } from '@/lib/api-auth';
import { sendSms } from '@/services/sms.service';

export async function POST(req: NextRequest) {
  const user = await getApiUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validationResult = smsInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const result = await sendSms(validationResult.data);

    return NextResponse.json({ success: true, sid: result.sid }, { status: 200 });
  } catch (err) {
    console.error('SMS send error:', err);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}
