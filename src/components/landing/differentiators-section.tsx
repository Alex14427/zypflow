'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FadeIn, GsapReveal } from '@/components/animations';

const COMPARISONS = [
  {
    number: '01',
    category: 'Booking software',
    them: 'Manages your diary — but does nothing to fill it.',
    us: 'Fills your diary and keeps it full with automated lead response, reminders, and rebooking.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    number: '02',
    category: 'AI chatbots',
    them: 'Generic replies with no follow-through. Leads still go cold.',
    us: 'Intelligent response + instant booking link + full reminder chain + review request.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    number: '03',
    category: 'Agency retainers',
    them: 'Custom maze of tools, unclear results, high monthly cost.',
    us: 'Fixed system, weekly proof reporting, predictable pricing from £297/mo.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
];

function ComparisonCard({ item, index }: { item: typeof COMPARISONS[0]; index: number }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <FadeIn delay={0.12 * index} distance={30}>
      <motion.div
        className="group relative overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] transition-all duration-500 hover:border-brand-purple/30"
        onMouseEnter={() => setRevealed(true)}
        onMouseLeave={() => setRevealed(false)}
        onClick={() => setRevealed(prev => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRevealed(prev => !prev); }}
      >
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="relative p-6 sm:p-8">
          {/* Header row */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-purple/20">
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">
                {item.number}/
              </p>
              <p className="text-sm font-semibold text-[var(--app-text)]">{item.category}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--app-muted)] text-[var(--app-text-soft)] transition-all duration-300 group-hover:bg-brand-purple/10 group-hover:text-brand-purple">
              <svg className={`h-4 w-4 transition-transform duration-300 ${revealed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Content area with reveal */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/* Without — always visible */}
            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-muted)] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">Without Zypflow</p>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">{item.them}</p>
            </div>

            {/* With Zypflow — clip-path reveal */}
            <div className="relative overflow-hidden rounded-2xl border border-brand-purple/20 bg-brand-purple/[0.06] px-5 py-4">
              <motion.div
                className="absolute inset-0 bg-brand-purple/[0.08]"
                initial={false}
                animate={{ clipPath: revealed ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)' }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
              <p className="relative text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-purple">With Zypflow</p>
              <motion.p
                className="relative mt-2 text-sm font-medium text-[var(--app-text)]"
                initial={false}
                animate={{ opacity: revealed ? 1 : 0.4, x: revealed ? 0 : 8 }}
                transition={{ duration: 0.4, delay: revealed ? 0.1 : 0 }}
              >
                {item.us}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </FadeIn>
  );
}

export function DifferentiatorsSection() {
  return (
    <section id="trust" className="relative py-28 sm:py-36">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--app-card-border)] to-transparent" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <GsapReveal variant="fade-up">
          <div className="text-center">
            <p className="page-eyebrow">04/ Why Zypflow</p>
            <h2 className="mx-auto mt-4 max-w-3xl editorial-subheading">
              Built different.{' '}
              <span className="gradient-text">On purpose.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[var(--app-text-muted)]">
              You&apos;ve seen tools that do one thing. Zypflow is the system that connects everything. Hover or tap to reveal the difference.
            </p>
          </div>
        </GsapReveal>

        <div className="mt-16 space-y-5">
          {COMPARISONS.map((item, i) => (
            <ComparisonCard key={item.category} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
