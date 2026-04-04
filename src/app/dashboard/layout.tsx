import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { resolveServerUser } from '@/lib/server-auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await resolveServerUser();

  if (!user) {
    redirect('/login');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
