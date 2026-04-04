import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { supabaseAdmin } from '@/lib/supabase';
import type { AuditReport } from '@/lib/audit-engine';

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://calendly.com/alex-zypflow/30min';

type AuditPageProps = {
  params: {
    id: string;
  };
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: AuditPageProps): Promise<Metadata> {
  const { data: audit } = await supabaseAdmin
    .from('audits')
    .select('id, url, raw_results')
    .eq('id', params.id)
    .maybeSingle();

  if (!audit) {
    return {
      title: 'Audit Report',
    };
  }

  const report = audit.raw_results as (AuditReport & {
    intake?: {
      business?: string;
    };
  });
  const businessName = report?.intake?.business || 'Clinic';

  return {
    title: `${businessName} Audit Report`,
    description: `Revenue Leak Audit for ${businessName}: the fastest conversion and retention gaps to fix first.`,
  };
}

function severityClasses(severity: 'high' | 'medium' | 'low') {
  if (severity === 'high') return 'bg-red-500/12 text-red-600 dark:text-red-200';
  if (severity === 'medium') return 'bg-amber-500/12 text-amber-600 dark:text-amber-200';
  return 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-200';
}

function gradeLabel(score: number) {
  if (score >= 80) return 'Strong base';
  if (score >= 60) return 'Needs tightening';
  return 'Leaking demand';
}

export default async function AuditReportPage({ params }: AuditPageProps) {
  const { data: audit } = await supabaseAdmin
    .from('audits')
    .select('id, url, email, created_at, raw_results, ai_summary')
    .eq('id', params.id)
    .maybeSingle();

  if (!audit) {
    notFound();
  }

  const report = audit.raw_results as (AuditReport & {
    intake?: {
      name?: string;
      business?: string;
      website?: string;
      email?: string;
      phone?: string;
    };
  });
  const safeReport: AuditReport & { intake?: { business?: string; website?: string } } = report || {
    overallScore: 0,
    finalUrl: audit.url,
    scanStatus: 'limited',
    generatedAt: audit.created_at,
    scorecards: [],
    leaks: [],
    wins: [],
    summary: {
      headline: 'Audit report unavailable',
      body: audit.ai_summary || 'This audit was captured before the new report format was added.',
      topLeak: null,
    },
    signals: {
      statusCode: null,
      fetchDurationMs: null,
      hasSsl: audit.url.startsWith('https://'),
      hasViewport: false,
      hasTitle: false,
      hasMetaDescription: false,
      hasH1: false,
      hasBookingLink: false,
      hasContactForm: false,
      hasPhone: false,
      hasEmail: false,
      hasReviewProof: false,
      hasFaq: false,
      hasOpenGraph: false,
      ctaCount: 0,
      scriptCount: 0,
      imageCount: 0,
      htmlWeightKb: 0,
      wordCount: 0,
    },
  };

  const businessName = safeReport?.intake?.business || 'This clinic';
  const intakeWebsite = safeReport?.intake?.website || audit.url;

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-5 sm:px-8">
        <SiteHeader eyebrow="Clinic audit report" />

        <main className="mx-auto max-w-6xl space-y-8">
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="public-frame">
              <p className="page-eyebrow">Audit summary</p>
              <h1 className="mt-3 text-5xl font-semibold leading-[0.95] text-slate-950 dark:text-white sm:text-6xl">
                {businessName} is leaking revenue in places that are fixable.
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                {safeReport.summary?.body || audit.ai_summary || 'We scanned the public website and highlighted the fastest conversion leaks to fix first.'}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <StatChip label="Website" value={intakeWebsite} />
                <StatChip label="Generated" value={new Date(audit.created_at).toLocaleString('en-GB')} />
                <StatChip label="Top leak" value={safeReport.summary?.topLeak || 'Conversion system needs tightening'} />
                <StatChip label="Scan status" value={safeReport.scanStatus === 'complete' ? 'Complete scan' : 'Limited scan'} />
              </div>
            </div>

            <div className="glass-panel rounded-[32px] p-6">
              <p className="page-eyebrow">Overall score</p>
              <div className="mt-4 flex items-end gap-3">
                <h2 className="text-6xl font-semibold text-slate-950 dark:text-white">{safeReport.overallScore}</h2>
                <p className="pb-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  /100
                </p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {gradeLabel(safeReport.overallScore)}. The fastest lift usually comes from tightening the booking path, trust proof,
                and follow-up after an enquiry lands.
              </p>
              <div className="mt-6 rounded-[28px] border border-slate-200/80 bg-white/80 p-5 dark:border-slate-700 dark:bg-slate-950/70">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">What Zypflow would automate first</p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  <li>Instant lead response the moment an enquiry lands</li>
                  <li>Booking nudges until the consult is confirmed</li>
                  <li>Reminder, review, and rebooking journeys once the patient is in your system</li>
                </ul>
              </div>
              <div className="mt-4 rounded-[28px] border border-slate-200/80 bg-white/80 p-5 dark:border-slate-700 dark:bg-slate-950/70">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">How this report was produced</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  This is a public-site diagnostic. We check the visible booking path, trust signals, mobile basics, contact capture, and the post-enquiry journey signals that usually affect conversion first.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {safeReport.scorecards.map((card) => (
              <div key={card.key} className="kpi-tile">
                <p className="page-eyebrow">{card.label}</p>
                <h2 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">{card.score}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{card.summary}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="surface-panel rounded-[32px] p-6">
              <p className="page-eyebrow">Top revenue leaks</p>
              <div className="mt-5 space-y-4">
                {safeReport.leaks.map((leak) => (
                  <div key={leak.id} className="rounded-[24px] border border-[var(--app-border)] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--app-text)]">{leak.headline}</p>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${severityClasses(leak.severity)}`}>
                        {leak.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">{leak.impact}</p>
                    <p className="mt-3 text-sm font-medium text-[var(--app-text)]">Recommended fix</p>
                    <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">{leak.action}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="surface-panel rounded-[32px] p-6">
                <p className="page-eyebrow">Signals we found</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <SignalTile label="SSL enabled" active={safeReport.signals.hasSsl} />
                  <SignalTile label="Mobile viewport" active={safeReport.signals.hasViewport} />
                  <SignalTile label="Booking path found" active={safeReport.signals.hasBookingLink} />
                  <SignalTile label="Contact form present" active={safeReport.signals.hasContactForm} />
                  <SignalTile label="Trust proof present" active={safeReport.signals.hasReviewProof} />
                  <SignalTile label="FAQ section found" active={safeReport.signals.hasFaq} />
                </div>
                <div className="mt-5 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4 text-sm leading-7 text-[var(--app-text-muted)]">
                  Confidence is highest on public-page issues like booking friction, CTA placement, trust proof, and missing contact paths. Deeper operational gaps still benefit from a live review with the clinic team.
                </div>
              </div>

              <div className="surface-panel rounded-[32px] p-6">
                <p className="page-eyebrow">What is already working</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {safeReport.wins.length > 0 ? (
                    safeReport.wins.map((win) => (
                      <div key={win} className="rounded-[24px] border border-[var(--app-border)] px-4 py-4">
                        {win}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[var(--app-border)] px-4 py-10 text-sm text-[var(--app-text-muted)]">
                      The site needs a stronger baseline before we can call out real strengths.
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel rounded-[32px] p-6">
                <p className="page-eyebrow">Next step</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
                  Turn this report into booked consults, not just notes.
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  We use this audit to deploy the first automation pack: enquiry capture, instant follow-up, booking prompts,
                  reminders, reviews, and rebooking.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-purple-dark"
                  >
                    Book Your Audit Call
                  </a>
                  <Link
                    href="/pricing"
                    className="rounded-full border border-slate-300/70 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-purple hover:text-brand-purple dark:border-slate-700 dark:text-slate-200"
                  >
                    See The Founding Offer
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="section-grid">
            <div className="surface-panel rounded-[32px] p-6">
              <p className="page-eyebrow">What high-converting clinic pages usually have in place</p>
              <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--app-text-muted)]">
                <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
                  A visible booking path near the first screen and repeated again mid-page.
                </div>
                <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
                  Reviews, before-and-after proof, or trust signals close to the CTA.
                </div>
                <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
                  Faster lead response once a form, chat, or callback request lands.
                </div>
              </div>
            </div>

            <div className="surface-panel rounded-[32px] p-6">
              <p className="page-eyebrow">Priority stack</p>
              <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--app-text-muted)]">
                <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Fix now</p>
                  <p className="mt-2">{safeReport.summary?.topLeak || 'Tighten the booking path and trust layer.'}</p>
                </div>
                <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Fix next</p>
                  <p className="mt-2">Move booking prompts, reminders, and review requests into one automated flow.</p>
                </div>
                <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Then scale</p>
                  <p className="mt-2">Only add more traffic after the conversion and retention path is stronger.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="surface-panel rounded-[32px] p-6 sm:p-8">
            <div className="section-grid items-start">
              <div>
                <p className="page-eyebrow">What this report does not do</p>
                <h2 className="mt-3 text-4xl font-semibold text-[var(--app-text)]">
                  This is a trustworthy first pass, not the whole implementation plan.
                </h2>
              </div>
              <div className="space-y-3">
                <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4 text-sm text-[var(--app-text-muted)]">
                  It does not inspect private booking-system data, staff workflow bottlenecks, or missed-call handling behind the scenes.
                </div>
                <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4 text-sm text-[var(--app-text-muted)]">
                  It does highlight the public conversion leaks that are usually easiest to fix first and easiest to prove commercially.
                </div>
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--app-text)] break-words">{value}</p>
    </div>
  );
}

function SignalTile({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
      <p className="text-sm font-semibold text-[var(--app-text)]">{label}</p>
      <p className={`mt-2 text-xs font-semibold uppercase tracking-[0.18em] ${active ? 'text-emerald-600 dark:text-emerald-200' : 'text-amber-600 dark:text-amber-200'}`}>
        {active ? 'Detected' : 'Needs work'}
      </p>
    </div>
  );
}
