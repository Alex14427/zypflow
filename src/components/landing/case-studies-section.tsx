'use client';

import { motion } from 'framer-motion';
import { FadeIn, GsapReveal } from '@/components/animations';

type Metric = {
  label: string;
  before: string;
  after: string;
  improvement: string;
};

type CaseStudy = {
  clinicName: string;
  location: string;
  headline: string;
  excerpt: string;
  metrics: Metric[];
  quote: { text: string; author: string; role: string };
  servicesUsed: string[];
  color: string;
};

// Hardcoded pilot data — replaced by Sanity CMS data when available
const FALLBACK_STUDIES: CaseStudy[] = [
  {
    clinicName: 'Glow Aesthetics',
    location: 'Chelsea, London',
    headline: 'From 3 bookings/week to 11 in 30 days',
    excerpt:
      'Glow Aesthetics was losing 60% of web enquiries to slow follow-up. Zypflow automated first response to under 2 minutes and added booking nudges that converted warm leads.',
    metrics: [
      { label: 'Weekly bookings', before: '3', after: '11', improvement: '+267%' },
      { label: 'Response time', before: '4.5 hrs', after: '<2 min', improvement: '-98%' },
      { label: 'No-show rate', before: '22%', after: '4%', improvement: '-82%' },
      { label: 'Google reviews/mo', before: '2', after: '14', improvement: '+600%' },
    ],
    quote: {
      text: "We were losing patients before we even spoke to them. Zypflow fixed that in the first week.",
      author: 'Dr. Sarah Chen',
      role: 'Medical Director',
    },
    servicesUsed: ['Lead Auto-Response', 'Appointment Reminders', 'Review Requests'],
    color: 'testimonial-sage',
  },
  {
    clinicName: 'Skin & Co',
    location: 'Mayfair, London',
    headline: 'No-show rate cut from 18% to under 5%',
    excerpt:
      'Skin & Co had a persistent no-show problem costing them over \u00a34,000/month in lost revenue. Zypflow deployed a 3-layer reminder system that practically eliminated it.',
    metrics: [
      { label: 'No-show rate', before: '18%', after: '4.5%', improvement: '-75%' },
      { label: 'Revenue recovered', before: '\u00a30', after: '\u00a33,800/mo', improvement: 'New' },
      { label: 'Patient satisfaction', before: '3.8/5', after: '4.7/5', improvement: '+24%' },
      { label: 'Rebookings/month', before: '8', after: '23', improvement: '+188%' },
    ],
    quote: {
      text: "The reminder system alone pays for itself three times over. Patients actually thank us for the reminders.",
      author: 'Emily Richards',
      role: 'Clinic Manager',
    },
    servicesUsed: ['Appointment Reminders', 'Rebooking Automation', 'AI Chat Widget'],
    color: 'testimonial-sky',
  },
];

export function CaseStudiesSection({ studies }: { studies?: CaseStudy[] }) {
  const data = studies && studies.length > 0 ? studies : FALLBACK_STUDIES;

  return (
    <section id="case-studies" className="relative py-28 sm:py-36">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--app-card-border)] to-transparent" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <GsapReveal variant="fade-up">
          <div className="text-center">
            <p className="page-eyebrow">Case studies</p>
            <h2 className="mx-auto mt-4 max-w-3xl editorial-subheading">
              Real clinics.{' '}
              <span className="gradient-text">Real numbers.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--app-text-muted)]">
              These are pilot results from London aesthetics clinics using Zypflow.
            </p>
          </div>
        </GsapReveal>

        <div className="mt-16 space-y-12">
          {data.map((study, i) => (
            <FadeIn key={study.clinicName} delay={0.15 * i} distance={50}>
              <div className={`overflow-hidden rounded-[32px] border p-1 ${study.color}`}>
                <div className="rounded-[28px] bg-[var(--app-surface-strong)] p-8 sm:p-10">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-purple">
                        {study.location}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-[var(--app-text)] sm:text-3xl">
                        {study.clinicName}: {study.headline}
                      </h3>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--app-text-muted)]">
                        {study.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {study.metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-muted)] p-5 transition-transform duration-200 hover:-translate-y-1"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
                          {metric.label}
                        </p>
                        <div className="mt-3 flex items-baseline gap-3">
                          <span className="text-sm text-[var(--app-text-soft)] line-through">
                            {metric.before}
                          </span>
                          <span className="text-2xl font-semibold text-[var(--app-text)]">
                            {metric.after}
                          </span>
                        </div>
                        <span className="mt-1 inline-block text-xs font-semibold text-emerald-400">
                          {metric.improvement}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                    <div className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-muted)] p-6">
                      <svg
                        className="mb-3 h-6 w-6 text-[var(--app-text-soft)] opacity-30"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
                      </svg>
                      <p className="text-base font-medium leading-7 text-[var(--app-text)]">
                        &ldquo;{study.quote.text}&rdquo;
                      </p>
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-[var(--app-text)]">{study.quote.author}</p>
                        <p className="text-xs text-[var(--app-text-muted)]">{study.quote.role}, {study.clinicName}</p>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-muted)] p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
                        Zypflow features used
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {study.servicesUsed.map((service) => (
                          <span
                            key={service}
                            className="rounded-full border border-brand-purple/20 bg-brand-purple/[0.06] px-3 py-1.5 text-xs font-semibold text-brand-purple"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
