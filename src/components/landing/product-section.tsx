'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, GsapReveal, StaggerGroup, MagneticButton } from '@/components/animations';

const TABS = [
  {
    id: 'convert',
    label: '01/ Convert',
    title: 'Instant reply to every enquiry.',
    description: 'Web, SMS, WhatsApp, email — under 5 minutes, 24/7. No lead goes cold. No enquiry gets missed. Your AI assistant qualifies, responds, and books while you focus on treatment.',
    features: ['Multi-channel auto-response', 'AI-powered lead qualification', 'Instant booking links', 'Smart handoff to human when needed'],
    stats: [{ value: '<5 min', label: 'Avg reply' }, { value: '3.2x', label: 'More bookings' }],
    mockup: 'chat',
  },
  {
    id: 'protect',
    label: '02/ Protect',
    title: 'Smart reminders that eliminate no-shows.',
    description: '7 automated touchpoints per booking — from confirmation to post-visit follow-up. Patients are reminded at the right time, through the right channel, with the right message.',
    features: ['7-layer reminder sequences', 'SMS + email + WhatsApp', 'Dynamic rescheduling links', 'No-show risk detection'],
    stats: [{ value: '-75%', label: 'No-shows' }, { value: '95%', label: 'Coverage' }],
    mockup: 'calendar',
  },
  {
    id: 'retain',
    label: '03/ Retain',
    title: 'Turn one visit into a lifetime patient.',
    description: 'Automated review requests after every appointment. Rebooking nudges that bring patients back. Your clinic builds a reputation and a repeat-revenue engine on autopilot.',
    features: ['Post-visit review requests', 'Smart rebooking sequences', 'Patient win-back campaigns', 'Weekly ROI reporting'],
    stats: [{ value: '3.2x', label: 'More reviews' }, { value: '+40%', label: 'Rebookings' }],
    mockup: 'reviews',
  },
];

function ChatMockup() {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand-purple/20 px-4 py-3 text-sm text-[var(--app-text)]">
          Hi, I&apos;d like to book a consultation for Botox please
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-[var(--app-surface)] px-4 py-3 text-sm text-[var(--app-text)]">
          <p>Hi! Thanks for your interest. We have availability this week:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Tue 2pm', 'Wed 10am', 'Thu 3pm'].map(t => (
              <span key={t} className="rounded-full border border-brand-purple/30 bg-brand-purple/10 px-3 py-1 text-xs font-medium text-brand-purple">{t}</span>
            ))}
          </div>
        </div>
      </div>
      <p className="text-center text-[10px] uppercase tracking-[0.2em] text-[var(--app-text-soft)]">Auto-replied in 47 seconds</p>
    </div>
  );
}

function CalendarMockup() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2 text-center text-xs text-[var(--app-text-soft)]">
        {days.map(d => <span key={d} className="font-semibold">{d}</span>)}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {days.map((d, i) => (
          <div key={d} className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-sm ${
            i === 2
              ? 'border-brand-purple/40 bg-brand-purple/10 text-brand-purple'
              : 'border-[var(--app-border)] text-[var(--app-text-muted)]'
          }`}>
            <span className="font-semibold">{14 + i}</span>
            {i === 2 && <span className="mt-0.5 text-[8px] uppercase tracking-wider">2 appts</span>}
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {[
          { time: '48h before', status: 'Sent', color: 'emerald' },
          { time: '24h before', status: 'Sent', color: 'emerald' },
          { time: '2h before', status: 'Queued', color: 'amber' },
        ].map(r => (
          <div key={r.time} className="flex items-center justify-between rounded-lg bg-[var(--app-surface)] px-3 py-2 text-xs">
            <span className="text-[var(--app-text-muted)]">Reminder {r.time}</span>
            <span className={`font-semibold text-${r.color}-500`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsMockup() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="mt-2 text-sm text-[var(--app-text)]">&ldquo;Brilliant service. The reminders made everything so easy.&rdquo;</p>
        <p className="mt-1 text-xs text-[var(--app-text-soft)]">Google Review — 2 days ago</p>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-4 py-3">
        <span className="text-sm font-medium text-emerald-400">Rebooking nudge sent</span>
        <span className="text-xs text-emerald-400/70">Auto · 7 days post-visit</span>
      </div>
      <p className="text-center text-[10px] uppercase tracking-[0.2em] text-[var(--app-text-soft)]">12 new reviews this month</p>
    </div>
  );
}

const MOCKUPS: Record<string, () => JSX.Element> = {
  chat: ChatMockup,
  calendar: CalendarMockup,
  reviews: ReviewsMockup,
};

export function ProductSection() {
  const [active, setActive] = useState(0);
  const lastInteraction = useRef(Date.now());

  // Auto-advance tabs
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastInteraction.current > 12000) {
        setActive(prev => (prev + 1) % TABS.length);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  function selectTab(i: number) {
    lastInteraction.current = Date.now();
    setActive(i);
  }

  const tab = TABS[active];
  const Mockup = MOCKUPS[tab.mockup];

  return (
    <section id="product" className="relative py-28 sm:py-36">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purple/[0.03] blur-[120px]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <GsapReveal variant="fade-up">
          <div className="max-w-3xl">
            <p className="page-eyebrow">03/ The System</p>
            <h2 className="mt-4 editorial-subheading">
              Three systems.{' '}
              <span className="gradient-text">One patient journey.</span>
            </h2>
            <p className="editorial-body mt-4">
              Every stage of the patient lifecycle — from first enquiry to repeat booking — handled automatically.
            </p>
          </div>
        </GsapReveal>

        {/* Tab bar */}
        <FadeIn delay={0.15}>
          <div className="mt-10 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => selectTab(i)}
                className={`relative shrink-0 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                  i === active
                    ? 'bg-brand-purple text-white shadow-[0_8px_24px_rgba(210,102,69,0.25)]'
                    : 'bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]'
                }`}
              >
                {t.label}
                {i === active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-full bg-brand-purple"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Tab content */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="grid gap-8 lg:grid-cols-[1.2fr_1fr]"
            >
              {/* Text content */}
              <div>
                <h3 className="text-2xl font-semibold text-[var(--app-text)] sm:text-3xl">
                  {tab.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[var(--app-text-muted)]">
                  {tab.description}
                </p>

                <StaggerGroup className="mt-6 space-y-3" staggerDelay={0.08}>
                  {tab.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-sm">
                      <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[var(--app-text-muted)]">{feature}</span>
                    </div>
                  ))}
                </StaggerGroup>

                <div className="mt-8 flex gap-6">
                  {tab.stats.map((s) => (
                    <div key={s.label}>
                      <p className="text-2xl font-semibold text-[var(--app-text)]">{s.value}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mockup */}
              <div className="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-6">
                <Mockup />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <FadeIn delay={0.2}>
          <div className="mt-10">
            <MagneticButton as="a" href="#audit" className="button-secondary px-6 py-3">
              See how it works for your clinic &darr;
            </MagneticButton>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
