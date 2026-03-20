import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

let _stripe: Stripe | null = null;
function getStripe() { if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing'); return _stripe; }

export async function POST() {
  // Get the authenticated user
  const cookieStore = cookies();
  const supabaseRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.+?)\.supabase/)?.[1];
  const authCookie = cookieStore.get(`sb-${supabaseRef}-auth-token`)?.value;

  if (!authCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let email: string | undefined;
  try {
    const parsed = JSON.parse(authCookie);
    const accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token;
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser(accessToken);
    email = user?.email;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get business with stripe customer ID
  const { data: biz } = await supabaseAdmin
    .from('businesses')
    .select('stripe_customer_id')
    .eq('email', email)
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
