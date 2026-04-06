'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import { FadeIn } from '@/components/animations';

const STATS = [
  { value: '<5 min', label: 'Target first-response window', description: 'The first touch decides whether the enquiry cools off or converts.' },
  { value: '7', label: 'Protected touchpoints', description: 'Lead reply, booking prompt, reminders, review ask, and rebooking layers.' },
  { value: '1', label: 'Calm workspace', description: 'A control surface that answers what happened, what matters, what needs attention.' },
  { value: 'Weekly', label: 'Proof reporting', description: 'Bookings, no-show risk, reviews, and repeat demand reported in one rhythm.' },
];

export function ProofStrip() {
  const ref = useRef<HTMLElement>(null);

  return (
    <section ref={ref} id="proof" className="relative py-24 sm:py-32">
      {/* Subtle divider gradient */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--app-card-border)] to-transparent" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeIn>
          <div className="text-center">
            <p className="page-eyebrow">Built for results</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
              Every number is a{' '}
              <span className="gradient-text">patient you kept.</span>
            </h2>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <FadeIn key={stat.label} delay={0.1 * i}>
              <motion.div
                className="group relative overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-6 transition-all duration-500"
                whileHover={{
                  y: -8,
                  boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
                  borderColor: 'rgba(210, 102, 69, 0.3)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative">
                  <p className="text-4xl font-semibold tabular-nums tracking-tight text-[var(--app-text)] sm:text-5xl">
                    {stat.value}
                  </p>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.15em] text-brand-purple">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">
                    {stat.description}
                  </p>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
