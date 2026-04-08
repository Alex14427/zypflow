'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FadeIn, MagneticButton } from '@/components/animations';
import { FaqSection } from '@/components/landing/faq-section';

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://calendly.com/alex-zypflow/30min';

const PLANS = [
  {
    name: 'Starter',
    price: 297,
    annual: 249,
    tagline: 'For clinics ready to stop missing leads',
    highlight: false,
    features: [
      'Automated lead reply (web + email)',
      'Appointment reminders (email)',
      'Basic review request automation',
      '500 automated messages/month',
      '1 user, 1 location',
      'Email support',
    ],
    cta: 'Start Free Audit',
  },
  {
    name: 'Growth',
    price: 597,
    annual: 497,
    tagline: 'Full revenue system for ambitious clinics',
    highlight: true,
    badge: 'Most popular',
    features: [
      'Everything in Starter, plus:',
      'Multi-channel reply (SMS + WhatsApp + web)',
      'Smart reminder sequences (SMS + email)',
      'Review requests + rebooking automation',
      'Weekly ROI reporting dashboard',
      '2,500 automated messages/month',
      '3 users, 1 location',
      'Priority support',
    ],
    cta: 'Start Free Audit',
  },
  {
    name: 'Scale',
    price: 997,
    annual: 847,
    tagline: 'Founder-led deployment with white-glove setup',
    highlight: false,
    features: [
      'Everything in Growth, plus:',
      'Founder-led audit and launch planning',
      'AI-powered conversation handling',
      'Custom workflow design',
      'Unlimited messages',
      'Unlimited users, up to 3 locations',
      'Dedicated success manager',
      'Weekly strategy calls',
    ],
    cta: 'Book Strategy Call',
  },
];

const TRACKED = [
  'Reply speed from first enquiry',
  'Booked consult volume',
  'Reminder coverage and no-show risk',
  'Review request completion',
  'Patient return and rebooking signals',
  'Clinic health and churn risk',
];

const LAUNCH_PATH = [
  { step: '01', title: 'Audit', body: 'We scan your public presence and pinpoint where booking intent is leaking.' },
  { step: '02', title: 'Activate', body: 'Approve fit, collect onboarding details, and activate your workspace.' },
  { step: '03', title: 'Deploy', body: 'Launch your workflow pack, brand the workspace, verify first flows.' },
  { step: '04', title: 'Prove', body: 'Report weekly on speed, bookings, reviews, and patient return.' },
];

interface PricingContentProps {
  faqs: Array<{ question: string; answer: string }>;
}

export function PricingContent({ faqs }: PricingContentProps) {
  const [annual, setAnnual] = useState(false);

  return (
    <main>
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <FadeIn>
            <div className="text-center">
              <div className="flex justify-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-purple/20 bg-brand-purple/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-purple">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-purple animate-pulse" />
                  Simple pricing
                </span>
              </div>
              <h1 className="mt-8 text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-[var(--app-text)]">
                Invest in growth,{' '}
                <span className="gradient-text">not more admin.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[var(--app-text-muted)]">
                The average clinic loses over &pound;3,000/month to slow replies and missed follow-ups. Zypflow pays for itself with just 2 extra bookings per week.
              </p>
            </div>
          </FadeIn>

          {/* Billing toggle */}
          <FadeIn delay={0.15}>
            <div className="mt-10 flex items-center justify-center gap-3">
              <span className={`text-sm font-medium ${!annual ? 'text-[var(--app-text)]' : 'text-[var(--app-text-soft)]'}`}>Monthly</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative h-7 w-12 rounded-full transition-colors ${annual ? 'bg-brand-purple' : 'bg-[var(--app-border)]'}`}
                aria-label="Toggle annual billing"
              >
                <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
              <span className={`text-sm font-medium ${annual ? 'text-[var(--app-text)]' : 'text-[var(--app-text-soft)]'}`}>
                Annual <span className="text-emerald-500 text-xs font-semibold">Save 15%</span>
              </span>
            </div>
          </FadeIn>

          {/* Pricing cards */}
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan, i) => (
              <FadeIn key={plan.name} delay={0.1 * i}>
                <motion.div
                  className={`relative flex flex-col rounded-[32px] border p-8 transition-all duration-300 ${
                    plan.highlight
                      ? 'border-brand-purple/30 bg-[var(--app-surface-strong)] shadow-[0_20px_60px_rgba(210,102,69,0.15)]'
                      : 'border-[var(--app-border)] bg-[var(--app-surface-strong)]'
                  }`}
                  whileHover={{ y: -4 }}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-dark px-4 py-1 text-xs font-semibold text-white">
                      {plan.badge}
                    </div>
                  )}

                  <p className="text-sm font-semibold uppercase tracking-[0.15em] text-brand-purple">{plan.name}</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-5xl font-semibold tabular-nums tracking-tight text-[var(--app-text)]">
                      &pound;{annual ? plan.annual : plan.price}
                    </span>
                    <span className="mb-2 text-sm text-[var(--app-text-soft)]">/mo</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--app-text-muted)]">{plan.tagline}</p>

                  <div className="mt-8 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex gap-3 text-sm">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[var(--app-text-muted)]">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <MagneticButton
                    as="a"
                    href={BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-brand-purple to-brand-purple-dark text-white shadow-[0_12px_24px_rgba(210,102,69,0.25)]'
                        : 'border border-[var(--app-border)] text-[var(--app-text)] hover:border-brand-purple/30 hover:bg-brand-purple/[0.06]'
                    }`}
                  >
                    {plan.cta}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </MagneticButton>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          {/* Value anchor */}
          <FadeIn delay={0.3}>
            <div className="mt-12 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-center">
              <p className="text-sm text-[var(--app-text-muted)]">
                <strong className="text-[var(--app-text)]">Your clinic software manages your diary.</strong>{' '}
                Zypflow fills it. Replaces &pound;2,400/mo of manual admin — pays for itself with 2 extra bookings per week.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Launch path */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <FadeIn>
            <div className="text-center">
              <p className="page-eyebrow">Launch path</p>
              <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
                Live in 14 days.{' '}
                <span className="text-[var(--app-text-muted)]">Proving value from week one.</span>
              </h2>
            </div>
          </FadeIn>

          <div className="relative mx-auto mt-16 max-w-3xl">
            <div className="absolute bottom-0 left-8 top-0 w-px bg-gradient-to-b from-brand-purple/30 via-brand-purple/10 to-transparent sm:left-10" />
            <div className="space-y-2">
              {LAUNCH_PATH.map((item, i) => (
                <FadeIn key={item.step} delay={0.12 * i} distance={25}>
                  <motion.div
                    className="group relative flex gap-6 rounded-[24px] p-6 transition-all hover:bg-[var(--app-surface-strong)] sm:gap-8"
                    whileHover={{ x: 6 }}
                  >
                    <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-lg font-semibold text-brand-purple transition group-hover:border-brand-purple/30 group-hover:bg-brand-purple/10 sm:h-20 sm:w-20">
                      {item.step}
                    </div>
                    <div className="pt-2">
                      <h3 className="text-xl font-semibold text-[var(--app-text)] sm:text-2xl">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">{item.body}</p>
                    </div>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Weekly tracked metrics */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <FadeIn>
            <div className="text-center">
              <p className="page-eyebrow">Weekly proof</p>
              <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
                What we measure{' '}
                <span className="gradient-text">every week.</span>
              </h2>
            </div>
          </FadeIn>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRACKED.map((item, i) => (
              <FadeIn key={item} delay={0.08 * i}>
                <motion.div
                  className="group rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-6 transition-all duration-300"
                  whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.06)', borderColor: 'rgba(210, 102, 69, 0.2)' }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple transition-colors group-hover:bg-brand-purple/20">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[var(--app-text)]">{item}</p>
                  <p className="mt-1 text-xs text-[var(--app-text-soft)]">Reported weekly</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <FaqSection faqs={faqs} />
    </main>
  );
}
