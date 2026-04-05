'use client';

import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState } from 'react';

const DEFAULT_BOOKING_URL = 'https://calendly.com/alex-zypflow/30min';

const NAV_ITEMS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#product', label: 'Product' },
  { href: '/#trust', label: 'Trust' },
];

export function SiteHeader({
  eyebrow = 'Clinic Revenue OS',
  showOfferLink = true,
}: {
  eyebrow?: string;
  showOfferLink?: boolean;
}) {
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_LINK || DEFAULT_BOOKING_URL;
  const { scrollY } = useScroll();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <>
      <header
        className={`sticky top-4 z-50 mx-auto mb-8 max-w-6xl overflow-hidden rounded-full px-4 py-2.5 transition-all duration-300 sm:px-5 sm:py-3 ${
          scrolled
            ? 'nav-glass shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
            : 'bg-[var(--app-surface)]/50 backdrop-blur-sm border border-transparent'
        } ${scrolled ? 'border border-[var(--app-border)]' : ''}`}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <motion.span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark text-sm font-bold text-white"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              Z
            </motion.span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--app-text)]">Zypflow</p>
              <p className="truncate text-[10px] uppercase tracking-[0.15em] text-[var(--app-text-soft)]">{eyebrow}</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="link-underline rounded-full px-4 py-2 text-sm font-medium text-[var(--app-text-muted)] transition-colors hover:text-[var(--app-text)]"
              >
                {item.label}
              </Link>
            ))}
            {showOfferLink && (
              <Link
                href="/pricing"
                className="link-underline rounded-full px-4 py-2 text-sm font-medium text-[var(--app-text-muted)] transition-colors hover:text-[var(--app-text)]"
              >
                Offer
              </Link>
            )}
            <div className="mx-1 h-5 w-px bg-[var(--app-border)]" />
            <ThemeToggle compact />
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--app-text-muted)] transition-colors hover:text-[var(--app-text)]"
            >
              Log in
            </Link>
            <motion.a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-dark px-5 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(210,102,69,0.25)]"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              Book Audit
            </motion.a>
          </nav>

          {/* Mobile nav */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle compact />
            <motion.a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-dark px-4 py-2 text-xs font-semibold text-white"
              whileTap={{ scale: 0.96 }}
            >
              Audit
            </motion.a>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]"
              aria-label="Toggle menu"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <motion.div
          className="fixed inset-x-4 top-20 z-40 overflow-hidden rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4 shadow-xl backdrop-blur-xl md:hidden"
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-muted)] hover:text-[var(--app-text)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-muted)] hover:text-[var(--app-text)]"
            >
              Founding offer
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-muted)] hover:text-[var(--app-text)]"
            >
              Log in
            </Link>
          </div>
        </motion.div>
      )}
    </>
  );
}
