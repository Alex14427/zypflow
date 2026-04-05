import type { Metadata } from 'next';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { PricingContent } from '@/components/landing/pricing-content';

export const metadata: Metadata = {
  title: 'Zypflow | Founding Pilot Offer',
  description:
    'Review the founding pilot for Zypflow: a managed, automation-first launch for aesthetics clinics that want more booked consults and better patient retention.',
};

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
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ],
};

export default function PricingPage() {
  return (
    <div className="app-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_SCHEMA) }}
      />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-[200px] -top-[100px] h-[600px] w-[600px] rounded-full bg-brand-purple/[0.07] blur-[120px]" />
        <div className="absolute -right-[150px] top-[300px] h-[500px] w-[500px] rounded-full bg-teal-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-5 pt-5 sm:px-8">
          <SiteHeader eyebrow="Founding clinic offer" showOfferLink={false} />
        </div>

        <PricingContent faqs={FAQS} />

        <div className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
