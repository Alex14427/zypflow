'use client';

import { motion } from 'framer-motion';
import { FadeIn } from '@/components/animations';

const LOGOS = ['Fresha', 'Phorest', 'Vagaro', 'Stripe', 'WhatsApp', 'Calendly', 'Twilio', 'Resend'];

export function LogoStrip() {
  return (
    <section className="relative overflow-hidden border-y border-[var(--app-border)] bg-[var(--app-surface-strong)]/50 py-8">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeIn>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-[var(--app-text-soft)]">
            Works alongside the tools clinics already use
          </p>
        </FadeIn>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {LOGOS.map((logo, i) => (
            <FadeIn key={logo} delay={0.05 * i}>
              <motion.div
                className="text-sm font-semibold text-[var(--app-text-soft)] transition-colors hover:text-[var(--app-text)]"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                {logo}
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
