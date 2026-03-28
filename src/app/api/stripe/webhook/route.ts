import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWelcomeEmail, sendPaymentFailedEmail, sendTrialEndingEmail } from '@/lib/email';

let _stripe: Stripe | null = null;
function getStripe() { if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing'); return _stripe; }

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 });
  }

  // Idempotency check — prevent processing duplicate webhook events
  const eventId = event.id;
  const { data: existingEvent } = await supabaseAdmin
    .from('stripe_webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Record event to prevent future duplicates (best-effort, table may not exist yet)
  try {
    await supabaseAdmin.from('stripe_webhook_events').insert({ event_id: eventId, event_type: event.type });
  } catch {
    // Table may not exist yet — ignore
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;
      const { orgId, plan } = s.metadata || {};
      if (orgId) {
        await supabaseAdmin.from('organisations').update({
          plan,
          stripe_customer_id: s.customer as string,
          stripe_subscription_id: s.subscription as string,
        }).eq('id', orgId);

        const { data: biz } = await supabaseAdmin.from('organisations')
          .select('name, email').eq('id', orgId).single();
        if (biz) await sendWelcomeEmail(biz.email, biz.name, plan || 'starter');
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      let plan = 'starter';
      if (priceId === process.env.STRIPE_GROWTH_PRICE_ID) plan = 'growth';
      if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) plan = 'enterprise';
      await supabaseAdmin.from('organisations')
        .update({ plan }).eq('stripe_subscription_id', sub.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabaseAdmin.from('organisations')
        .update({ plan: 'cancelled', active: false })
        .eq('stripe_subscription_id', sub.id);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      if (customerId) {
        const { data: biz } = await supabaseAdmin.from('organisations')
          .select('name, email').eq('stripe_customer_id', customerId).maybeSingle();
        if (biz?.email) {
          await sendPaymentFailedEmail(biz.email, biz.name);
        }
      }
      break;
    }

    case 'customer.subscription.trial_will_end': {
      const sub = event.data.object as Stripe.Subscription;
      const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
      const daysLeft = trialEnd
        ? Math.max(1, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 3;

      const { data: biz } = await supabaseAdmin.from('organisations')
        .select('name, email').eq('stripe_subscription_id', sub.id).maybeSingle();
      if (biz?.email) {
        await sendTrialEndingEmail(biz.email, biz.name, daysLeft);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
