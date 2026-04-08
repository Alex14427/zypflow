'use client';

import { motion } from 'framer-motion';
import { FadeIn } from '@/components/animations';

const COMPARISONS = [
  {
    category: 'Booking software',
    them: 'Manages your diary',
    us: 'Fills your diary and keeps it full',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    category: 'AI chatbots',
    them: 'Generic replies with no follow-through',
    us: 'Intelligent response + booking + reminder chain',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    category: 'Agency retainers',
    them: 'Custom maze, unclear results, high cost',
    us: 'Fixed system, weekly proof, predictable pricing',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
];

export function DifferentiatorsSection() {
  return (
    <section id="trust" className="relative py-28 sm:py-36">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--app-card-border)] to-transparent" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeIn>
          <div className="text-center">
            <p className="page-eyebrow">Why Zypflow</p>
            <h2 className="mx-auto mt-4 max-w-3xl editorial-subheading">
              Built different.{' '}
              <span className="gradient-text">On purpose.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--app-text-muted)]">
              You&apos;ve seen tools that do one thing. Zypflow is the system that connects everything.
            </p>
          </div>
        </FadeIn>

        {/* Comparison cards */}
        <div className="mt-16 space-y-5">
          {COMPARISONS.map((item, i) => (
            <FadeIn key={item.category} delay={0.12 * i} distance={30}>
              <motion.div
                className="group relative overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] transition-all duration-500"
                whileHover={{
                  borderColor: 'rgba(210, 102, 69, 0.3)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr_1fr]">
                  {/* Category label */}
                  <div className="flex items-center gap-3 lg:w-48">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-purple/20">
                      {item.icon}
                    </div>
                    <p className="text-sm font-semibold text-[var(--app-text)]">{item.category}</p>
                  </div>

                  {/* Them */}
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-muted)] px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">Without Zypflow</p>
                    <p className="mt-2 text-sm text-[var(--app-text-muted)]">{item.them}</p>
                  </div>

                  {/* Us */}
                  <div className="rounded-2xl border border-brand-purple/20 bg-brand-purple/[0.06] px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-purple">With Zypflow</p>
                    <p className="mt-2 text-sm font-medium text-[var(--app-text)]">{item.us}</p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
