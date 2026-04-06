'use client';

import { FadeIn } from '@/components/animations';

const LOGOS = ['Fresha', 'Phorest', 'Vagaro', 'Stripe', 'WhatsApp', 'Calendly', 'Twilio', 'Resend'];

export function LogoStrip() {
  return (
    <section className="relative overflow-hidden border-y border-[var(--app-border)] py-8">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeIn>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-[var(--app-text-soft)]">
            Works alongside the tools clinics already use
          </p>
        </FadeIn>
      </div>

      {/* Infinite scroll marquee */}
      <div className="relative mt-6 overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--app-bg)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--app-bg)] to-transparent" />

        <div className="flex animate-marquee items-center gap-16 whitespace-nowrap">
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <span
              key={`${logo}-${i}`}
              className="text-sm font-semibold text-[var(--app-text-soft)] transition-colors hover:text-[var(--app-text)]"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
