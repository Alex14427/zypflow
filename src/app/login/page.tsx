'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { loginFormSchema } from '@/lib/validators';
import Link from 'next/link';
import { ADMIN_EMAILS } from '@/lib/admin-users';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked || loading) return;
    const parsed = loginFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form and try again.');
      return;
    }

    const cleanEmail = parsed.data.email;
    const cleanPassword = parsed.data.password;

    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError) {
        const newCount = failCount + 1;
        setFailCount(newCount);
        setError('Invalid email or password.');
        if (newCount >= 5) {
          setLockedUntil(Date.now() + 60000);
          setError('Too many failed attempts. Please wait 60 seconds.');
          setTimeout(() => {
            setLockedUntil(null);
            setFailCount(0);
          }, 60000);
        }
      } else {
        const destination = ADMIN_EMAILS.includes(cleanEmail) ? '/admin' : '/dashboard';
        window.location.href = destination;
        return;
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-8 shadow-[var(--app-shadow)]">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold inline-block hover:opacity-80 transition">
            <span className="text-brand-purple">Zyp</span>
            <span className="text-[var(--app-text)]">flow</span>
          </Link>
          <p className="text-[var(--app-text-muted)] mt-2">Log in to your dashboard</p>
        </div>

        <form onSubmit={handleLogin} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--app-text-muted)] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2.5 text-[var(--app-text)] placeholder:text-[var(--app-text-soft)] focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple/50"
              placeholder="you@clinic.co.uk"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--app-text-muted)] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2.5 text-[var(--app-text)] placeholder:text-[var(--app-text-soft)] focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple/50"
              placeholder="Your password"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full bg-gradient-to-r from-brand-purple to-brand-purple-dark hover:opacity-90 text-white py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : isLocked ? 'Please wait...' : 'Log In'}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-[var(--app-text-soft)]">
            <Link href="/forgot-password" className="text-brand-purple hover:underline font-medium">
              Forgot your password?
            </Link>
          </p>
          <p className="text-sm text-[var(--app-text-soft)]">
            No account yet?{' '}
            <Link href="/signup" className="text-brand-purple hover:underline font-medium">
              Create clinic workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
