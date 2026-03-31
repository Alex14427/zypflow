import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createStripeCheckoutSession,
  StripeCheckoutError,
} from '@/services/stripe-checkout.service';

const checkoutBodySchema = z.object({
  plan: z.enum(['starter', 'growth', 'enterprise']),
  orgId: z.string().uuid().optional(),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const result = await createStripeCheckoutSession(parsed.data);

    return NextResponse.json(
      {
        url: result.checkoutUrl,
        sessionId: result.sessionId,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof StripeCheckoutError) {
      if (error.message === 'DUPLICATE_SUBSCRIPTION') {
        return NextResponse.json(
          { error: 'You already have an active subscription. Manage billing in Settings.' },
          { status: 409 },
        );
      }

      if (
        error.message === 'STRIPE_NOT_CONFIGURED' ||
        error.message === 'PRICE_NOT_CONFIGURED' ||
        error.message === 'APP_URL_NOT_CONFIGURED'
      ) {
        console.error('Stripe checkout configuration error:', error.message);
        return NextResponse.json({ error: 'Billing is not configured' }, { status: 500 });
      }

      return NextResponse.json({ error: 'Unable to create checkout session' }, { status: 500 });
    }

    console.error('Stripe checkout route failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
