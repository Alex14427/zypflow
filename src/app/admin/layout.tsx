import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { isAdminEmail } from '@/lib/admin-users';
import { resolveServerUser } from '@/lib/server-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await resolveServerUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-brand-purple text-white shadow dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-bold">Zypflow HQ</h1>
              <p className="text-sm text-purple-200">Owner Command Center</p>
            </div>
            <nav className="hidden items-center gap-4 text-sm md:flex">
              <Link href="/admin" className="text-purple-200 transition hover:text-white">
                Dashboard
              </Link>
              <Link href="/dashboard" className="text-purple-200 transition hover:text-white">
                Customer View
              </Link>
              <Link href="/" className="text-purple-200 transition hover:text-white">
                Landing Page
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <span className="hidden text-xs text-purple-200 sm:inline">{user.email}</span>
            <span className="rounded-full bg-purple-500/40 px-2 py-0.5 text-xs font-medium">Owner</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
