'use client';

import { motion } from 'framer-motion';
import { FadeIn } from '@/components/animations';

const STEPS = [
  {
    step: '01',
    title: 'Revenue Leak Audit',
    body: 'We scan your public site and pinpoint exactly where booking intent is leaking. You see the numbers before we talk about systems.',
  },
  {
    step: '02',
    title: 'Approve & activate',
    body: 'Approve fit, collect onboarding details, and activate one branded clinic workspace with all your workflows ready.',
  },
  {
    step: '03',
    title: 'Deploy workflows',
    body: 'The workflow pack goes live across lead reply, appointment protection, and proof reporting. Real automations, not demos.',
  },
  {
    step: '04',
    title: 'Weekly proof',
    body: 'Use founder and clinic dashboards to keep the system compounding instead of drifting. See results, not just activity.',
  },
];

export function LaunchSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute left-0 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purple/[0.04] blur-[100px]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeIn>
          <div className="text-center">
            <p className="page-eyebrow">Launch path</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
              From audit to live{' '}
              <span className="text-[var(--app-text-muted)]">in 14 days.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--app-text-muted)]">
              Buyers don&apos;t just need a promise. They need to picture what happens after they say yes.
            </p>
          </div>
        </FadeIn>

        <div className="relative mx-auto mt-16 max-w-3xl">
          {/* Connecting line */}
          <div className="absolute bottom-0 left-8 top-0 w-px bg-gradient-to-b from-brand-purple/30 via-brand-purple/10 to-transparent sm:left-10" />

          <div className="space-y-1">
            {STEPS.map((item, i) => (
              <FadeIn key={item.step} delay={0.15 * i} distance={30}>
                <motion.div
                  className="group relative flex gap-6 rounded-[24px] p-6 transition-all duration-300 hover:bg-[var(--app-surface-strong)] sm:gap-8"
                  whileHover={{ x: 8 }}
                >
                  {/* Step circle */}
                  <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-lg font-semibold text-brand-purple transition-all duration-300 group-hover:border-brand-purple/30 group-hover:bg-brand-purple/10 sm:h-20 sm:w-20 sm:text-xl">
                    {item.step}
                  </div>

                  <div className="pt-2">
                    <h3 className="text-xl font-semibold text-[var(--app-text)] sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">
                      {item.body}
                    </p>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
