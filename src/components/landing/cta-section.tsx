'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import posthog from 'posthog-js';
import { FadeIn, MagneticButton } from '@/components/animations';

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://calendly.com/alex-zypflow/30min';

const PLANS_PREVIEW = [
  { name: 'Starter', price: '£297', suffix: '/mo', note: 'For solo practitioners' },
  { name: 'Growth', price: '£597', suffix: '/mo', note: 'Most popular', highlighted: true },
  { name: 'Scale', price: '£997', suffix: '/mo', note: 'Multi-location' },
];

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          className="relative overflow-hidden rounded-[36px] border border-[var(--app-card-border)] bg-gradient-to-br from-[var(--app-surface-strong)] via-[var(--app-surface)] to-[var(--app-surface-strong)] p-10 sm:p-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Decorative gradient orbs */}
          <div className="pointer-events-none absolute -right-[100px] -top-[100px] h-[300px] w-[300px] rounded-full bg-brand-purple/[0.08] blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-[80px] -left-[80px] h-[250px] w-[250px] rounded-full bg-teal-500/[0.06] blur-[80px]" />

          <div className="relative">
            <div className="text-center">
              <FadeIn>
                <p className="page-eyebrow">Start growing</p>
                <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
                  Ready to stop losing patients to{' '}
                  <span className="gradient-text">slow follow-up?</span>
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[var(--app-text-muted)]">
                  One audit. One clinic. One workflow pack. Real results in 14 days.
                </p>
              </FadeIn>
            </div>

            {/* Plan preview cards */}
            <FadeIn delay={0.15}>
              <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
                {PLANS_PREVIEW.map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative rounded-[20px] border p-5 text-center transition-all duration-300 ${
                      plan.highlighted
                        ? 'border-brand-purple/30 bg-brand-purple/[0.06] shadow-[0_0_30px_rgba(210,102,69,0.1)]'
                        : 'border-[var(--app-border)] bg-[var(--app-surface)]'
                    }`}
                  >
                    {plan.highlighted && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-purple px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                        Popular
                      </span>
                    )}
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--app-text-soft)]">
                      {plan.name}
                    </p>
                    <div className="mt-2 flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-semibold tabular-nums text-[var(--app-text)]">
                        {plan.price}
                      </span>
                      <span className="text-sm text-[var(--app-text-soft)]">{plan.suffix}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--app-text-muted)]">{plan.note}</p>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* CTAs */}
            <FadeIn delay={0.25}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <MagneticButton
                  as="a"
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => posthog.capture('cta_clicked', { cta: 'cta_book_audit', location: 'cta_section' })}
                  className="button-primary group gap-3 px-8 py-4"
                >
                  <span className="relative z-10">Book Your Free Audit</span>
                  <svg className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </MagneticButton>

                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-text-muted)] transition hover:text-brand-purple"
                >
                  Compare all plans
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </FadeIn>

            {/* Trust line */}
            <FadeIn delay={0.3}>
              <p className="mt-8 text-center text-xs text-[var(--app-text-soft)]">
                No long-term contracts &middot; Cancel anytime &middot; Results in the first week
              </p>
            </FadeIn>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
