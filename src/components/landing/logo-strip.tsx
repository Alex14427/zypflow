'use client';

import { FadeIn } from '@/components/animations';

const INTEGRATIONS = [
  { name: 'Fresha', icon: 'F' },
  { name: 'Phorest', icon: 'P' },
  { name: 'Vagaro', icon: 'V' },
  { name: 'Stripe', icon: 'S' },
  { name: 'WhatsApp', icon: 'W' },
  { name: 'Calendly', icon: 'C' },
  { name: 'Google', icon: 'G' },
  { name: 'Cal.com', icon: 'Ca' },
  { name: 'Twilio', icon: 'T' },
  { name: 'Resend', icon: 'R' },
  { name: 'Make.com', icon: 'M' },
  { name: 'Cliniko', icon: 'Cl' },
  { name: 'Instagram', icon: 'I' },
  { name: 'Mailchimp', icon: 'Mc' },
  { name: 'Zenoti', icon: 'Z' },
  { name: 'HubSpot', icon: 'H' },
];

function IntegrationPill({ name, icon }: { name: string; icon: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 transition-all duration-300 hover:border-brand-purple/30 hover:bg-brand-purple/[0.06]">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-purple/10 text-[10px] font-bold text-brand-purple">
        {icon}
      </span>
      <span className="text-sm font-semibold text-[var(--app-text-muted)] whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

export function LogoStrip() {
  const row1 = INTEGRATIONS.slice(0, 8);
  const row2 = INTEGRATIONS.slice(8);

  return (
    <section className="relative overflow-hidden border-y border-[var(--app-border)] py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeIn>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-[var(--app-text-soft)]">
            Works alongside the tools your clinic already uses
          </p>
        </FadeIn>
      </div>

      {/* Row 1 - scrolls left */}
      <div className="relative mt-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[var(--app-bg)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--app-bg)] to-transparent" />
        <div className="flex animate-marquee items-center gap-4">
          {[...row1, ...row1, ...row1].map((item, i) => (
            <IntegrationPill key={`r1-${i}`} name={item.name} icon={item.icon} />
          ))}
        </div>
      </div>

      {/* Row 2 - scrolls right */}
      <div className="relative mt-3 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[var(--app-bg)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--app-bg)] to-transparent" />
        <div className="flex animate-marquee-reverse items-center gap-4">
          {[...row2, ...row2, ...row2, ...row2].map((item, i) => (
            <IntegrationPill key={`r2-${i}`} name={item.name} icon={item.icon} />
          ))}
        </div>
      </div>
    </section>
  );
}
