'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FadeIn, MagneticButton } from '@/components/animations';
import { formatCurrencyGBP } from '@/lib/formatting';

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://calendly.com/alex-zypflow/30min';

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
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

          <div className="relative grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <FadeIn>
                <p className="page-eyebrow">Founding pilot</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
                  Ready to stop losing patients to{' '}
                  <span className="gradient-text">slow follow-up?</span>
                </h2>
                <p className="mt-5 text-lg leading-8 text-[var(--app-text-muted)]">
                  One audit. One clinic. One workflow pack. Real results in 14 days.
                </p>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <MagneticButton
                    as="a"
                    href={BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
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
                    Review commercial terms
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.3} direction="left">
              <div className="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-7">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-semibold tabular-nums text-[var(--app-text)]">
                    {formatCurrencyGBP(995)}
                  </span>
                  <span className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--app-text-soft)]">
                    / month
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                  {formatCurrencyGBP(495)} setup | 60-day pilot | 1 clinic
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    'Revenue Leak Audit',
                    'Automated lead reply',
                    'Appointment reminders',
                    'Review & rebooking automation',
                    'Weekly ROI reporting',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
                        <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-[var(--app-text-muted)]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
