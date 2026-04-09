'use client';

import { FadeIn, GsapReveal, AnimatedCounter, TiltCard, HorizontalCarousel } from '@/components/animations';

const RESULTS = [
  {
    metric: '+267%',
    metricValue: 267,
    metricSuffix: '%',
    metricPrefix: '+',
    metricLabel: 'More bookings',
    quote: 'We were losing patients before we even spoke to them. Zypflow fixed that in the first week.',
    attribution: 'Aesthetics clinic, Chelsea',
    features: ['Lead Auto-Response', 'Booking Nudges'],
    color: 'testimonial-sage',
  },
  {
    metric: '-75%',
    metricValue: 75,
    metricSuffix: '%',
    metricPrefix: '-',
    metricLabel: 'No-shows',
    quote: 'The reminder system alone pays for itself three times over. Patients actually thank us for the reminders.',
    attribution: 'Skin clinic, Mayfair',
    features: ['Smart Reminders', 'Rescheduling Links'],
    color: 'testimonial-sky',
  },
  {
    metric: '3.2x',
    metricValue: 3,
    metricSuffix: '.2x',
    metricLabel: 'More reviews',
    quote: 'We went from 2 Google reviews a month to 12. Patients are genuinely happy to leave them now.',
    attribution: 'Wellness clinic, Shoreditch',
    features: ['Review Requests', 'Rebooking Automation'],
    color: 'testimonial-lavender',
  },
  {
    metric: '+188%',
    metricValue: 188,
    metricSuffix: '%',
    metricPrefix: '+',
    metricLabel: 'Rebookings',
    quote: 'Finally, a system that doesn\'t require me to babysit it. It just runs and I see the results weekly.',
    attribution: 'Aesthetics studio, Notting Hill',
    features: ['Win-Back Campaigns', 'Weekly Reporting'],
    color: 'testimonial-blush',
  },
];

export function ResultsSection() {
  return (
    <section id="results" className="relative py-28 sm:py-36">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--app-card-border)] to-transparent" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <GsapReveal variant="fade-up">
          <div className="text-center">
            <p className="page-eyebrow">05/ Results</p>
            <h2 className="mx-auto mt-4 max-w-3xl editorial-subheading">
              Pilot results.{' '}
              <span className="gradient-text">Early numbers.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--app-text-soft)]">
              Based on early pilot data from London clinics. Details anonymised for privacy.
            </p>
          </div>
        </GsapReveal>

        <FadeIn delay={0.15}>
          <div className="mt-12">
            <HorizontalCarousel cardWidth={340} gap={20}>
              {RESULTS.map((result) => (
                <TiltCard key={result.attribution} className="h-full" maxTilt={6}>
                  <div className={`flex h-full flex-col overflow-hidden rounded-[28px] border p-7 transition-all duration-500 ${result.color}`}>
                    {/* Big metric */}
                    <div>
                      <p className="text-4xl font-semibold tracking-tight text-[var(--app-text)]">
                        <AnimatedCounter
                          value={result.metricValue}
                          prefix={result.metricPrefix}
                          suffix={result.metricSuffix}
                        />
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
                        {result.metricLabel}
                      </p>
                    </div>

                    {/* Quote */}
                    <div className="mt-5 flex-1">
                      <svg
                        className="mb-2 h-5 w-5 text-[var(--app-text-soft)] opacity-30"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
                      </svg>
                      <p className="text-sm font-medium leading-6 text-[var(--app-text)]">
                        &ldquo;{result.quote}&rdquo;
                      </p>
                    </div>

                    {/* Attribution */}
                    <div className="mt-5 border-t border-[var(--app-border)] pt-4">
                      <p className="text-xs font-semibold text-[var(--app-text-muted)]">
                        {result.attribution}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {result.features.map((f) => (
                          <span
                            key={f}
                            className="rounded-full border border-brand-purple/20 bg-brand-purple/[0.06] px-2.5 py-1 text-[10px] font-semibold text-brand-purple"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </HorizontalCarousel>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
