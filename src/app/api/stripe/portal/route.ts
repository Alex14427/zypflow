import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { getApiUser } from '@/lib/api-auth';

let _stripe: Stripe | null = null;
function getStripe() { if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing'); return _stripe; }

export async function POST(req: NextRequest) {
  const user = await getApiUser(req);
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get business with stripe customer ID
  const { data: biz } = await supabaseAdmin
    .from('businesses')
    .select('stripe_customer_id')
    .eq('email', user.email)
    .maybeSingle();

  if (!biz?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: biz.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  });

  return NextResponse.json({ url: session.url });
}
