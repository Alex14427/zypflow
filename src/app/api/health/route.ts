import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};

  // Check Supabase connection
  try {
    const { error } = await supabaseAdmin.from('businesses').select('id').limit(1);
    checks.database = error ? 'unhealthy' : 'healthy';
  } catch {
    checks.database = 'unhealthy';
  }

  // Check env vars
  checks.stripe = process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing';
  checks.resend = process.env.RESEND_API_KEY ? 'configured' : 'missing';
  checks.twilio = process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'missing';
  checks.openai = process.env.OPENAI_API_KEY ? 'configured' : 'missing';

  const healthy = checks.database === 'healthy';

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
