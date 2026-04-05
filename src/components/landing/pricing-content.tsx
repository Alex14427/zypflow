'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FadeIn, MagneticButton } from '@/components/animations';
import { FaqSection } from '@/components/landing/faq-section';
import { formatCurrencyGBP } from '@/lib/formatting';

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://calendly.com/alex-zypflow/30min';

const INCLUDED = [
  'Revenue Leak Audit and founder-led launch planning',
  'Automated lead reply across web, chat, SMS, and email',
  'Reminder and confirmation workflows that protect booked consults',
  'Review request and rebooking automation after appointments',
  'Founder portal oversight plus weekly ROI reporting',
  'One location, one branded workspace, one standardized onboarding',
];

const NOT_INCLUDED = [
  'Voice AI in the first release',
  'Multi-location routing',
  'Bespoke agency projects',
  'Unlimited SMS or unbounded support requests',
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
  { step: '01', title: 'Audit', body: 'Scan the public site and pinpoint where booking intent is leaking.' },
  { step: '02', title: 'Activate', body: 'Approve fit, collect onboarding details, and activate billing.' },
  { step: '03', title: 'Deploy', body: 'Launch the workflow pack, brand the workspace, verify first flows.' },
  { step: '04', title: 'Prove', body: 'Report weekly on speed, bookings, reviews, and patient return.' },
];

const FIT = [
  'Independent aesthetics clinics with one location',
  'Owner-led teams already handling enquiries manually',
  'Clinics using existing booking software but needing a better conversion layer',
];

const NOT_FIT = [
  'Businesses looking for a broad DIY marketing platform',
  'Clinics needing multi-location routing immediately',
  'Teams expecting custom agency work outside the pilot scope',
];

interface PricingContentProps {
  faqs: Array<{ question: string; answer: string }>;
}

export function PricingContent({ faqs }: PricingContentProps) {
  return (
    <main>
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-start gap-16 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <FadeIn>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-brand-purple/20 bg-brand-purple/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-purple">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-purple animate-pulse" />
                    Managed product first
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[var(--app-border)] px-3 py-1.5 text-xs font-semibold text-[var(--app-text-muted)]">
                    60-day minimum
                  </span>
                </div>
              </FadeIn>

              <FadeIn delay={0.15} distance={50}>
                <h1 className="mt-8 text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-[var(--app-text)]">
                  The founding pilot for clinics that want{' '}
                  <span className="gradient-text">results, not more admin.</span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.3}>
                <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--app-text-muted)]">
                  A founder-led deployment for one clinic, one workflow pack, and one clear target: better conversion, stronger protection, more return.
                </p>
              </FadeIn>

              <FadeIn delay={0.4}>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <MagneticButton
                    as="a"
                    href={BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-dark px-8 py-4 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(210,102,69,0.3)]"
                  >
                    <span className="relative z-10">Book A Free Audit</span>
                    <svg className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </MagneticButton>
                  <Link href="/login" className="text-sm font-semibold text-[var(--app-text-muted)] transition hover:text-brand-purple">
                    Approved clinics log in &rarr;
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* Pricing card */}
            <FadeIn delay={0.2} direction="left">
              <div className="overflow-hidden rounded-[32px] border border-[var(--app-card-border)] bg-[var(--app-surface-strong)] p-8 shadow-[var(--app-shadow)]">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-semibold tabular-nums tracking-tight text-[var(--app-text)] sm:text-6xl">
                    {formatCurrencyGBP(995)}
                  </span>
                  <span className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--app-text-soft)]">
                    / month
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                  Plus {formatCurrencyGBP(495)} setup | 60-day minimum | 1 clinic
                </p>

                <div className="mt-8 space-y-2">
                  {[
                    { label: 'Setup fee', value: formatCurrencyGBP(495) },
                    { label: 'Monthly pilot', value: formatCurrencyGBP(995) },
                    { label: 'Initial term', value: '60 days' },
                    { label: 'Clinic count', value: '1 location' },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between border-b border-[var(--app-border)] py-3 text-sm last:border-0"
                    >
                      <span className="text-[var(--app-text-muted)]">{row.label}</span>
                      <span className="font-semibold text-[var(--app-text)]">{row.value}</span>
                    </div>
                  ))}
                </div>

                <motion.a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-dark py-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(210,102,69,0.25)]"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start with a free audit
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </motion.a>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Included / Not included */}
      <section className="py-24 sm:py-32">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--app-card-border)] to-transparent" />
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <FadeIn>
              <div className="rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">Included</p>
                <div className="mt-6 space-y-4">
                  {INCLUDED.map((item) => (
                    <div key={item} className="flex gap-4">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                        <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm leading-7 text-[var(--app-text-muted)]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">Not in first release</p>
                <div className="mt-6 space-y-4">
                  {NOT_INCLUDED.map((item) => (
                    <div key={item} className="flex gap-4">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--app-muted)]">
                        <div className="h-2 w-2 rounded-full bg-[var(--app-text-soft)]" />
                      </div>
                      <span className="text-sm leading-7 text-[var(--app-text-muted)]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Launch path */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <FadeIn>
            <div className="text-center">
              <p className="page-eyebrow">Launch path</p>
              <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
                The first 60 days:{' '}
                <span className="text-[var(--app-text-muted)]">get live, prove value, stay disciplined.</span>
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

      {/* Fit / Not fit */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <FadeIn>
              <div className="rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">Ideal fit</p>
                <div className="mt-6 space-y-3">
                  {FIT.map((item) => (
                    <motion.div
                      key={item}
                      className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-muted)] px-5 py-4 text-sm text-[var(--app-text-muted)]"
                      whileHover={{ y: -2, borderColor: 'rgba(210, 102, 69, 0.2)' }}
                    >
                      {item}
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">Not ideal right now</p>
                <div className="mt-6 space-y-3">
                  {NOT_FIT.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-muted)] px-5 py-4 text-sm text-[var(--app-text-muted)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
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
