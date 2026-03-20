'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const ADMIN_EMAILS = ['alex@zypflow.com'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      if (!ADMIN_EMAILS.includes(user.email ?? '')) {
        setAuthorized(false);
        return;
      }
      setEmail(user.email ?? '');
      setAuthorized(true);
    }
    checkAdmin();
  }, [router]);

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-purple text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-bold">Zypflow HQ</h1>
              <p className="text-sm text-purple-200">Owner Command Center</p>
            </div>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <a href="/admin" className="text-purple-200 hover:text-white transition">Dashboard</a>
              <a href="/dashboard" className="text-purple-200 hover:text-white transition">Customer View</a>
              <a href="/" className="text-purple-200 hover:text-white transition">Landing Page</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-purple-200">{email}</span>
            <span className="bg-purple-500/40 text-xs px-2 py-0.5 rounded-full font-medium">Owner</span>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
