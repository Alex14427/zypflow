import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;
      const { businessId, plan } = s.metadata || {};
      if (businessId) {
        await supabaseAdmin.from('businesses').update({
          plan,
          stripe_customer_id: s.customer as string,
          stripe_subscription_id: s.subscription as string,
        }).eq('id', businessId);

        const { data: biz } = await supabaseAdmin.from('businesses')
          .select('name, email').eq('id', businessId).single();
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
      await supabaseAdmin.from('businesses')
        .update({ plan }).eq('stripe_subscription_id', sub.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabaseAdmin.from('businesses')
        .update({ plan: 'cancelled', active: false })
        .eq('stripe_subscription_id', sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
