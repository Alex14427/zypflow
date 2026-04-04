'use client';

import { useState, useEffect, useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface AuditResult {
  url: string;
  score_performance: number;
  score_seo: number;
  score_accessibility: number;
  has_ssl: boolean;
  is_mobile_friendly: boolean;
  ai_summary?: string;
}

type PageState = 'idle' | 'loading' | 'results' | 'error';

// ── Score Circle ─────────────────────────────────────────────────────────────

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const [animated, setAnimated] = useState(0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  const color =
    score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(score), 120);
    return () => clearTimeout(timeout);
  }, [score]);

  const offset = circumference - (animated / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 100 100"
        >
          {/* Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#1f1f2e"
            strokeWidth="8"
          />
          {/* Progress */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color }}
          >
            {Math.round(animated)}
          </span>
        </div>
      </div>
      <span className="text-sm font-medium text-gray-400 tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}

// ── Loading Steps ─────────────────────────────────────────────────────────────

const STEPS = [
  'Connecting…',
  'Analysing performance…',
  'Checking SEO…',
  'Scanning security…',
  'Generating report…',
];

function LoadingView() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 2000);
    return () => clearInterval(stepInterval);
  }, []);

  useEffect(() => {
    const target = ((stepIndex + 1) / STEPS.length) * 100;
    const tick = setInterval(() => {
      setProgress((p) => {
        if (p >= target) {
          clearInterval(tick);
          return target;
        }
        return p + 1;
      });
    }, 20);
    return () => clearInterval(tick);
  }, [stepIndex]);

  return (
    <div className="flex flex-col items-center gap-8 py-16">
      {/* Pulsing ring */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#6c3cff] opacity-20 animate-ping" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#6c3cff]">
          <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
          </svg>
        </span>
      </div>

      {/* Step label */}
      <p className="text-lg font-medium text-white min-h-[1.75rem] transition-all duration-500">
        {STEPS[stepIndex]}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#6c3cff] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`transition-colors duration-300 ${
                i <= stepIndex ? 'text-[#6c3cff]' : 'text-gray-600'
              }`}
            >
              ●
            </span>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500">This takes about 30 seconds…</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [state, setState] = useState<PageState>('idle');
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setState('loading');
    setResult(null);
    setErrorMsg('');
    setEmailSubmitted(false);
    setAiSummary('');

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server error ${res.status}`);
      }

      const data: AuditResult = await res.json();
      setResult(data);
      setState('results');

      // Scroll down to results after a short delay
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setState('error');
    }
  }

  async function handleEmailGate(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !result) return;

    setEmailLoading(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: result.url, email: email.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server error ${res.status}`);
      }

      const data: AuditResult = await res.json();
      setAiSummary(data.ai_summary ?? '');
      setEmailSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setEmailLoading(false);
    }
  }

  function handleRetry() {
    setState('idle');
    setErrorMsg('');
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold tracking-tight">
              Zyp<span className="text-[#6c3cff]">flow</span>
            </span>
          </a>
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </div>
      </header>

      {/* ── Hero / Input ───────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#6c3cff]/30 bg-[#6c3cff]/10 text-[#8b6aff] text-xs font-medium mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6c3cff] animate-pulse" />
            Free — No sign-up required
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-5">
            Free Website Audit
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto mb-12 leading-relaxed">
            Get your website&apos;s performance, SEO, accessibility, and security scores in 30 seconds.
          </p>

          {/* URL Form */}
          <form onSubmit={handleAudit} className="w-full max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter your website URL…"
                required
                disabled={state === 'loading'}
                className="flex-1 px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500
                  focus:outline-none focus:border-[#6c3cff] focus:ring-2 focus:ring-[#6c3cff]/20
                  disabled:opacity-50 text-base transition-colors"
              />
              <button
                type="submit"
                disabled={state === 'loading' || !url.trim()}
                className="px-6 py-4 rounded-xl font-semibold text-base bg-[#6c3cff] hover:bg-[#5a2de0]
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                  shadow-lg shadow-[#6c3cff]/25 hover:shadow-[#6c3cff]/40 whitespace-nowrap"
              >
                Audit My Website
              </button>
            </div>
          </form>

          {/* Loading */}
          {state === 'loading' && (
            <div className="mt-12">
              <LoadingView />
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="mt-10 p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-left max-w-xl mx-auto">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-400 font-medium text-sm mb-1">Audit failed</p>
                  <p className="text-gray-400 text-sm">{errorMsg}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="mt-4 text-sm text-[#6c3cff] hover:text-[#8b6aff] transition-colors font-medium"
              >
                Try again →
              </button>
            </div>
          )}
        </section>

        {/* ── Results ──────────────────────────────────────────────────────── */}
        {state === 'results' && result && (
          <section ref={resultsRef} className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">

            {/* URL banner */}
            <div className="text-center mb-10">
              <p className="text-sm text-gray-500">
                Results for{' '}
                <span className="text-[#8b6aff] font-medium">{result.url}</span>
              </p>
            </div>

            {/* Score cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              {[
                { label: 'Performance', score: result.score_performance },
                { label: 'SEO', score: result.score_seo },
                { label: 'Accessibility', score: result.score_accessibility },
                { label: 'Security', score: result.has_ssl ? 100 : 0 },
              ].map(({ label, score }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/8 bg-white/3
                    hover:border-white/15 transition-colors"
                >
                  <ScoreCircle score={score} label={label} />
                </div>
              ))}
            </div>

            {/* Mobile Friendly badge */}
            <div className="flex justify-center mb-10">
              <div
                className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-sm font-medium
                  ${result.is_mobile_friendly
                    ? 'border-green-500/25 bg-green-500/8 text-green-400'
                    : 'border-red-500/25 bg-red-500/8 text-red-400'
                  }`}
              >
                {result.is_mobile_friendly ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {result.is_mobile_friendly ? 'Mobile Friendly' : 'Not Mobile Friendly'}
              </div>
            </div>

            {/* Email gate */}
            <div className="rounded-2xl border border-[#6c3cff]/25 bg-gradient-to-br from-[#6c3cff]/8 to-transparent p-8">
              {!emailSubmitted ? (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">
                      Want the full AI-powered analysis?
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
                      Get specific recommendations tailored to your website — completely free.
                    </p>
                  </div>
                  <form onSubmit={handleEmailGate} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email…"
                      required
                      disabled={emailLoading}
                      className="flex-1 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500
                        focus:outline-none focus:border-[#6c3cff] focus:ring-2 focus:ring-[#6c3cff]/20
                        disabled:opacity-50 text-sm transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={emailLoading || !email.trim()}
                      className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-[#6c3cff] hover:bg-[#5a2de0]
                        disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                        shadow-lg shadow-[#6c3cff]/20 whitespace-nowrap"
                    >
                      {emailLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
                          </svg>
                          Generating…
                        </span>
                      ) : (
                        'Get Full Report'
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div>
                  {/* Success banner */}
                  <div className="flex items-center gap-2.5 mb-6 p-3 rounded-xl bg-green-500/8 border border-green-500/20">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-400">
                      We&apos;ve emailed you a copy of this report.
                    </p>
                  </div>

                  {/* AI Summary */}
                  {aiSummary && (
                    <div>
                      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#6c3cff] animate-pulse" />
                        AI-Powered Analysis
                      </h3>
                      <div className="prose prose-sm prose-invert max-w-none">
                        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap rounded-xl bg-white/3 border border-white/8 p-5">
                          {aiSummary}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ── Footer CTA ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#0a0a0f]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6c3cff] mb-4">
            Next step
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Want Zypflow to handle your leads automatically?
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm sm:text-base">
            Turn website visitors into booked clients — on autopilot.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-[#6c3cff] hover:bg-[#5a2de0]
              transition-all duration-200 shadow-xl shadow-[#6c3cff]/30 hover:shadow-[#6c3cff]/50 text-sm sm:text-base"
          >
            Start Free Trial
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <p className="mt-5 text-xs text-gray-600">No credit card required · 14-day free trial</p>
        </div>

        <div className="border-t border-white/5 py-6 text-center">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Zypflow Ltd · All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
