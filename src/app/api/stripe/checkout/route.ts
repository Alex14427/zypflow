import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const PRICES: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || '',
  growth: process.env.STRIPE_GROWTH_PRICE_ID || '',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
};

export async function POST(req: NextRequest) {
  const { plan, businessId, email } = await req.json();

  if (!PRICES[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // If no businessId/email, redirect to signup with plan preselected
  if (!businessId || !email) {
    return NextResponse.json({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?plan=${plan}`,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: PRICES[plan], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { businessId, plan },
    automatic_tax: { enabled: true },
    subscription_data: {
      trial_period_days: 14,
    },
  });

  return NextResponse.json({ url: session.url });
}
