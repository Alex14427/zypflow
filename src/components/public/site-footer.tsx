'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FadeIn, MagneticButton } from '@/components/animations';

const DEFAULT_BOOKING_URL = 'https://calendly.com/alex-zypflow/30min';

const FOOTER_LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#product', label: 'Product' },
  { href: '/#proof', label: 'Proof layer' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/login', label: 'Client login' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export function SiteFooter() {
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_LINK || DEFAULT_BOOKING_URL;

  return (
    <footer className="mt-14">
      {/* Top divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--app-card-border)] to-transparent" />

      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          {/* Left — brand + CTA */}
          <FadeIn>
            <div>
              <div className="flex items-center gap-3">
                <motion.span
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark text-base font-bold text-white"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  Z
                </motion.span>
                <div>
                  <p className="text-lg font-semibold text-[var(--app-text)]">Zypflow</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--app-text-soft)]">Revenue OS</p>
                </div>
              </div>

              <h2 className="mt-8 max-w-lg text-3xl font-semibold tracking-tight text-[var(--app-text)] sm:text-4xl">
                Built to help clinics book faster, protect more appointments, and{' '}
                <span className="gradient-text">grow repeat revenue.</span>
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--app-text-muted)]">
                Founder-led launch, automation-first delivery, and a tighter operating system for clinics that want results without hiring more admin.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <MagneticButton
                  as="a"
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-dark px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(210,102,69,0.25)] transition-shadow hover:shadow-[0_16px_32px_rgba(210,102,69,0.35)]"
                >
                  Book audit
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </MagneticButton>
                <Link
                  href="/pricing"
                  className="inline-flex items-center rounded-full border border-[var(--app-border)] px-6 py-3 text-sm font-semibold text-[var(--app-text-muted)] transition hover:border-brand-purple/30 hover:text-[var(--app-text)]"
                >
                  See pricing
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* Right — links grid */}
          <FadeIn delay={0.15}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">Navigate</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {FOOTER_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-[var(--app-text-muted)] transition-all hover:border-[var(--app-border)] hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)]"
                  >
                    <svg className="h-3.5 w-3.5 text-[var(--app-text-soft)] transition-transform group-hover:translate-x-0.5 group-hover:text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">Current focus</p>
                <p className="mt-2 text-sm font-semibold text-[var(--app-text)]">London aesthetics clinics</p>
                <p className="mt-1 text-xs text-[var(--app-text-muted)]">Founder-led pilot — limited spots</p>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-[var(--app-border)] pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1 text-xs text-[var(--app-text-soft)]">
              <p>&copy; {new Date().getFullYear()} Zypflow Ltd. All rights reserved.</p>
              <p>London, United Kingdom &middot; <a href="mailto:hello@zypflow.co.uk" className="transition hover:text-[var(--app-text)]">hello@zypflow.co.uk</a></p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--app-text-soft)]">
              <Link href="/privacy" className="transition hover:text-[var(--app-text)]">Privacy</Link>
              <Link href="/terms" className="transition hover:text-[var(--app-text)]">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
