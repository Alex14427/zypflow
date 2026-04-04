import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { formatCurrencyGBP } from '@/lib/formatting';

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://calendly.com/alex-zypflow/30min';

export const metadata: Metadata = {
  title: 'Zypflow | Founding Pilot Offer',
  description:
    'Review the founding pilot for Zypflow: a managed, automation-first launch for aesthetics clinics that want more booked consults and better patient retention.',
};

const INCLUDED = [
  'Revenue Leak Audit and founder-led launch planning',
  'Automated lead reply across web, chat, SMS, and email',
  'Reminder and confirmation workflows that protect booked consults',
  'Review request and rebooking automation after appointments',
  'Founder portal oversight plus weekly ROI reporting',
  'One location, one branded workspace, and one standardized onboarding path',
];

const NOT_INCLUDED = [
  'Voice AI in the first release',
  'Multi-location routing',
  'Bespoke agency projects',
  'Unlimited SMS usage or unbounded support requests',
];

const TRACKED = [
  'Reply speed from first enquiry',
  'Booked consult volume',
  'Reminder coverage and no-show risk',
  'Review request completion',
  'Patient return and rebooking signals',
  'Clinic health and churn risk',
];

const LAUNCH_PATH = [
  'Audit the public site and pinpoint where booking intent is leaking.',
  'Approve fit, collect onboarding details, and activate billing before deployment.',
  'Launch the workflow pack, brand the workspace, and verify the first live flows.',
  'Report weekly on what moved: speed, bookings, reviews, and patient return signals.',
];

const FIT = [
  'Independent aesthetics clinics with one location',
  'Owner-led teams already handling enquiries manually',
  'Clinics using existing booking software but needing a better conversion layer',
];

const NOT_FIT = [
  'Businesses looking for a broad DIY marketing platform',
  'Clinics needing multi-location routing immediately',
  'Teams expecting custom agency work outside the pilot scope',
];

const TRUST_NOTES = [
  'No rip-and-replace: Zypflow sits on top of the booking tools clinics already use.',
  'One founder-led rollout path from audit to activation to weekly proof.',
  'A client portal for clinic owners and a founder portal for operator control.',
  'Weekly reporting focused on reply speed, booked consults, no-show risk, reviews, and patient return.',
];

const FAQS = [
  {
    question: 'Why a setup fee as well as monthly pricing?',
    answer:
      'Because the first 14 days are deployment-heavy: audit review, onboarding, workflow launch, and founder oversight. The setup fee keeps the model disciplined and the launch properly resourced.',
  },
  {
    question: 'Why not offer a free trial?',
    answer:
      'The first version works best as a managed launch. That is how we keep the system standardized, profitable, and strong enough to prove value quickly.',
  },
  {
    question: 'What happens after the 60-day pilot?',
    answer:
      'If the clinic is seeing value, we continue monthly and expand only where it improves revenue, retention, or automation. If fit is poor, we stop without dragging everyone into a bloated setup.',
  },
];

const PRICING_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Offer',
      name: 'Zypflow Founding Pilot',
      priceCurrency: 'GBP',
      price: '995',
      url: 'https://zypflow.co.uk/pricing',
      category: 'Clinic automation pilot',
      description:
        'Managed launch for one aesthetics clinic with lead reply, reminders, reviews, rebooking, and weekly reporting.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ],
};

export default function PricingPage() {
  return (
    <div className="app-shell">
      <div className="ambient-orb ambient-orb-left" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-right" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-5 pb-20 pt-5 sm:px-8">
        <SiteHeader eyebrow="Founding clinic offer" showOfferLink={false} />

        <main className="mx-auto max-w-6xl space-y-12">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_SCHEMA) }}
          />

          <section className="hero-grid items-start">
            <div className="space-y-6 reveal-up">
              <div className="flex flex-wrap gap-2">
                <span className="chip chip-strong">Managed product first</span>
                <span className="chip">One clinic</span>
                <span className="chip">60-day minimum</span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-5xl font-semibold leading-[0.9] text-[var(--app-text)] sm:text-6xl">
                  The founding pilot for clinics that want a tighter revenue system, not more software admin.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-[var(--app-text-muted)]">
                  This is a founder-led deployment for one clinic, one workflow pack, and one clear commercial target:
                  better enquiry conversion, stronger appointment protection, and more patient return.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="kpi-tile hover-lift">
                  <p className="page-eyebrow">Price</p>
                  <h2 className="mt-3 text-4xl font-semibold text-[var(--app-text)]">{formatCurrencyGBP(995)}/mo</h2>
                  <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                    Plus {formatCurrencyGBP(495)} setup | 60-day minimum
                  </p>
                </div>
                <div className="kpi-tile hover-lift">
                  <p className="page-eyebrow">Best fit</p>
                  <h2 className="mt-3 text-4xl font-semibold text-[var(--app-text)]">1 clinic</h2>
                  <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                    Owner-led, appointment-based, already getting demand
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="button-primary">
                  Book A Free Audit
                </a>
                <Link href="/login" className="button-secondary">
                  Approved clinics log in
                </Link>
              </div>
            </div>

            <div className="space-y-4 reveal-up reveal-delay-1">
              <div className="public-frame">
                <p className="page-eyebrow">What the pilot is designed to prove</p>
                <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">
                  That the clinic can tighten the path between first enquiry and repeat visit.
                </h2>
                <div className="mt-5 grid gap-3">
                  {TRACKED.slice(0, 4).map((item) => (
                    <div
                      key={item}
                      className="hover-lift rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-4 text-sm font-medium text-[var(--app-text-muted)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pricing-checklist">
                <div className="pricing-checklist-row">
                  <span>Setup fee</span>
                  <strong>{formatCurrencyGBP(495)}</strong>
                </div>
                <div className="pricing-checklist-row">
                  <span>Monthly pilot</span>
                  <strong>{formatCurrencyGBP(995)}</strong>
                </div>
                <div className="pricing-checklist-row">
                  <span>Initial term</span>
                  <strong>60 days</strong>
                </div>
                <div className="pricing-checklist-row">
                  <span>Clinic count</span>
                  <strong>1 location</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="section-grid">
            <div className="surface-panel rounded-[36px] p-6 sm:p-8">
              <p className="page-eyebrow">Included</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--app-text-muted)]">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel rounded-[36px] p-6 sm:p-8">
              <p className="page-eyebrow">Not included in the first release</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--app-text-muted)]">
                {NOT_INCLUDED.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[var(--app-text-soft)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="surface-panel rounded-[36px] p-6 sm:p-8">
            <div className="section-grid items-start">
              <div>
                <p className="page-eyebrow">Launch path</p>
                <h2 className="mt-3 max-w-2xl text-4xl font-semibold text-[var(--app-text)]">
                  The first 60 days are designed to get live, prove value, and stay disciplined.
                </h2>
              </div>
              <div className="space-y-4">
                {LAUNCH_PATH.map((step, index) => (
                  <div
                    key={step}
                    className="hover-lift rounded-[28px] border border-[var(--app-border)] bg-[var(--app-muted)] p-5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="step-badge">0{index + 1}</span>
                      <p className="text-sm leading-7 text-[var(--app-text-muted)]">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="section-grid">
            <div className="surface-panel rounded-[36px] p-6 sm:p-8">
              <p className="page-eyebrow">Ideal fit</p>
              <div className="mt-4 space-y-3">
                {FIT.map((item) => (
                  <div
                    key={item}
                    className="hover-lift rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4 text-sm font-medium text-[var(--app-text-muted)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-panel rounded-[36px] p-6 sm:p-8">
              <p className="page-eyebrow">Not ideal right now</p>
              <div className="mt-4 space-y-3">
                {NOT_FIT.map((item) => (
                  <div
                    key={item}
                    className="hover-lift rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4 text-sm font-medium text-[var(--app-text-muted)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="surface-panel rounded-[36px] p-6 sm:p-8">
            <div className="section-grid items-start">
              <div>
                <p className="page-eyebrow">Why the rollout feels safe</p>
                <h2 className="mt-3 max-w-2xl text-4xl font-semibold text-[var(--app-text)]">
                  Buyers need a trust story as much as they need a pricing page.
                </h2>
              </div>
              <div className="space-y-3">
                {TRUST_NOTES.map((item) => (
                  <div
                    key={item}
                    className="hover-lift rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4 text-sm font-medium text-[var(--app-text-muted)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="metric-strip">
            {TRACKED.map((item) => (
              <div key={item} className="kpi-tile hover-lift">
                <p className="page-eyebrow">Reported weekly</p>
                <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">{item}</h2>
              </div>
            ))}
          </section>

          <section className="surface-panel rounded-[36px] p-6 sm:p-8">
            <div className="section-grid items-start">
              <div>
                <p className="page-eyebrow">FAQ</p>
                <h2 className="mt-3 max-w-2xl text-4xl font-semibold text-[var(--app-text)]">
                  The commercial questions that matter before launch.
                </h2>
              </div>
              <div className="space-y-4">
                {FAQS.map((item) => (
                  <div
                    key={item.question}
                    className="hover-lift rounded-[28px] border border-[var(--app-border)] bg-[var(--app-muted)] p-5"
                  >
                    <h3 className="text-2xl font-semibold text-[var(--app-text)]">{item.question}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
