'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const router = useRouter();

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const newCount = failCount + 1;
      setFailCount(newCount);
      setError('Invalid email or password.');
      setLoading(false);
      // Lock after 5 consecutive failures for 60 seconds
      if (newCount >= 5) {
        setLockedUntil(Date.now() + 60000);
        setError('Too many failed attempts. Please wait 60 seconds.');
        setTimeout(() => { setLockedUntil(null); setFailCount(0); }, 60000);
      }
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold inline-block hover:opacity-80 transition">
            <span className="text-brand-purple">Zyp</span>flow
          </Link>
          <p className="text-gray-500 mt-2">Log in to your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : isLocked ? 'Please wait...' : 'Log In'}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-500">
            <Link href="/forgot-password" className="text-brand-purple hover:underline font-medium">
              Forgot your password?
            </Link>
          </p>
          <p className="text-sm text-gray-500">
            No account yet?{' '}
            <Link href="/signup" className="text-brand-purple hover:underline font-medium">
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
