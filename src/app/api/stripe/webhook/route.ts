import { NextRequest, NextResponse } from 'next/server';
import { handleStripeWebhook, StripeWebhookError } from '@/services/stripe-webhook.service';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const stripeSignature = req.headers.get('stripe-signature') ?? '';

    if (!stripeSignature) {
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }

    await handleStripeWebhook({ rawBody, stripeSignature });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    if (error instanceof StripeWebhookError) {
      if (error.message === 'INVALID_SIGNATURE') {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }

      if (
        error.message === 'STRIPE_NOT_CONFIGURED' ||
        error.message === 'WEBHOOK_NOT_CONFIGURED'
      ) {
        console.error('Stripe webhook configuration error:', error.message);
        return NextResponse.json({ error: 'Billing webhook is not configured' }, { status: 500 });
      }

      console.error('Stripe webhook business logic failed:', error.message);
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }

    console.error('Stripe webhook route failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
