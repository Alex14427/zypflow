'use client';

import { motion } from 'framer-motion';
import { FadeIn } from '@/components/animations';

const SURFACES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    title: 'Audit first',
    eyebrow: 'Public proof layer',
    body: 'The Revenue Leak Audit turns the sales conversation into a diagnosis, not a generic demo. Clinics see their own numbers before they see ours.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    title: 'Operate clearly',
    eyebrow: 'Founder surface',
    body: 'Prospects, readiness, live clinics, proof signals, and automations all in one operator view. No more tab-switching chaos.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Feel calm after buying',
    eyebrow: 'Client surface',
    body: 'Clinic owners see bookings, proof, health, and next actions without being buried in system noise. It just works.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-28 sm:py-36">
      {/* Ambient accent */}
      <div className="pointer-events-none absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-teal-500/[0.04] blur-[100px]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-start gap-16 lg:grid-cols-[1fr_1.1fr]">
          <div className="lg:sticky lg:top-32">
            <FadeIn>
              <p className="page-eyebrow">Three surfaces</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
                Not just a tool.{' '}
                <span className="text-[var(--app-text-muted)]">An operating model.</span>
              </h2>
              <p className="mt-5 text-lg leading-8 text-[var(--app-text-muted)]">
                The best software companies don&apos;t just explain what the tool does. They make the operating model feel inevitable.
              </p>
            </FadeIn>
          </div>

          <div className="space-y-6">
            {SURFACES.map((surface, i) => (
              <FadeIn key={surface.title} delay={0.15 * i} distance={40}>
                <motion.div
                  className="group relative overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-7 transition-all duration-500"
                  whileHover={{
                    y: -4,
                    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple transition-colors group-hover:bg-brand-purple/20">
                        {surface.icon}
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">
                        {surface.eyebrow}
                      </p>
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold text-[var(--app-text)]">
                      {surface.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">
                      {surface.body}
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
