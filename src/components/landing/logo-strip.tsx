'use client';

import { FadeIn, AnimatedCounter, StaggerGroup } from '@/components/animations';

const INTEGRATIONS = [
  'Fresha', 'Phorest', 'Vagaro', 'Cliniko', 'Stripe', 'WhatsApp',
  'Calendly', 'Google', 'Cal.com', 'Twilio', 'HubSpot', 'Resend',
  'Make.com', 'Instagram', 'Mailchimp', 'Zenoti',
];

const STATS = [
  { value: 5, prefix: '<', suffix: ' min', label: 'Average first reply' },
  { value: 95, suffix: '%', label: 'Reminder coverage' },
  { value: 3, suffix: '.2x', label: 'More reviews collected' },
  { value: 14, suffix: ' days', label: 'Audit to live' },
];

export function LogoStrip() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--app-card-border)] to-transparent" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Integration text ticker */}
        <FadeIn>
          <p className="page-eyebrow text-center">02/ Integrations</p>
          <p className="mx-auto mt-4 max-w-3xl text-center text-sm leading-7 text-[var(--app-text-muted)]">
            Works alongside the tools you already use:{' '}
            {INTEGRATIONS.map((name, i) => (
              <span key={name}>
                <span className="font-semibold text-[var(--app-text)]">{name}</span>
                {i < INTEGRATIONS.length - 1 ? <span className="text-[var(--app-text-soft)]"> · </span> : null}
              </span>
            ))}
            <span className="text-[var(--app-text-soft)]"> and more.</span>
          </p>
        </FadeIn>

        {/* Stats grid */}
        <StaggerGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.12}>
          {STATS.map((stat) => (
            <article
              key={stat.label}
              className="group rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-brand-purple/30 hover:shadow-[0_20px_50px_rgba(210,102,69,0.08)]"
            >
              <p className="text-3xl font-semibold tracking-[-0.03em] text-[var(--app-text)]">
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
                {stat.label}
              </p>
            </article>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
