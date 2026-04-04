import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getApiUser } from '@/lib/api-auth';
import { resolveServerBusinessForUser } from '@/lib/server-current-business';

let _stripe: Stripe | null = null;
function getStripe() { if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing'); return _stripe; }

export async function POST(req: NextRequest) {
  const user = await getApiUser(req);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const current = await resolveServerBusinessForUser(user);
  const biz = current?.business ?? null;

  if (!biz?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: biz.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  });

  return NextResponse.json({ url: session.url });
}
