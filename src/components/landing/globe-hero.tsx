'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { MagneticButton } from '@/components/animations';

// Dynamic import to avoid SSR issues with Three.js
const GlobeScene = dynamic(
  () => import('@/components/three/globe-scene').then((mod) => mod.GlobeScene),
  { ssr: false }
);

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://calendly.com/alex-zypflow/30min';

export function GlobeHero() {
  return (
    <section
      id="globe-section"
      className="relative"
      style={{ height: '300vh' }}
    >
      {/* Sticky container — globe + text stay pinned while user scrolls through */}
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* 3D Globe background */}
        <div className="absolute inset-0 z-0">
          <GlobeScene />
        </div>

        {/* Text overlay */}
        <div className="relative z-10 mx-auto max-w-5xl px-5 text-center sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="chip chip-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-purple animate-pulse" />
                Now onboarding London clinics
              </span>
            </div>
          </motion.div>

          <motion.h1
            className="mt-8 text-5xl font-semibold leading-[0.9] tracking-[-0.04em] text-[var(--app-text)] sm:text-7xl lg:text-8xl xl:text-[7rem]"
            style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Revenue system,{' '}
            <span className="gradient-text">automated.</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-xl text-base leading-7 text-[var(--app-text-muted)] sm:text-lg sm:leading-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            AI-powered patient acquisition for aesthetics clinics.
            Faster responses. More bookings. Zero admin overhead.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
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
              href="#how-it-works"
              className="button-secondary px-7 py-4"
            >
              See How It Works
            </MagneticButton>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            className="mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <motion.div
              className="mx-auto flex h-10 w-6 items-start justify-center rounded-full border border-[var(--app-border)] p-1.5"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="h-2 w-1 rounded-full bg-brand-purple"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-[var(--app-text-soft)]">
              Scroll to enter
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
