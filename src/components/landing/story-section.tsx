'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { FadeIn } from '@/components/animations';

const STORY_STEPS = [
  {
    number: '01',
    title: 'The Problem',
    body: 'Service businesses lose 40% of enquiries to slow replies. Leads go cold. Appointments get missed. Patients never come back. Most owners know this but are too busy delivering the service to fix the systems around it.',
    accent: 'from-red-500/20 to-red-500/5',
  },
  {
    number: '02',
    title: 'The Insight',
    body: 'The clinics that grow fastest are not the ones with the best treatments. They are the ones with the best systems: instant replies, airtight reminders, automatic follow-ups, and review loops that run without the owner doing anything.',
    accent: 'from-amber-500/20 to-amber-500/5',
  },
  {
    number: '03',
    title: 'The Solution',
    body: 'Zypflow is the revenue operating system that does all of this automatically. We plug into the tools you already use, deploy battle-tested workflows, and prove the results every single week with real numbers.',
    accent: 'from-emerald-500/20 to-emerald-500/5',
  },
];

export function StorySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.8], ['0%', '100%']);

  return (
    <section className="relative overflow-hidden py-28 sm:py-36" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeIn>
          <p className="page-eyebrow">Our story</p>
          <h2 className="mx-auto mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl lg:text-6xl">
            We built Zypflow because{' '}
            <span className="gradient-text">great service deserves great systems.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--app-text-muted)]">
            Founded in London by a team that saw too many incredible clinics losing revenue to broken processes. Not because they were bad at their job, but because nobody had built the automation layer they actually needed.
          </p>
        </FadeIn>

        <div className="relative mt-20">
          {/* Animated progress line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-[var(--app-border)] sm:left-12">
            <motion.div
              className="absolute left-0 top-0 w-full bg-gradient-to-b from-brand-purple to-brand-purple/30"
              style={{ height: lineHeight }}
            />
          </div>

          <div className="space-y-8">
            {STORY_STEPS.map((step, i) => (
              <FadeIn key={step.number} delay={0.15 * i} distance={40}>
                <motion.div
                  className="group relative ml-16 sm:ml-24 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-8 transition-all duration-500 hover:border-brand-purple/20"
                  whileHover={{ x: 8 }}
                >
                  {/* Step number on the line */}
                  <div className="absolute -left-[52px] sm:-left-[72px] top-8 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-sm font-bold text-brand-purple transition-all duration-300 group-hover:border-brand-purple/30 group-hover:bg-brand-purple/10">
                    {step.number}
                  </div>

                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

                  <div className="relative">
                    <h3 className="text-2xl font-semibold text-[var(--app-text)]">{step.title}</h3>
                    <p className="mt-3 text-base leading-7 text-[var(--app-text-muted)]">{step.body}</p>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <FadeIn delay={0.3}>
          <div className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: '< 5min', label: 'Average first reply' },
              { value: '95%', label: 'Reminder coverage' },
              { value: '3.2x', label: 'More reviews collected' },
              { value: '14 days', label: 'From audit to live' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 text-center transition-all duration-300 hover:border-brand-purple/20 hover:bg-brand-purple/[0.04]"
              >
                <p className="text-2xl font-semibold text-[var(--app-text)] sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-[var(--app-text-soft)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
