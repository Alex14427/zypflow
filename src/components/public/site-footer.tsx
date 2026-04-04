import Link from 'next/link';

const DEFAULT_BOOKING_URL = 'https://calendly.com/alex-zypflow/30min';

const FOOTER_LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#product', label: 'Product' },
  { href: '/#proof', label: 'Proof layer' },
  { href: '/pricing', label: 'Founding offer' },
  { href: '/login', label: 'Client login' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export function SiteFooter() {
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_LINK || DEFAULT_BOOKING_URL;

  return (
    <footer className="glass-panel mx-auto mt-14 max-w-6xl rounded-[36px] px-6 py-8 sm:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <p className="page-eyebrow">Zypflow</p>
          <h2 className="max-w-2xl text-4xl font-semibold text-[var(--app-text)]">
            Built to help clinics book faster, protect more appointments, and grow repeat revenue.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-[var(--app-text-muted)]">
            Founder-led launch, automation-first delivery, and a tighter operating system for clinics that want results
            without hiring more admin.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="button-primary">
              Book audit
            </a>
            <Link href="/pricing" className="button-secondary">
              Review offer
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {FOOTER_LINKS.map((link) => (
            <FooterLink key={link.href} href={link.href} label={link.label} />
          ))}
          <div className="footer-status-card">
            <p className="page-eyebrow">Current wedge</p>
            <p className="mt-2 text-sm font-semibold text-[var(--app-text)]">London aesthetics clinics first</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="footer-link-card">
      {label}
    </Link>
  );
}
