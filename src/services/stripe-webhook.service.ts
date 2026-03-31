import Stripe from 'stripe';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

const checkoutMetadataSchema = z.object({
  orgId: z.string().uuid(),
  plan: z.enum(['starter', 'growth', 'enterprise']).optional(),
});

export class StripeWebhookError extends Error {
  constructor(
    message:
      | 'STRIPE_NOT_CONFIGURED'
      | 'WEBHOOK_NOT_CONFIGURED'
      | 'INVALID_SIGNATURE'
      | 'EVENT_PROCESS_FAILED',
  ) {
    super(message);
    this.name = 'StripeWebhookError';
  }
}

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new StripeWebhookError('STRIPE_NOT_CONFIGURED');
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

function resolvePlanFromPriceId(priceId?: string | null): 'starter' | 'growth' | 'enterprise' {
  if (!priceId) {
    return 'starter';
  }

  if (priceId === process.env.STRIPE_GROWTH_PRICE_ID) {
    return 'growth';
  }

  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
    return 'enterprise';
  }

  return 'starter';
}

function constructEvent(rawBody: string, stripeSignature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new StripeWebhookError('WEBHOOK_NOT_CONFIGURED');
  }

  try {
    return getStripeClient().webhooks.constructEvent(rawBody, stripeSignature, webhookSecret);
  } catch {
    throw new StripeWebhookError('INVALID_SIGNATURE');
  }
}

async function updateOrganisationById(
  orgId: string,
  updates: {
    plan?: string;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
    active?: boolean;
  },
): Promise<void> {
  const { error } = await supabaseAdmin.from('businesses').update(updates).eq('id', orgId);

  if (error) {
    throw new StripeWebhookError('EVENT_PROCESS_FAILED');
  }
}

async function updateOrganisationBySubscriptionId(
  subscriptionId: string,
  updates: {
    plan?: string;
    stripe_subscription_id?: string | null;
    active?: boolean;
  },
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('businesses')
    .update(updates)
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    throw new StripeWebhookError('EVENT_PROCESS_FAILED');
  }
}

async function updateOrganisationByCustomerId(
  customerId: string,
  updates: {
    plan?: string;
    stripe_subscription_id?: string | null;
  },
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('businesses')
    .update(updates)
    .eq('stripe_customer_id', customerId);

  if (error) {
    throw new StripeWebhookError('EVENT_PROCESS_FAILED');
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const metadata = checkoutMetadataSchema.safeParse(session.metadata ?? {});
  if (!metadata.success) {
    return;
  }

  await updateOrganisationById(metadata.data.orgId, {
    plan: metadata.data.plan ?? 'starter',
    stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
    stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
    active: true,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
  const priceId = invoice.lines.data[0]?.price?.id ?? null;
  const resolvedPlan = resolvePlanFromPriceId(priceId);

  if (subscriptionId) {
    await updateOrganisationBySubscriptionId(subscriptionId, {
      plan: resolvedPlan,
      stripe_subscription_id: subscriptionId,
      active: true,
    });
    return;
  }

  if (customerId) {
    await updateOrganisationByCustomerId(customerId, {
      plan: resolvedPlan,
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const priceId = subscription.items.data[0]?.price.id;
  const resolvedPlan = resolvePlanFromPriceId(priceId);

  await updateOrganisationBySubscriptionId(subscription.id, {
    plan: resolvedPlan,
    stripe_subscription_id: subscription.id,
    active: true,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  await updateOrganisationBySubscriptionId(subscription.id, {
    plan: 'cancelled',
    stripe_subscription_id: subscription.id,
    active: false,
  });
}

async function processEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }
}

export async function handleStripeWebhook(input: {
  rawBody: string;
  stripeSignature: string;
}): Promise<void> {
  const event = constructEvent(input.rawBody, input.stripeSignature);
  await processEvent(event);
}
