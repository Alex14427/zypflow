'use client';

import { motion } from 'framer-motion';
import posthog from 'posthog-js';
import { TextReveal, MagneticButton, FadeIn, AnimatedCounter } from '@/components/animations';
import { InteractiveParticles } from '@/components/animations/interactive-particles';

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://calendly.com/alex-zypflow/30min';

const HERO_METRICS = [
  { value: 5, prefix: '<', suffix: ' min', label: 'First response' },
  { value: 95, suffix: '%', label: 'Reminder coverage' },
  { value: 3, suffix: '.2x', label: 'More reviews' },
];

export function GlobeHero() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden sm:min-h-screen" id="hero">
      {/* Particle canvas background */}
      <div className="absolute inset-0 z-0">
        <InteractiveParticles className="h-full w-full" />
      </div>

      {/* Gradient overlays for depth */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[var(--app-bg)] via-transparent to-[var(--app-bg)]" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[var(--app-bg)] via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-7xl flex-col justify-center px-5 sm:min-h-screen sm:px-8">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <FadeIn delay={0.1}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="chip chip-brand">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-purple" />
                01/ Revenue OS
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Limited pilot intake
              </span>
            </div>
          </FadeIn>

          {/* Headline */}
          <div className="mt-8 sm:mt-10">
            <TextReveal
              as="h1"
              className="editorial-heading"
              staggerChildren={0.04}
              delay={0.2}
            >
              Stop losing patients to slow replies.
            </TextReveal>
            <FadeIn delay={0.6}>
              <p className="mt-2 font-serif text-4xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                <span className="gradient-text">Automate growth.</span>
              </p>
            </FadeIn>
          </div>

          {/* Subheadline */}
          <FadeIn delay={0.8}>
            <p className="editorial-body mt-6 max-w-xl">
              Zypflow replies to enquiries in under 5 minutes, protects every booking with smart reminders, and brings patients back automatically. Built for clinics too busy delivering great work to chase leads.
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={1.0}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <MagneticButton
                as="a"
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => posthog.capture('cta_clicked', { cta: 'hero_book_audit', location: 'hero' })}
                className="button-primary group gap-3 px-8 py-4"
              >
                <span className="relative z-10">Book Your Free Audit</span>
                <svg className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </MagneticButton>
              <MagneticButton
                as="a"
                href="/pricing"
                onClick={() => posthog.capture('cta_clicked', { cta: 'hero_see_pricing', location: 'hero' })}
                className="button-secondary px-7 py-4"
              >
                See Pricing
              </MagneticButton>
              <a
                href="#audit"
                className="text-sm font-medium text-[var(--app-text-muted)] transition hover:text-brand-purple"
                onClick={() => posthog.capture('cta_clicked', { cta: 'hero_run_audit', location: 'hero' })}
              >
                Run free audit &darr;
              </a>
            </div>
          </FadeIn>

          {/* Metrics */}
          <FadeIn delay={1.2}>
            <div className="mt-12 flex flex-wrap gap-8 border-t border-[var(--app-border)] pt-8 sm:gap-12">
              {HERO_METRICS.map((metric) => (
                <div key={metric.label}>
                  <p className="text-2xl font-semibold tracking-tight text-[var(--app-text)] sm:text-3xl">
                    <AnimatedCounter
                      value={metric.value}
                      prefix={metric.prefix}
                      suffix={metric.suffix}
                    />
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
