'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FadeIn, MagneticButton } from '@/components/animations';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://calendly.com/alex-zypflow/30min';

const HERO_METRICS = [
  { value: '<5 min', label: 'First response' },
  { value: '7-layer', label: 'Patient journey' },
  { value: '95%', label: 'Reminder coverage' },
];

export function HeroSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headlineRef.current;
    if (!el) return;

    // Split headline words into spans for GSAP animation
    const text = el.innerHTML;
    // Wrap each word while preserving HTML tags (like <span> for gradient-text)
    const words = el.querySelectorAll('.hero-word');
    if (words.length === 0) return;

    gsap.fromTo(
      words,
      { y: 50, opacity: 0, rotateX: 20 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 0.8,
        stagger: 0.06,
        ease: 'power3.out',
        delay: 0.3,
      }
    );

    // Parallax the ambient orbs on scroll
    const section = sectionRef.current;
    if (!section) return;

    const orbs = section.querySelectorAll('.hero-orb');
    orbs.forEach((orb, i) => {
      gsap.to(orb, {
        y: (i + 1) * -80,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden pb-16 pt-12 sm:pb-28 sm:pt-20">
      {/* Parallax ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="hero-orb absolute -left-[150px] -top-[50px] h-[500px] w-[500px] rounded-full bg-brand-purple/[0.08] blur-[120px]" />
        <div className="hero-orb absolute -right-[100px] top-[200px] h-[400px] w-[400px] rounded-full bg-[#a855f7]/[0.06] blur-[100px]" />
        <div className="hero-orb absolute bottom-[100px] left-[40%] h-[350px] w-[350px] rounded-full bg-teal-500/[0.04] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Eyebrow chips */}
        <FadeIn delay={0.1}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="chip chip-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-purple animate-pulse" />
              Now onboarding London clinics
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              3 pilot spots left
            </span>
          </div>
        </FadeIn>

        {/* Main headline — GSAP word-by-word reveal */}
        <div className="mt-10 max-w-5xl sm:mt-14">
          <h1
            ref={headlineRef}
            className="editorial-heading"
            style={{ perspective: '600px' }}
          >
            <span className="hero-word inline-block" style={{ opacity: 0 }}>Your</span>{' '}
            <span className="hero-word inline-block" style={{ opacity: 0 }}>clinic&apos;s</span>
            <br className="hidden sm:block" />{' '}
            <span className="hero-word inline-block" style={{ opacity: 0 }}>revenue</span>{' '}
            <span className="hero-word inline-block" style={{ opacity: 0 }}>system,</span>{' '}
            <span className="hero-word inline-block gradient-text" style={{ opacity: 0 }}>automated.</span>
          </h1>

          {/* Gradient accent line — GSAP width animation */}
          <FadeIn delay={0.5}>
            <motion.div
              className="mt-8 h-[2px] bg-gradient-to-r from-brand-purple to-brand-purple/0"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </FadeIn>

          <FadeIn delay={0.6} distance={30}>
            <p className="mt-6 max-w-2xl editorial-body">
              Faster first responses. Stronger booking conversion.
              Fewer no-shows. More repeat patients. All running while you
              focus on what you do best.
            </p>
          </FadeIn>
        </div>

        {/* CTA buttons */}
        <FadeIn delay={0.75} distance={20}>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <MagneticButton
              as="a"
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
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
              className="button-secondary px-7 py-4"
            >
              See Founding Offer
            </MagneticButton>
          </div>
        </FadeIn>

        {/* Hero metrics strip */}
        <FadeIn delay={0.85}>
          <div className="mt-16 flex flex-wrap gap-12 border-t border-[var(--app-border)] pt-8">
            {HERO_METRICS.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 + i * 0.1, duration: 0.5 }}
              >
                <p className="text-3xl font-semibold tracking-tight text-[var(--app-text)] sm:text-4xl">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm text-[var(--app-text-soft)]">{metric.label}</p>
              </motion.div>
            ))}
          </div>
        </FadeIn>

        {/* Dashboard preview — GSAP scale-in */}
        <FadeIn delay={1.0} distance={50}>
          <div className="mt-16 overflow-hidden rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)] p-1 shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
            <div className="rounded-[28px] bg-gradient-to-br from-[var(--app-surface-strong)] to-[var(--app-muted)] p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: 'Leads this week', value: '14', change: '+38%', positive: true },
                  { title: 'Consults booked', value: '6', change: '+22%', positive: true },
                  { title: 'Median response', value: '2m 31s', change: '-64%', positive: true },
                ].map((card) => (
                  <motion.div
                    key={card.title}
                    className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5"
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
                      {card.title}
                    </p>
                    <div className="mt-3 flex items-end gap-3">
                      <p className="text-3xl font-semibold tabular-nums text-[var(--app-text)]">
                        {card.value}
                      </p>
                      <span className={`mb-1 text-xs font-semibold ${card.positive ? 'text-emerald-500' : 'text-red-400'}`}>
                        {card.change}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Live conversations</p>
                  <div className="mt-4 space-y-3">
                    {['Emma — Lip filler enquiry', 'Sarah — Botox consult follow-up', 'Rachel — Review request sent'].map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                        <p className="text-sm text-[var(--app-text-muted)]">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Today&apos;s appointments</p>
                  <div className="mt-4 space-y-3">
                    {[
                      { time: '10:30', name: 'Jess K.', status: 'Confirmed' },
                      { time: '14:00', name: 'Amy T.', status: 'Reminder sent' },
                      { time: '16:30', name: 'Priya S.', status: 'At risk' },
                    ].map((item) => (
                      <div key={item.time} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium tabular-nums text-[var(--app-text-soft)]">{item.time}</span>
                          <span className="text-sm text-[var(--app-text-muted)]">{item.name}</span>
                        </div>
                        <span className={`text-xs font-medium ${item.status === 'At risk' ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
