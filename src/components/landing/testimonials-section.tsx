'use client';

import { motion } from 'framer-motion';
import { FadeIn } from '@/components/animations';

const TESTIMONIALS = [
  {
    quote: 'We were losing 40% of enquiries to slow follow-up. Zypflow fixed that in the first week.',
    name: 'Dr. Sarah Chen',
    role: 'Medical Director',
    clinic: 'Glow Aesthetics, Chelsea',
    color: 'testimonial-sage',
  },
  {
    quote: 'The no-show rate dropped from 18% to under 5%. The reminder system alone pays for itself.',
    name: 'Emily Richards',
    role: 'Clinic Manager',
    clinic: 'Skin & Co, Mayfair',
    color: 'testimonial-sky',
  },
  {
    quote: 'Finally, a system that doesn\'t require me to babysit it. It just runs and I see the results weekly.',
    name: 'Jessica Park',
    role: 'Owner & Practitioner',
    clinic: 'The Aesthetic Studio, Notting Hill',
    color: 'testimonial-lavender',
  },
  {
    quote: 'We went from 2 Google reviews a month to 12. Patients are genuinely happy to leave them now.',
    name: 'Amara Okafor',
    role: 'Operations Lead',
    clinic: 'Radiance Clinic, Shoreditch',
    color: 'testimonial-blush',
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--app-card-border)] to-transparent" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeIn>
          <div className="text-center">
            <p className="page-eyebrow">What to expect</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
              Results clinics{' '}
              <span className="gradient-text">are seeing.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--app-text-soft)]">
              Based on early pilot data. Names and details have been changed for privacy.
            </p>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={0.1 * i} distance={30}>
              <motion.div
                className={`group relative h-full overflow-hidden rounded-[28px] border p-8 transition-all duration-500 ${t.color}`}
                whileHover={{
                  y: -6,
                  boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
                }}
              >
                {/* Quote mark */}
                <svg
                  className="mb-4 h-8 w-8 text-[var(--app-text-soft)] opacity-30"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
                </svg>

                <p className="text-lg font-medium leading-8 text-[var(--app-text)]">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="mt-6 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--app-surface-strong)] text-sm font-bold text-[var(--app-text)]">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--app-text)]">{t.name}</p>
                    <p className="text-xs text-[var(--app-text-muted)]">{t.role} — {t.clinic}</p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
