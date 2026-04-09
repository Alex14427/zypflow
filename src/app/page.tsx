import type { Metadata } from 'next';
import { AuditForm } from '@/components/public/audit-form';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { GlobeHero } from '@/components/landing/globe-hero';
import { LogoStrip } from '@/components/landing/logo-strip';
import { ProductSection } from '@/components/landing/product-section';
import { DifferentiatorsSection } from '@/components/landing/differentiators-section';
import { ResultsSection } from '@/components/landing/results-section';
import { CtaSection } from '@/components/landing/cta-section';
import { FaqSection } from '@/components/landing/faq-section';

export const metadata: Metadata = {
  title: 'Zypflow | Revenue OS For Service Businesses',
  description:
    'The automated revenue operating system for service businesses: faster lead response, stronger booking conversion, fewer no-shows, and more repeat revenue. Starting with UK aesthetics clinics.',
};

const FAQS = [
  {
    question: 'Why lead with an audit instead of a demo?',
    answer:
      'Because clinics care about where revenue is leaking, not a feature tour. The audit makes the problem concrete before we talk about deployment.',
  },
  {
    question: 'Do we need to replace our booking software?',
    answer:
      'No. Zypflow is built as an overlay. It works alongside the tools you already use — Fresha, Phorest, Cliniko, Calendly — and fixes the conversion and retention gaps around them.',
  },
  {
    question: 'What happens after we sign up?',
    answer:
      'You land in a guided setup path, get one branded workflow deployed within 14 days, and then see proof, health, and next actions in your dashboard rather than a generic settings maze.',
  },
  {
    question: 'Is this just for aesthetics clinics?',
    answer:
      'We started with aesthetics because that is where we saw the biggest revenue leaks. But the system works for any appointment-based service business — dental, physio, wellness, beauty, and more.',
  },
  {
    question: 'How quickly will I see results?',
    answer:
      'Most clients see measurable improvement in lead response times and booking rates within the first two weeks. We report on progress weekly so you always know exactly what Zypflow is delivering.',
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
        'Automated revenue operating system for service businesses: enquiry conversion, appointment protection, reviews, and repeat revenue.',
    },
    {
      '@type': 'Service',
      name: 'Zypflow Revenue OS',
      provider: { '@type': 'Organization', name: 'Zypflow' },
      areaServed: 'United Kingdom',
      audience: { '@type': 'Audience', audienceType: 'Service businesses and aesthetics clinics' },
      description:
        'Automated lead response, booking protection, review generation, and patient reactivation for appointment-based businesses.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ],
};

export default function Home() {
  return (
    <div className="app-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_SCHEMA) }}
      />

      <div className="relative">
        <div className="mx-auto max-w-7xl px-5 pt-5 sm:px-8">
          <SiteHeader eyebrow="Revenue OS for service businesses" />
        </div>

        {/* 01/ Hero — particles + text reveal */}
        <GlobeHero />

        <main>
          {/* 02/ Integrations + Stats */}
          <LogoStrip />

          {/* 03/ Product Showcase — 3 interactive tabs */}
          <ProductSection />

          {/* 04/ Differentiators — hover reveal comparison */}
          <DifferentiatorsSection />

          {/* 05/ Results — horizontal carousel */}
          <ResultsSection />

          {/* 06/ Pricing Preview */}
          <CtaSection />

          {/* Audit Form */}
          <section id="audit" className="relative overflow-hidden py-28 sm:py-36">
            <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--app-card-border)] to-transparent" />
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
              <div className="mx-auto max-w-2xl">
                <div className="public-frame">
                  <div className="text-center">
                    <p className="page-eyebrow">Revenue Leak Audit</p>
                    <h2
                      className="mt-4 text-3xl font-semibold text-[var(--app-text)] sm:text-4xl"
                      data-testid="audit-intro-heading"
                    >
                      See exactly where your business is leaking revenue.
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">
                      We scan your public pages and show you the fastest conversion leaks to fix first.
                    </p>
                  </div>
                  <div className="mt-6">
                    <AuditForm />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[10px] uppercase tracking-[0.15em] text-[var(--app-text-soft)]">
                    <span>No spam</span>
                    <span className="h-1 w-1 rounded-full bg-[var(--app-text-soft)]" />
                    <span>Results in 60 seconds</span>
                    <span className="h-1 w-1 rounded-full bg-[var(--app-text-soft)]" />
                    <span>Public pages only</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 07/ FAQ */}
          <FaqSection faqs={FAQS} />
        </main>

        <div className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
