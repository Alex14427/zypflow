'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeProvider } from '@/components/realtime-provider';
import { NotificationBell } from '@/components/notification-bell';
import { CommandPalette } from '@/components/command-palette';
import { ErrorBoundary } from '@/components/error-boundary';

const ADMIN_EMAILS = ['alex@zypflow.co.uk'];

interface Business {
  id: string;
  name: string;
  plan: string;
  trial_ends_at: string | null;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: HomeIcon },
  { href: '/dashboard/leads', label: 'Leads', icon: UsersIcon },
  { href: '/dashboard/bookings', label: 'Bookings', icon: CalendarIcon },
  { href: '/dashboard/conversations', label: 'Conversations', icon: ChatIcon },
  { href: '/dashboard/reviews', label: 'Reviews', icon: StarIcon },
  { href: '/dashboard/templates', label: 'Templates', icon: TemplateIcon },
  { href: '/dashboard/analytics', label: 'Analytics', icon: ChartIcon },
  { href: '/dashboard/settings', label: 'Settings', icon: GearIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      if (ADMIN_EMAILS.includes(user.email ?? '')) setIsAdmin(true);
      const { data } = await supabase
        .from('businesses')
        .select('id, name, plan, trial_ends_at')
        .eq('email', user.email)
        .maybeSingle();
      if (!data) { router.push('/onboarding'); return; }
      setBusiness(data);
      setAuthChecked(true);
    }
    load();
  }, [router]);

  // Trial banner logic
  const trialDaysLeft = business?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(business.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const showTrialBanner = trialDaysLeft !== null && trialDaysLeft <= 7 && business?.plan === 'trial';

  return (
    <RealtimeProvider businessId={business?.id || null}>
      <CommandPalette />
      <div className="min-h-screen bg-gray-50 flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-5 border-b">
            <Link href="/dashboard" className="text-xl font-bold">
              <span className="text-brand-purple">Zyp</span>flow
            </Link>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-brand-purple to-purple-700 text-white mb-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Owner HQ
              </Link>
            )}
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-purple/10 text-brand-purple'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Trial countdown in sidebar */}
          {trialDaysLeft !== null && business?.plan === 'trial' && (
            <div className="mx-3 mb-2 p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${trialDaysLeft <= 3 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-xs font-semibold text-amber-800">Free Trial</span>
              </div>
              <div className="text-2xl font-bold text-amber-900">{trialDaysLeft}</div>
              <div className="text-xs text-amber-700 mb-2">day{trialDaysLeft !== 1 ? 's' : ''} remaining</div>
              <div className="w-full bg-amber-200 rounded-full h-1.5 mb-2">
                <div
                  className={`h-1.5 rounded-full transition-all ${trialDaysLeft <= 3 ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.max(5, ((14 - trialDaysLeft) / 14) * 100)}%` }}
                />
              </div>
              <Link
                href="/pricing"
                className="block w-full text-center text-xs font-semibold bg-brand-purple text-white py-1.5 rounded-md hover:bg-brand-purple/90 transition"
              >
                Upgrade Now
              </Link>
            </div>
          )}

          {/* Cmd+K hint */}
          <div className="px-4 pb-2">
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-400 text-xs hover:bg-gray-100 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Quick actions
              <kbd className="ml-auto bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-mono">&#8984;K</kbd>
            </button>
          </div>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-brand-purple/10 rounded-full flex items-center justify-center text-brand-purple text-sm font-bold">
                {business?.name?.[0] || 'Z'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{business?.name || 'Loading...'}</p>
                <p className="text-xs text-gray-400 uppercase">{business?.plan || '...'}</p>
              </div>
            </div>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
              className="w-full text-left text-sm text-gray-400 hover:text-gray-600 px-1"
            >
              Log out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <header className="bg-white border-b px-4 lg:px-6 py-3 flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600 lg:hidden">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="text-lg font-bold lg:hidden"><span className="text-brand-purple">Zyp</span>flow</span>

            {/* Right side actions */}
            <div className="flex items-center gap-2 ml-auto">
              <NotificationBell />
            </div>
          </header>

          {/* Trial banner */}
          {showTrialBanner && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 text-sm font-medium flex items-center justify-between">
              <span>Your free trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}. Upgrade now to keep your AI assistant running.</span>
              <Link href="/pricing" className="bg-white text-amber-600 px-4 py-1 rounded-full text-xs font-bold hover:bg-amber-50 transition">
                Upgrade
              </Link>
            </div>
          )}

          <main className="p-6 lg:p-8 max-w-7xl mx-auto">
            <ErrorBoundary>
              {authChecked ? children : (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" />
                </div>
              )}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </RealtimeProvider>
  );
}

// --- Icons ---
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
