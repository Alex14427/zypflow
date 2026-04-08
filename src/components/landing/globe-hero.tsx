'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import posthog from 'posthog-js';
import { MagneticButton } from '@/components/animations';

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
  const [isMobile, setIsMobile] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);

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

  return (
    <section id="globe-section" className="relative min-h-screen overflow-hidden">
      {/* Globe — right side on desktop, full background on tablet */}
      {showGlobe && (
        <div className="absolute inset-y-0 right-0 z-0 w-full lg:w-[55%]">
          <GlobeScene />
        </div>
      )}

      {/* Mobile fallback gradient */}
      {!showGlobe && (
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <div className="absolute -left-[20%] -top-[10%] h-[70%] w-[70%] rounded-full bg-brand-purple/[0.08] blur-[120px] animate-mesh-1" />
          <div className="absolute -right-[15%] top-[15%] h-[55%] w-[55%] rounded-full bg-[#a855f7]/[0.06] blur-[100px] animate-mesh-2" />
          <div className="absolute bottom-[5%] left-[30%] h-[40%] w-[40%] rounded-full bg-teal-500/[0.04] blur-[100px] animate-mesh-3" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-5 py-24 sm:px-8">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="chip chip-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-purple animate-pulse" />
                Now onboarding UK businesses
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                3 pilot spots left
              </span>
            </div>

            <div className="mt-10 sm:mt-14">
              <h1 className="editorial-heading">
                Stop losing patients{' '}
                <br className="hidden sm:block" />
                to slow replies.{' '}
                <span className="gradient-text">Automate growth.</span>
              </h1>

              <div className="mt-8 h-[2px] w-24 bg-gradient-to-r from-brand-purple to-brand-purple/0" />

              <p className="mt-6 max-w-xl editorial-body">
                Zypflow replies to enquiries in under 5 minutes, protects every
                booking with smart reminders, and brings patients back automatically.
                Built for service businesses that are too busy delivering great
                work to chase leads manually.
              </p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="flex flex-wrap items-center gap-4">
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
              <MagneticButton as="a" href="/pricing" onClick={() => posthog.capture('cta_clicked', { cta: 'hero_see_pricing', location: 'hero' })} className="button-secondary px-7 py-4">
                See Pricing
              </MagneticButton>
            </div>
          </motion.div>

          {/* Metrics */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <div className="flex flex-wrap gap-8 border-t border-[var(--app-border)] pt-8 sm:gap-12">
              {HERO_METRICS.map((metric) => (
                <div key={metric.label}>
                  <p className="text-2xl font-semibold tracking-tight text-[var(--app-text)] sm:text-3xl">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-sm text-[var(--app-text-soft)]">{metric.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
