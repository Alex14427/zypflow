import type { Metadata } from 'next';
import Link from 'next/link';
import { AuditForm } from '@/components/public/audit-form';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { formatCurrencyGBP } from '@/lib/formatting';

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://calendly.com/alex-zypflow/30min';

export const metadata: Metadata = {
  title: 'Zypflow | Revenue OS For Aesthetics Clinics',
  description:
    'The automated revenue operating system for London aesthetics clinics: faster lead response, stronger booking conversion, fewer no-shows, and more repeat revenue.',
};

const HERO_POINTS = [
  'Reply to warm enquiries in seconds, not the next morning.',
  'Protect booked consults with reminders, confirmations, and recovery prompts.',
  'Turn appointments into reviews, rebookings, and repeat patient revenue.',
  'Run alongside Fresha, Phorest, Vagaro, WhatsApp, Stripe, and your existing stack.',
];

const TRUST_LOGOS = ['Fresha', 'Phorest', 'Vagaro', 'Stripe', 'Resend', 'Twilio', 'WhatsApp', 'Calendly'];

const PROOF_STATS = [
  {
    value: '<5 min',
    label: 'target first-response window',
    detail: 'The first touch decides whether the enquiry cools off or converts.',
  },
  {
    value: '7 touchpoints',
    label: 'protected patient journey',
    detail: 'Lead reply, booking prompt, reminders, review ask, and rebooking layers.',
  },
  {
    value: '1 calm workspace',
    label: 'for clinic owners',
    detail: 'A control surface that answers what happened, what matters, and what needs attention.',
  },
  {
    value: 'weekly proof',
    label: 'for retention',
    detail: 'Bookings, no-show risk, reviews, and repeat demand reported in one rhythm.',
  },
];

const PRODUCT_TRACKS = [
  {
    title: 'Convert the first enquiry',
    eyebrow: 'Lead capture',
    body: 'Website, widget, form, SMS, and email enquiries land in one operating layer. Warm demand gets answered and routed before it goes cold.',
    bullets: ['AI first response', 'lead qualification', 'booking CTA routing'],
  },
  {
    title: 'Protect the booked consult',
    eyebrow: 'Appointment protection',
    body: 'Confirmed appointments stay protected with reminders, confirmations, and reschedule recovery instead of manual chasing.',
    bullets: ['48h, 24h, and 2h reminders', 'no-show risk visibility', 'reschedule recovery'],
  },
  {
    title: 'Extend patient value',
    eyebrow: 'Retention engine',
    body: 'Every completed visit becomes a chance to win a review, bring the patient back, and compound the clinic’s revenue base.',
    bullets: ['review requests', 'reactivation sequences', 'rebooking nudges'],
  },
];

const SURFACES = [
  {
    title: 'Audit first',
    eyebrow: 'Public proof layer',
    body: 'The Revenue Leak Audit turns the sales conversation into a diagnosis, not a generic demo.',
  },
  {
    title: 'Operate clearly',
    eyebrow: 'Founder surface',
    body: 'Prospects, readiness, live clinics, proof signals, and automations all in one operator view.',
  },
  {
    title: 'Feel calm after buying',
    eyebrow: 'Client surface',
    body: 'Clinic owners see bookings, proof, health, and next actions without being buried in system noise.',
  },
];

const DIFFERENTIATORS = [
  {
    title: 'Not another booking platform',
    body: 'Booking software manages the diary. Zypflow closes the gaps around the diary: reply speed, conversion, reminders, reviews, and return visits.',
  },
  {
    title: 'Not a vague AI promise',
    body: 'The rollout is specific: one audit, one workflow pack, one founder-led launch path, one weekly proof cadence.',
  },
  {
    title: 'Not agency chaos',
    body: 'No custom maze. No “we can do everything.” A tighter system makes automation more reliable and margins healthier.',
  },
];

const LAUNCH_STEPS = [
  'Run the Revenue Leak Audit and show the clinic exactly where booking intent is leaking.',
  'Approve fit, collect onboarding, and activate one branded clinic workspace.',
  'Deploy the workflow pack across lead reply, appointment protection, and proof reporting.',
  'Use founder and clinic dashboards to keep the system compounding instead of drifting.',
];

const FAQS = [
  {
    question: 'Why lead with an audit instead of a demo?',
    answer:
      'Because clinics care about where revenue is leaking, not a feature tour. The audit makes the problem concrete before we talk about deployment.',
  },
  {
    question: 'Do clinics need to replace their booking software?',
    answer:
      'No. Zypflow is built as an overlay. It works alongside the tools clinics already use and fixes the conversion and retention gaps around them.',
  },
  {
    question: 'What happens after the clinic buys?',
    answer:
      'They land in a guided setup path, get one branded workflow deployed, and then see proof, health, and next actions in the client dashboard rather than a generic settings maze.',
  },
];

const HOME_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Zypflow',
      url: 'https://zypflow.co.uk',
      description:
        'Automated revenue operating system for aesthetics clinics: enquiry conversion, appointment protection, reviews, and repeat revenue.',
    },
    {
      '@type': 'Service',
      name: 'Zypflow Founding Pilot',
      provider: {
        '@type': 'Organization',
        name: 'Zypflow',
      },
      areaServed: 'London',
      audience: {
        '@type': 'Audience',
        audienceType: 'Aesthetics clinics',
      },
      description:
        'Founder-led launch for clinics that want faster lead response, stronger booking conversion, fewer no-shows, and better patient return.',
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

export default function Home() {
  return (
    <div className="app-shell">
      <div className="ambient-orb ambient-orb-left" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-right" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-5 pb-20 pt-5 sm:px-8">
        <SiteHeader eyebrow="Revenue OS for aesthetics clinics" />

        <main className="mx-auto max-w-6xl space-y-12">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_SCHEMA) }}
          />

          <section className="hero-grid items-start">
            <div className="space-y-6 reveal-up">
              <div className="flex flex-wrap gap-2">
                <span className="chip chip-strong float-soft">London aesthetics clinics first</span>
                <span className="chip">Founder-led rollout</span>
                <span className="chip">Automation-first</span>
              </div>

              <div className="space-y-5">
                <h1 className="max-w-5xl text-5xl font-semibold leading-[0.9] text-[var(--app-text)] sm:text-6xl">
                  The clinic revenue system that makes your front desk feel faster, calmer, and harder to outgrow.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-[var(--app-text-muted)]">
                  Zypflow is built for clinics that already have demand and want a sharper operating layer around it:
                  faster first responses, stronger booking conversion, fewer no-shows, and more repeat patient value.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {HERO_POINTS.map((point) => (
                  <div
                    key={point}
                    className="surface-panel hover-lift rounded-[26px] px-4 py-4 text-sm font-medium leading-7 text-[var(--app-text-muted)]"
                  >
                    {point}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-primary"
                  data-testid="hero-audit-link"
                >
                  Book Your Free Audit
                </a>
                <Link href="/pricing" className="button-secondary" data-testid="hero-offer-link">
                  See The Founding Offer
                </Link>
              </div>
            </div>

            <div className="space-y-4 reveal-up reveal-delay-1">
              <div className="hero-showcase">
                <div className="hero-showcase-grid" aria-hidden="true">
                  <div className="hero-showcase-card hero-showcase-card-primary">
                    <p className="page-eyebrow">Founder surface</p>
                    <h2 className="mt-3 text-2xl font-semibold text-[var(--app-text)]">
                      One operating layer across audits, launches, proof, and live clinics.
                    </h2>
                    <div className="mt-5 grid gap-3">
                      {[
                        ['14', 'audits opened this week'],
                        ['6', 'clinics in activation'],
                        ['2m 31s', 'median first-response time'],
                      ].map(([value, detail]) => (
                        <div
                          key={detail}
                          className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-4"
                        >
                          <p className="text-2xl font-semibold text-[var(--app-text)]">{value}</p>
                          <p className="mt-1 text-sm text-[var(--app-text-muted)]">{detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hero-showcase-card">
                    <p className="page-eyebrow">Client surface</p>
                    <h3 className="mt-3 text-xl font-semibold text-[var(--app-text)]">
                      What clinic owners actually see
                    </h3>
                    <div className="mt-4 space-y-3">
                      {[
                        'This week: 11 leads captured, 5 consults booked, 3 review requests sent',
                        'No-show risk: 2 appointments need confirmation today',
                        `Estimated protected revenue: ${formatCurrencyGBP(4200)}`,
                      ].map((item) => (
                        <div
                          key={item}
                          className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-3 text-sm leading-6 text-[var(--app-text-muted)]"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="public-frame">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="page-eyebrow">Revenue Leak Audit</p>
                    <h2
                      className="mt-3 text-3xl font-semibold text-[var(--app-text)]"
                      data-testid="audit-intro-heading"
                    >
                      Show the clinic what is leaking before asking them to trust a new system.
                    </h2>
                  </div>
                  <span className="chip">Week-one wedge</span>
                </div>
                <div className="mt-5">
                  <AuditForm />
                </div>
              </div>
            </div>
          </section>

          <section className="trust-marquee" aria-label="platforms Zypflow works with">
            {TRUST_LOGOS.map((item) => (
              <div key={item} className="trust-pill">
                {item}
              </div>
            ))}
          </section>

          <section id="proof" className="metric-strip">
            {PROOF_STATS.map((item) => (
              <div key={item.label} className="kpi-tile hover-lift reveal-up">
                <p className="page-eyebrow">{item.label}</p>
                <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">{item.value}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">{item.detail}</p>
              </div>
            ))}
          </section>

          <section id="product" className="surface-panel rounded-[36px] p-6 sm:p-8">
            <div className="section-grid items-start">
              <div>
                <p className="page-eyebrow">Why this feels like a product, not a patchwork</p>
                <h2 className="mt-3 max-w-2xl text-4xl font-semibold text-[var(--app-text)]">
                  Every important moment in the clinic journey gets its own system, not its own spreadsheet.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--app-text-muted)]">
                  The best software companies do not just explain what the tool does. They make the operating model feel inevitable. That is the standard we are pushing toward here.
                </p>
              </div>
              <div className="space-y-4">
                {SURFACES.map((surface) => (
                  <div
                    key={surface.title}
                    className="hover-lift rounded-[28px] border border-[var(--app-border)] bg-[var(--app-muted)] p-5"
                  >
                    <p className="page-eyebrow">{surface.eyebrow}</p>
                    <h3 className="mt-3 text-2xl font-semibold text-[var(--app-text)]">{surface.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">{surface.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="how-it-works" className="grid gap-4 lg:grid-cols-3">
            {PRODUCT_TRACKS.map((track) => (
              <div key={track.title} className="surface-panel hover-lift rounded-[32px] p-6">
                <p className="page-eyebrow">{track.eyebrow}</p>
                <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">{track.title}</h2>
                <p className="mt-4 text-sm leading-7 text-[var(--app-text-muted)]">{track.body}</p>
                <div className="mt-5 space-y-2">
                  {track.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-3 text-sm font-medium text-[var(--app-text-muted)]"
                    >
                      {bullet}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="surface-panel rounded-[36px] p-6 sm:p-8">
            <div className="section-grid items-start">
              <div>
                <p className="page-eyebrow">What the first 14 days look like</p>
                <h2 className="mt-3 max-w-2xl text-4xl font-semibold text-[var(--app-text)]">
                  Buyers do not just need a promise. They need to picture what happens after they say yes.
                </h2>
              </div>
              <div className="space-y-4">
                {LAUNCH_STEPS.map((step, index) => (
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

          <section id="trust" className="grid gap-4 lg:grid-cols-3">
            {DIFFERENTIATORS.map((item) => (
              <div key={item.title} className="glass-panel hover-lift rounded-[32px] p-6">
                <p className="page-eyebrow">Why it wins</p>
                <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">{item.body}</p>
              </div>
            ))}
          </section>

          <section className="section-grid">
            <div className="public-frame">
              <p className="page-eyebrow">Founding pilot</p>
              <div className="mt-4 flex items-end gap-3">
                <h2 className="text-5xl font-semibold text-[var(--app-text)]">{formatCurrencyGBP(995)}</h2>
                <p className="pb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
                  per month
                </p>
              </div>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                {formatCurrencyGBP(495)} setup | 60-day pilot | 1 clinic | 1 workflow pack
              </p>
              <div className="mt-6 space-y-3 text-sm leading-7 text-[var(--app-text-muted)]">
                <p>Designed for clinics that already have enquiries and want a tighter conversion and retention system.</p>
                <p>Not designed for multi-location rollout, generic agency requests, or a broad DIY software path.</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="button-primary">
                  Book Your Audit
                </a>
                <Link href="/pricing" className="button-secondary">
                  Review the commercial terms
                </Link>
              </div>
            </div>

            <div className="surface-panel rounded-[36px] p-6 sm:p-8">
              <p className="page-eyebrow">FAQ</p>
              <div className="mt-5 space-y-4">
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
