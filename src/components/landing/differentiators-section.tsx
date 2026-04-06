'use client';

import { motion } from 'framer-motion';
import { FadeIn, GsapReveal } from '@/components/animations';

const DIFFERENTIATORS = [
  {
    title: 'Not another booking platform',
    body: 'Booking software manages the diary. Zypflow closes the gaps around the diary: reply speed, conversion, reminders, reviews, and return visits.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'Not a vague AI promise',
    body: 'The rollout is specific: one audit, one workflow pack, one founder-led launch path, one weekly proof cadence. No mystery box.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    title: 'Not agency chaos',
    body: 'No custom maze. No "we can do everything." A tighter system makes automation more reliable and margins healthier.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
];

export function DifferentiatorsSection() {
  return (
    <section id="trust" className="relative py-24 sm:py-32">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--app-card-border)] to-transparent" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <GsapReveal variant="fade-up">
          <div className="text-center">
            <p className="page-eyebrow">Why Zypflow</p>
            <h2 className="mx-auto mt-4 max-w-3xl editorial-subheading">
              Built different.{' '}
              <span className="gradient-text">On purpose.</span>
            </h2>
          </div>
        </GsapReveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {DIFFERENTIATORS.map((item, i) => (
            <FadeIn key={item.title} delay={0.12 * i}>
              <motion.div
                className="group relative h-full overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-8 transition-all duration-500"
                whileHover={{
                  y: -8,
                  boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
                  borderColor: 'rgba(210, 102, 69, 0.3)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-purple/20">
                    {item.icon}
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold text-[var(--app-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--app-text-muted)]">
                    {item.body}
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
