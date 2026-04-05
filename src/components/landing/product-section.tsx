'use client';

import { motion } from 'framer-motion';
import { FadeIn } from '@/components/animations';

const TRACKS = [
  {
    number: '01',
    title: 'Convert the first enquiry',
    eyebrow: 'Lead capture',
    body: 'Website, widget, form, SMS, and email enquiries land in one operating layer. Warm demand gets answered and routed before it goes cold.',
    bullets: ['AI first response', 'Lead qualification', 'Booking CTA routing'],
    accent: 'from-brand-purple/10 to-teal-500/5',
  },
  {
    number: '02',
    title: 'Protect the booked consult',
    eyebrow: 'Appointment protection',
    body: 'Confirmed appointments stay protected with reminders, confirmations, and reschedule recovery instead of manual chasing.',
    bullets: ['48h, 24h, 2h reminders', 'No-show risk detection', 'Reschedule recovery'],
    accent: 'from-teal-500/10 to-brand-purple/5',
  },
  {
    number: '03',
    title: 'Extend patient value',
    eyebrow: 'Retention engine',
    body: 'Every completed visit becomes a chance to win a review, bring the patient back, and compound the clinic\'s revenue base.',
    bullets: ['Review requests', 'Reactivation sequences', 'Rebooking nudges'],
    accent: 'from-amber-500/10 to-brand-purple/5',
  },
];

export function ProductSection() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeIn>
          <div className="max-w-3xl">
            <p className="page-eyebrow">How it works</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
              Three systems.{' '}
              <span className="text-[var(--app-text-muted)]">One patient journey.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--app-text-muted)]">
              Every important moment in the clinic journey gets its own system, not its own spreadsheet.
            </p>
          </div>
        </FadeIn>

        <div className="mt-16 space-y-8">
          {TRACKS.map((track, i) => (
            <FadeIn key={track.number} delay={0.15 * i} distance={50}>
              <motion.div
                className={`group relative overflow-hidden rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-8 sm:p-10 lg:p-12`}
                whileHover={{
                  borderColor: 'rgba(210, 102, 69, 0.25)',
                  transition: { duration: 0.3 },
                }}
              >
                {/* Background accent gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${track.accent} opacity-0 transition-opacity duration-700 group-hover:opacity-100`} />

                <div className="relative grid items-start gap-8 lg:grid-cols-[1fr_1.2fr]">
                  <div>
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-purple/10 text-lg font-semibold text-brand-purple">
                        {track.number}
                      </span>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-purple">
                        {track.eyebrow}
                      </p>
                    </div>
                    <h3 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--app-text)] sm:text-4xl">
                      {track.title}
                    </h3>
                    <p className="mt-4 text-base leading-8 text-[var(--app-text-muted)]">
                      {track.body}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-1">
                    {track.bullets.map((bullet, j) => (
                      <motion.div
                        key={bullet}
                        className="flex items-center gap-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-muted)] px-5 py-4"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + j * 0.1, duration: 0.4 }}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-purple/10">
                          <svg className="h-4 w-4 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-[var(--app-text)]">{bullet}</span>
                      </motion.div>
                    ))}
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
