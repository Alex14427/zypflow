'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveCurrentBusiness, type CurrentBusiness } from '@/lib/current-business';
import { isAdminEmail } from '@/lib/admin-users';
import { resolveBrandAssets } from '@/lib/brand-theme';
import { RealtimeProvider } from '@/components/realtime-provider';
import { NotificationBell } from '@/components/notification-bell';
import { CommandPalette } from '@/components/command-palette';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: HomeIcon },
  { href: '/dashboard/leads', label: 'Leads', icon: UsersIcon },
  { href: '/dashboard/bookings', label: 'Bookings', icon: CalendarIcon },
  { href: '/dashboard/conversations', label: 'Inbox', icon: ChatIcon },
  { href: '/dashboard/reviews', label: 'Reviews', icon: StarIcon },
  { href: '/dashboard/templates', label: 'Automations', icon: TemplateIcon },
  { href: '/dashboard/analytics', label: 'Analytics', icon: ChartIcon },
  { href: '/dashboard/settings', label: 'Settings', icon: GearIcon },
];

const SECTION_SUMMARIES: Record<string, string> = {
  '/dashboard': 'Proof, priorities, and launch readiness in one buyer-facing view.',
  '/dashboard/leads': 'Warm demand, lead quality, and the contacts that still need a human nudge.',
  '/dashboard/bookings': 'Upcoming appointments, protection coverage, and reschedule risk.',
  '/dashboard/conversations': 'Inbox visibility across every active enquiry and follow-up thread.',
  '/dashboard/reviews': 'Review volume, completion rate, and the reputation loop after appointments.',
  '/dashboard/templates': 'Launch checklist, automation coverage, and deployment control.',
  '/dashboard/analytics': 'Commercial proof that the workflow is turning activity into measurable outcomes.',
  '/dashboard/settings': 'Brand, billing, widget, and clinic details that keep the system trustworthy.',
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/dashboard';
  const router = useRouter();
  const [business, setBusiness] = useState<CurrentBusiness | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const brandAssets = useMemo(
    () => resolveBrandAssets(business?.settings, business?.widget_color),
    [business?.settings, business?.widget_color]
  );
  const activeNavItem = useMemo(() => {
    return (
      NAV_ITEMS.find((item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) ||
      NAV_ITEMS[0]
    );
  }, [pathname]);
  const sectionSummary = SECTION_SUMMARIES[activeNavItem.href] || SECTION_SUMMARIES['/dashboard'];

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { user, business: currentBusiness } = await resolveCurrentBusiness();
        if (!mounted) return;

        setBusiness(currentBusiness);
        setIsAdmin(isAdminEmail(user.email));
        setAuthError(null);
      } catch (error) {
        if (!mounted) return;

        const message = error instanceof Error ? error.message : 'Unable to load workspace.';
        if (message.includes('resolve a business')) {
          router.push('/onboarding');
          return;
        }

        setAuthError(message);
        router.push('/login');
      } finally {
        if (mounted) {
          setAuthChecked(true);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <RealtimeProvider businessId={business?.id || null}>
      <CommandPalette />
      <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]" style={brandAssets.cssVariables}>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
          <aside
            className={`surface-panel fixed inset-y-0 left-0 z-50 flex w-72 flex-col rounded-none border-r border-[var(--app-border)] transition-transform lg:static lg:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="border-b border-[var(--app-border)] px-6 py-6">
              <Link href="/dashboard" className="flex items-center gap-3">
                {brandAssets.logoUrl ? (
                  <img
                    src={brandAssets.logoUrl}
                    alt={`${business?.name || 'Clinic'} logo`}
                    className="h-11 w-11 rounded-full border border-[var(--app-border)] bg-white object-cover"
                  />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-purple text-sm font-bold text-white">
                    Z
                  </span>
                )}
                <div>
                  <p className="text-base font-semibold text-[var(--app-text)]">Zypflow</p>
                  <p className="text-xs text-[var(--app-text-muted)]">Clinic Revenue OS</p>
                </div>
              </Link>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-muted)] p-4">
                <p className="page-eyebrow">Active workspace</p>
                <p className="mt-3 text-lg font-semibold text-[var(--app-text)]">{business?.name || 'Loading...'}</p>
                <p className="mt-1 text-sm capitalize text-[var(--app-text-muted)]">
                  {business?.industry?.replace(/_/g, ' ') || 'Private clinic'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-purple px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                    {formatPlanLabel(business?.plan)}
                  </span>
                  <span className="rounded-full bg-[var(--app-surface-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                    {business?.role || 'owner'}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white"
                    style={{ backgroundColor: brandAssets.brandColor }}
                  >
                    Brand ready
                  </span>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-4 pb-4">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="mb-3 flex items-center gap-3 rounded-[20px] bg-brand-purple px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-purple-dark"
                >
                  <ShieldIcon className="h-5 w-5" />
                  Founder portal
                </Link>
              )}
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-purple/12 text-brand-purple dark:text-purple-200'
                        : 'text-[var(--app-text-muted)] hover:bg-[var(--app-muted)] hover:text-[var(--app-text)]'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-[var(--app-border)] p-4">
              <button
                onClick={() =>
                  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true }))
                }
                className="flex w-full items-center gap-2 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-3 text-xs font-medium text-[var(--app-text-muted)] transition hover:text-[var(--app-text)]"
              >
                <SearchIcon className="h-4 w-4" />
                Quick actions
                <kbd className="ml-auto rounded bg-[var(--app-surface-strong)] px-2 py-1 font-mono text-[10px]">
                  Ctrl K
                </kbd>
              </button>

              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/login');
                }}
                className="mt-3 w-full rounded-[18px] border border-[var(--app-border)] px-4 py-3 text-left text-sm font-medium text-[var(--app-text-muted)] transition hover:border-red-500/30 hover:text-red-500"
              >
                Log out
              </button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-[var(--app-border)] bg-[color:var(--app-bg)]/90 px-4 py-4 backdrop-blur lg:px-8">
              <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-full border border-[var(--app-border)] p-2 text-[var(--app-text-muted)] lg:hidden"
                  >
                    <MenuIcon className="h-5 w-5" />
                  </button>
                  <div>
                    <p className="page-eyebrow">{activeNavItem.label}</p>
                    <p className="mt-1 text-base font-semibold text-[var(--app-text)]">
                      {business?.name || 'Workspace'}
                    </p>
                    <p className="text-xs text-[var(--app-text-muted)]">{sectionSummary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      document.dispatchEvent(
                        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true })
                      )
                    }
                    className="hidden rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-semibold text-[var(--app-text-muted)] transition hover:border-brand-purple hover:text-brand-purple md:inline-flex"
                  >
                    Quick actions
                  </button>
                  <div className="hidden items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-semibold text-[var(--app-text-muted)] md:flex">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: brandAssets.brandColor }} />
                    {brandAssets.logoUrl ? 'Logo + brand applied' : 'Brand color applied'}
                  </div>
                  <div className="hidden items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-semibold text-[var(--app-text-muted)] xl:flex">
                    {formatPlanLabel(business?.plan)}
                  </div>
                  <ThemeToggle compact />
                  <div className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] p-1">
                    <NotificationBell />
                  </div>
                </div>
              </div>
            </header>

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
              <ErrorBoundary>
                {!authChecked ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-purple border-t-transparent" />
                  </div>
                ) : authError ? (
                  <div className="rounded-[24px] border border-red-500/30 bg-red-500/8 p-5 text-sm text-red-600 dark:text-red-300">
                    {authError}
                  </div>
                ) : (
                  children
                )}
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </div>
    </RealtimeProvider>
  );
}

function formatPlanLabel(plan?: string | null) {
  if (!plan || plan === 'trial') return 'Founding setup';
  return plan.replace(/_/g, ' ');
}

function HomeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function UsersIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
}
function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function ChatIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}
function StarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
}
function ChartIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function TemplateIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>;
}
function GearIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function ShieldIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3l7 4v5c0 4.5-2.7 7.8-7 9-4.3-1.2-7-4.5-7-9V7l7-4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.5 12.5l1.75 1.75L14.75 10.5" /></svg>;
}
function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-4.4a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z" /></svg>;
}
function MenuIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" /></svg>;
}
