'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const COOKIE_KEY = 'zypflow_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  }

  function handleReject() {
    localStorage.setItem(COOKIE_KEY, 'rejected');
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-lg rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5 shadow-[var(--app-shadow)] backdrop-blur-xl sm:bottom-6 sm:left-6 sm:right-auto"
        >
          <p className="text-sm leading-6 text-[var(--app-text-muted)]">
            We use cookies to enhance your experience. By clicking &ldquo;Accept&rdquo;, you consent to our use of cookies.{' '}
            <Link href="/privacy" className="text-brand-purple hover:underline font-medium">
              Privacy policy
            </Link>
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleAccept}
              className="rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-dark px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Accept
            </button>
            <button
              onClick={handleReject}
              className="rounded-full border border-[var(--app-border)] px-5 py-2 text-sm font-semibold text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-hover)]"
            >
              Reject
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
