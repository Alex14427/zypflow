import type { Metadata } from 'next';
import Link from 'next/link';
import { AuditForm } from '@/components/public/audit-form';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { HeroSection } from '@/components/landing/hero-section';
import { ProofStrip } from '@/components/landing/proof-strip';
import { ProductSection } from '@/components/landing/product-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { DifferentiatorsSection } from '@/components/landing/differentiators-section';
import { LaunchSection } from '@/components/landing/launch-section';
import { CtaSection } from '@/components/landing/cta-section';
import { FaqSection } from '@/components/landing/faq-section';
import { LogoStrip } from '@/components/landing/logo-strip';

export const metadata: Metadata = {
  title: 'Zypflow | Revenue OS For Aesthetics Clinics',
  description:
    'The automated revenue operating system for London aesthetics clinics: faster lead response, stronger booking conversion, fewer no-shows, and more repeat revenue.',
};

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
      provider: { '@type': 'Organization', name: 'Zypflow' },
      areaServed: 'London',
      audience: { '@type': 'Audience', audienceType: 'Aesthetics clinics' },
      description:
        'Founder-led launch for clinics that want faster lead response, stronger booking conversion, fewer no-shows, and better patient return.',
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

      {/* Ambient background effects */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-[200px] -top-[100px] h-[600px] w-[600px] rounded-full bg-brand-purple/[0.07] blur-[120px]" />
        <div className="absolute -right-[150px] top-[300px] h-[500px] w-[500px] rounded-full bg-teal-500/[0.05] blur-[100px]" />
        <div className="absolute bottom-[200px] left-[30%] h-[400px] w-[400px] rounded-full bg-brand-purple/[0.04] blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-5 pt-5 sm:px-8">
          <SiteHeader eyebrow="Revenue OS for aesthetics clinics" />
        </div>

        <main>
          <HeroSection />

          <LogoStrip />

          <ProofStrip />

          <ProductSection />

          <HowItWorksSection />

          <DifferentiatorsSection />

          <LaunchSection />

          {/* Audit CTA section */}
          <section className="relative overflow-hidden py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
              <div className="mx-auto max-w-2xl">
                <div className="public-frame">
                  <div className="text-center">
                    <p className="page-eyebrow">Revenue Leak Audit</p>
                    <h2
                      className="mt-4 text-3xl font-semibold text-[var(--app-text)] sm:text-4xl"
                      data-testid="audit-intro-heading"
                    >
                      See exactly where your clinic is leaking revenue.
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">
                      We scan your public pages and show you the fastest conversion leaks to fix first.
                    </p>
                  </div>
                  <div className="mt-6">
                    <AuditForm />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <FaqSection faqs={FAQS} />

          <CtaSection />
        </main>

        <div className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
