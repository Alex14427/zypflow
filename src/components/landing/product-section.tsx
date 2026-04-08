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
    stats: [
      { value: '<5 min', label: 'Avg reply' },
      { value: '3.2x', label: 'More bookings' },
    ],
  },
  {
    number: '02',
    title: 'Protect every booking',
    eyebrow: 'Appointment protection',
    body: 'Confirmed appointments stay protected with smart reminders, confirmations, and reschedule recovery.',
    bullets: ['48h, 24h, 2h reminders', 'No-show risk detection', 'Reschedule recovery'],
    accent: 'from-teal-500/10 to-brand-purple/5',
    stats: [
      { value: '-75%', label: 'No-shows' },
      { value: '95%', label: 'Coverage' },
    ],
  },
  {
    number: '03',
    title: 'Extend patient value',
    eyebrow: 'Retention engine',
    body: 'Every completed visit becomes a chance to win a review, bring the patient back, and compound your revenue.',
    bullets: ['Review requests', 'Reactivation sequences', 'Rebooking nudges'],
    accent: 'from-amber-500/10 to-brand-purple/5',
    stats: [
      { value: '3.2x', label: 'More reviews' },
      { value: '+40%', label: 'Rebookings' },
    ],
  },
];

export function ProductSection() {
  return (
    <section id="how-it-works" className="relative py-28 sm:py-36">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purple/[0.03] blur-[120px]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeIn>
          <div className="max-w-3xl">
            <p className="page-eyebrow">How it works</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl lg:text-6xl">
              Three systems.{' '}
              <span className="gradient-text">One patient journey.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--app-text-muted)]">
              Every important moment in the patient journey gets its own system, not its own spreadsheet.
            </p>
          </div>
        </FadeIn>

        {/* Bento grid — first card spans full width, cards 2 & 3 split */}
        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          {/* Hero card — full width */}
          <FadeIn distance={50}>
            <motion.div
              className="group relative overflow-hidden rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-8 sm:p-10 lg:col-span-1 lg:row-span-2 lg:p-12 h-full"
              whileHover={{
                borderColor: 'rgba(210, 102, 69, 0.25)',
                transition: { duration: 0.3 },
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${TRACKS[0].accent} opacity-0 transition-opacity duration-700 group-hover:opacity-100`} />

              <div className="relative flex h-full flex-col">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple/10 text-xl font-semibold text-brand-purple transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-purple/20">
                    {TRACKS[0].number}
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-purple">
                    {TRACKS[0].eyebrow}
                  </p>
                </div>

                <h3 className="mt-8 text-3xl font-semibold tracking-tight text-[var(--app-text)] sm:text-4xl">
                  {TRACKS[0].title}
                </h3>
                <p className="mt-4 max-w-lg text-base leading-8 text-[var(--app-text-muted)]">
                  {TRACKS[0].body}
                </p>

                {/* Inline stats */}
                <div className="mt-8 flex gap-6">
                  {TRACKS[0].stats.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-3xl font-semibold tabular-nums text-[var(--app-text)]">{stat.value}</p>
                      <p className="mt-1 text-xs text-[var(--app-text-soft)]">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Feature pills */}
                <div className="mt-auto pt-8 flex flex-wrap gap-2">
                  {TRACKS[0].bullets.map((bullet) => (
                    <span
                      key={bullet}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-2 text-xs font-medium text-[var(--app-text)]"
                    >
                      <svg className="h-3.5 w-3.5 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {bullet}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </FadeIn>

          {/* Cards 2 & 3 stacked on the right */}
          <div className="grid gap-5">
            {TRACKS.slice(1).map((track, i) => (
              <FadeIn key={track.number} delay={0.15 * (i + 1)} distance={40}>
                <motion.div
                  className={`group relative overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-7 sm:p-8`}
                  whileHover={{
                    borderColor: 'rgba(210, 102, 69, 0.25)',
                    transition: { duration: 0.3 },
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${track.accent} opacity-0 transition-opacity duration-700 group-hover:opacity-100`} />

                  <div className="relative">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple/10 text-base font-semibold text-brand-purple transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-purple/20">
                          {track.number}
                        </span>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-purple">
                          {track.eyebrow}
                        </p>
                      </div>

                      {/* Compact stats */}
                      <div className="hidden sm:flex gap-5">
                        {track.stats.map((stat) => (
                          <div key={stat.label} className="text-right">
                            <p className="text-xl font-semibold tabular-nums text-[var(--app-text)]">{stat.value}</p>
                            <p className="text-[10px] text-[var(--app-text-soft)]">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <h3 className="mt-5 text-2xl font-semibold tracking-tight text-[var(--app-text)]">
                      {track.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">
                      {track.body}
                    </p>

                    {/* Feature pills */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {track.bullets.map((bullet) => (
                        <span
                          key={bullet}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-[var(--app-muted)] px-3 py-1.5 text-xs font-medium text-[var(--app-text)]"
                        >
                          <svg className="h-3 w-3 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {bullet}
                        </span>
                      ))}
                    </div>
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
