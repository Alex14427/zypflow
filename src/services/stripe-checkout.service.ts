import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';

const PLAN_PRICE_ENV_MAP = {
  starter: 'STRIPE_STARTER_PRICE_ID',
  growth: 'STRIPE_GROWTH_PRICE_ID',
  enterprise: 'STRIPE_ENTERPRISE_PRICE_ID',
} as const;

export type CheckoutPlan = keyof typeof PLAN_PRICE_ENV_MAP;

export type CreateStripeCheckoutSessionInput = {
  plan: CheckoutPlan;
  orgId?: string;
  email?: string;
};

export type CreateStripeCheckoutSessionResult = {
  checkoutUrl: string;
  sessionId?: string;
};

export class StripeCheckoutError extends Error {
  constructor(
    message:
      | 'STRIPE_NOT_CONFIGURED'
      | 'PRICE_NOT_CONFIGURED'
      | 'APP_URL_NOT_CONFIGURED'
      | 'DUPLICATE_SUBSCRIPTION'
      | 'CHECKOUT_SESSION_CREATE_FAILED',
  ) {
    super(message);
    this.name = 'StripeCheckoutError';
  }
}

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new StripeCheckoutError('STRIPE_NOT_CONFIGURED');
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

function getPriceIdForPlan(plan: CheckoutPlan): string {
  const envVarName = PLAN_PRICE_ENV_MAP[plan];
  const priceId = process.env[envVarName];

  if (!priceId) {
    throw new StripeCheckoutError('PRICE_NOT_CONFIGURED');
  }

  return priceId;
}

function getAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new StripeCheckoutError('APP_URL_NOT_CONFIGURED');
  }

  return appUrl;
}

async function assertNoActiveSubscription(orgId: string): Promise<void> {
  const { data: organisation, error } = await supabaseAdmin
    .from('organisations')
    .select('plan, stripe_subscription_id')
    .eq('id', orgId)
    .maybeSingle();

  if (error) {
    throw new StripeCheckoutError('CHECKOUT_SESSION_CREATE_FAILED');
  }

  const hasActiveSubscription = Boolean(
    organisation?.stripe_subscription_id
      && organisation.plan
      && organisation.plan !== 'trial'
      && organisation.plan !== 'cancelled',
  );

  if (hasActiveSubscription) {
    throw new StripeCheckoutError('DUPLICATE_SUBSCRIPTION');
  }
}

export async function createStripeCheckoutSession({
  plan,
  orgId,
  email,
}: CreateStripeCheckoutSessionInput): Promise<CreateStripeCheckoutSessionResult> {
  const appUrl = getAppUrl();

  if (!orgId || !email) {
    return {
      checkoutUrl: `${appUrl}/signup?plan=${plan}`,
    };
  }

  await assertNoActiveSubscription(orgId);

  const priceId = getPriceIdForPlan(plan);

  try {
    const session = await getStripeClient().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { orgId, plan },
      automatic_tax: { enabled: true },
      subscription_data: { trial_period_days: 14 },
    });

    return {
      checkoutUrl: session.url ?? `${appUrl}/pricing`,
      sessionId: session.id,
    };
  } catch {
    throw new StripeCheckoutError('CHECKOUT_SESSION_CREATE_FAILED');
  }
}
