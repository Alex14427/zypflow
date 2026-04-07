'use client';

import { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MagneticButton } from '@/components/animations';

// Dynamic import — SSR safe, with loading state
const GlobeScene = dynamic(
  () => import('@/components/three/globe-scene').then((mod) => mod.GlobeScene),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-gradient-to-b from-transparent via-brand-purple/[0.03] to-transparent" />
    ),
  },
);

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://calendly.com/alex-zypflow/30min';

const HERO_METRICS = [
  { value: '<5 min', label: 'First response' },
  { value: '7-layer', label: 'Patient journey' },
  { value: '95%', label: 'Reminder coverage' },
];

export function GlobeHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);

  // Detect mobile + WebGL on mount
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setWebGLSupported(false);
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  const showGlobe = !isMobile && webGLSupported;

  // Scroll-based opacity for text layers
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Text fades in as you scroll past the globe
  const textOpacity = useTransform(scrollYProgress, [0.15, 0.35], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.15, 0.35], [60, 0]);

  // Metrics fade in later
  const metricsOpacity = useTransform(scrollYProgress, [0.3, 0.45], [0, 1]);
  const metricsY = useTransform(scrollYProgress, [0.3, 0.45], [40, 0]);

  // Dashboard fades in last
  const dashboardOpacity = useTransform(scrollYProgress, [0.42, 0.58], [0, 1]);
  const dashboardY = useTransform(scrollYProgress, [0.42, 0.58], [80, 0]);
  const dashboardScale = useTransform(scrollYProgress, [0.42, 0.58], [0.92, 1]);

  return (
    <section
      ref={sectionRef}
      id="globe-section"
      className="relative"
      style={{ height: showGlobe ? '350vh' : '100vh' }}
    >
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        {/* 3D Globe background — desktop only */}
        {showGlobe && (
          <div className="absolute inset-0 z-0">
            <GlobeScene />
          </div>
        )}

        {/* Mobile fallback — gradient mesh */}
        {!showGlobe && (
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <div className="absolute -left-[20%] -top-[10%] h-[70%] w-[70%] rounded-full bg-brand-purple/[0.08] blur-[120px] animate-mesh-1" />
            <div className="absolute -right-[15%] top-[15%] h-[55%] w-[55%] rounded-full bg-[#a855f7]/[0.06] blur-[100px] animate-mesh-2" />
            <div className="absolute bottom-[5%] left-[30%] h-[40%] w-[40%] rounded-full bg-teal-500/[0.04] blur-[100px] animate-mesh-3" />
          </div>
        )}

        {/* Content overlay */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
          {/* Eyebrow + Headline — on mobile these are immediately visible */}
          {showGlobe ? (
            <motion.div style={{ opacity: textOpacity, y: textY }}>
              <HeroContent />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <HeroContent />
            </motion.div>
          )}

          {/* CTA buttons */}
          {showGlobe ? (
            <motion.div style={{ opacity: textOpacity, y: textY }} className="mt-12">
              <CTAButtons />
            </motion.div>
          ) : (
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <CTAButtons />
            </motion.div>
          )}

          {/* Metrics strip */}
          {showGlobe ? (
            <motion.div style={{ opacity: metricsOpacity, y: metricsY }} className="mt-16">
              <MetricsStrip />
            </motion.div>
          ) : (
            <motion.div
              className="mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.7 }}
            >
              <MetricsStrip />
            </motion.div>
          )}

          {/* Dashboard preview */}
          {showGlobe ? (
            <motion.div style={{ opacity: dashboardOpacity, y: dashboardY, scale: dashboardScale }} className="mt-16">
              <DashboardPreview />
            </motion.div>
          ) : (
            <motion.div
              className="mt-16"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <DashboardPreview />
            </motion.div>
          )}
        </div>

        {/* Scroll hint — only on desktop with globe */}
        {showGlobe && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <motion.div
              className="mx-auto flex h-10 w-6 items-start justify-center rounded-full border border-[var(--app-border)] p-1.5"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <motion.div
                className="h-2 w-1 rounded-full bg-brand-purple"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[var(--app-text-soft)]">
              Scroll to explore
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function HeroContent() {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <span className="chip chip-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-purple animate-pulse" />
          Now onboarding London clinics
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          3 pilot spots left
        </span>
      </div>

      <div className="mt-10 max-w-5xl sm:mt-14">
        <h1 className="editorial-heading">
          Your clinic&apos;s{' '}
          <br className="hidden sm:block" />
          revenue system,{' '}
          <span className="gradient-text">automated.</span>
        </h1>

        <div className="mt-8 h-[2px] w-24 bg-gradient-to-r from-brand-purple to-brand-purple/0" />

        <p className="mt-6 max-w-2xl editorial-body">
          Faster first responses. Stronger booking conversion.
          Fewer no-shows. More repeat patients. All running while you
          focus on what you do best.
        </p>
      </div>
    </>
  );
}

function CTAButtons() {
  return (
    <div className="flex flex-wrap items-center gap-4">
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
  );
}

function MetricsStrip() {
  return (
    <div className="flex flex-wrap gap-12 border-t border-[var(--app-border)] pt-8">
      {HERO_METRICS.map((metric) => (
        <div key={metric.label}>
          <p className="text-3xl font-semibold tracking-tight text-[var(--app-text)] sm:text-4xl">
            {metric.value}
          </p>
          <p className="mt-1 text-sm text-[var(--app-text-soft)]">{metric.label}</p>
        </div>
      ))}
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)] p-1 shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
      <div className="rounded-[28px] bg-gradient-to-br from-[var(--app-surface-strong)] to-[var(--app-muted)] p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Leads this week', value: '14', change: '+38%' },
            { title: 'Consults booked', value: '6', change: '+22%' },
            { title: 'Median response', value: '2m 31s', change: '-64%' },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5 transition-transform duration-200 hover:-translate-y-1"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
                {card.title}
              </p>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-3xl font-semibold tabular-nums text-[var(--app-text)]">
                  {card.value}
                </p>
                <span className="mb-1 text-xs font-semibold text-emerald-500">{card.change}</span>
              </div>
            </div>
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
  );
}
