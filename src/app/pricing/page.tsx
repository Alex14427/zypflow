'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const PLANS = [
  {
    name: 'Starter',
    price: '149',
    key: 'starter',
    description: 'Perfect for solo practitioners',
    features: [
      'AI chat widget',
      'Up to 100 leads/month',
      'SMS & email follow-ups',
      'Appointment reminders',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Growth',
    price: '299',
    key: 'growth',
    popular: true,
    description: 'For growing practices',
    features: [
      'Everything in Starter',
      'Unlimited leads',
      'Google review automation',
      'Lead scoring',
      'Advanced analytics',
      'Priority support',
      'Custom AI personality',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Scale',
    price: '499',
    key: 'enterprise',
    description: 'For multi-location businesses',
    features: [
      'Everything in Growth',
      'Multiple locations',
      'Dedicated account manager',
      'Custom integrations',
      'White-label widget',
      'API access',
      'SLA guarantee',
    ],
    cta: 'Start Free Trial',
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ orgId: string; email: string } | null>(null);

  // Auto-detect logged-in user for seamless upgrade
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase.from('businesses').select('id, plan, stripe_subscription_id').eq('email', user.email).maybeSingle();
      if (biz) {
        setUserInfo({ orgId: biz.id, email: user.email! });
        if (biz.stripe_subscription_id && biz.plan !== 'trial' && biz.plan !== 'cancelled') {
          setCurrentPlan(biz.plan);
        }
      }
    }
    checkUser();
  }, []);

  async function handleCheckout(plan: string) {
    setError(null);
    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          orgId: userInfo?.orgId,
          email: userInfo?.email,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-brand-purple">Zyp</span>flow
          </Link>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2">Log In</Link>
            <Link href="/signup" className="bg-brand-purple text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-brand-purple-dark transition">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-gray-600">Start your 14-day free trial. No credit card required.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map(plan => (
            <div
              key={plan.key}
              className={`bg-white rounded-2xl shadow-sm border p-8 relative ${
                plan.popular ? 'border-brand-purple ring-2 ring-brand-purple/20' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-purple text-white text-xs px-3 py-1 rounded-full font-medium">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold">&pound;{plan.price}</span>
                <span className="text-gray-500">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => currentPlan ? window.location.href = '/dashboard/settings' : handleCheckout(plan.key)}
                disabled={loading === plan.key || currentPlan === plan.key}
                className={`w-full py-3 rounded-lg font-semibold transition disabled:opacity-50 ${
                  plan.popular
                    ? 'bg-brand-purple text-white hover:bg-brand-purple-dark'
                    : 'border-2 border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white'
                }`}
              >
                {currentPlan === plan.key ? 'Current Plan' : loading === plan.key ? 'Redirecting...' : currentPlan ? 'Switch Plan' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          All plans include a 14-day free trial. Cancel anytime. VAT may apply.
        </p>
      </div>
    </div>
  );
}
