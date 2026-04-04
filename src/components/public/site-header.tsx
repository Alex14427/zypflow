import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

const DEFAULT_BOOKING_URL = 'https://calendly.com/alex-zypflow/30min';

const NAV_ITEMS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#product', label: 'Product' },
  { href: '/#trust', label: 'Trust' },
];

export function SiteHeader({
  eyebrow = 'Clinic Revenue OS',
  showOfferLink = true,
}: {
  eyebrow?: string;
  showOfferLink?: boolean;
}) {
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_LINK || DEFAULT_BOOKING_URL;

  return (
    <header className="glass-panel sticky top-4 z-30 mx-auto mb-10 flex max-w-6xl items-center justify-between rounded-full px-5 py-3">
      <Link href="/" className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-purple text-sm font-bold text-white shadow-[0_14px_30px_rgba(210,102,69,0.28)]">
          Z
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--app-text)]">Zypflow</p>
          <p className="truncate text-xs text-[var(--app-text-soft)]">{eyebrow}</p>
        </div>
      </Link>

      <nav className="hidden items-center gap-2 md:flex">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="button-ghost">
            {item.label}
          </Link>
        ))}
        {showOfferLink ? (
          <Link href="/pricing" className="button-ghost">
            Offer
          </Link>
        ) : null}
        <ThemeToggle compact />
        <Link href="/login" className="button-ghost">
          Log in
        </Link>
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="button-primary button-primary-sm">
          Book Audit
        </a>
      </nav>

      <div className="flex items-center gap-2 md:hidden">
        <Link href="/pricing" className="button-ghost button-ghost-sm">
          Offer
        </Link>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="button-primary button-primary-xs"
        >
          Audit
        </a>
        <ThemeToggle compact />
      </div>
    </header>
  );
}
