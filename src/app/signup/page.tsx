'use client';

import { useState, useMemo, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { signupFormSchema } from '@/lib/validators';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" /></div>}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams?.get('plan') ?? null;

  const pwStrength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signupFormSchema.safeParse({
      businessName,
      email,
      password,
      acceptedTerms,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form and try again.');
      return;
    }

    const cleanBusinessName = parsed.data.businessName;
    const cleanEmail = parsed.data.email;
    const cleanPassword = parsed.data.password;

    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (authError) {
      // If user already exists, try logging them in instead
      if (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('already been registered')) {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
        if (loginError) {
          setError('Account already exists. Please log in with your password.');
          setLoading(false);
          return;
        }
        window.location.href = '/dashboard';
        return;
      }
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Create organisation
      const { data: org, error: orgError } = await supabase.from('businesses').insert({
        name: cleanBusinessName,
        email: cleanEmail,
        owner_id: authData.user.id,
        plan: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      }).select('id').single();

      if (orgError) {
        console.error('Organisation creation error:', orgError);
        if (!orgError.message.includes('duplicate')) {
          setError('Account created but setup failed. Please try logging in.');
          setLoading(false);
          return;
        }
      }

      // Create org_member (owner role)
      if (org) {
        await supabase.from('org_members').insert({
          org_id: org.id,
          user_id: authData.user.id,
          role: 'owner',
        });
      }
    }

    // Full page reload so middleware picks up the new auth cookie
    window.location.href = '/onboarding';
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-8 shadow-xl">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block text-3xl font-bold transition hover:opacity-80">
            <span className="text-brand-purple">Zyp</span><span className="text-[var(--app-text)]">flow</span>
          </Link>
          <p className="mt-2 text-[var(--app-text-muted)]">Create your clinic workspace</p>
          {preselectedPlan && (
            <p className="mt-1 text-xs font-medium uppercase text-brand-purple">{preselectedPlan} plan selected</p>
          )}
        </div>

        {/* Social proof */}
        <div className="mb-6 flex items-center justify-center gap-2 text-xs text-[var(--app-text-soft)]">
          <span>Approval-led setup</span>
          <span>&middot;</span>
          <span>Launch in minutes</span>
          <span>&middot;</span>
          <span>Billing activated after approval</span>
        </div>

        <form onSubmit={handleSignup} noValidate className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--app-text)]">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Bright Smile Dental"
              className="w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-2.5 text-[var(--app-text)] placeholder:text-[var(--app-text-soft)] focus:outline-none focus:ring-2 focus:ring-brand-purple"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--app-text)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
              className="w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-2.5 text-[var(--app-text)] placeholder:text-[var(--app-text-soft)] focus:outline-none focus:ring-2 focus:ring-brand-purple"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--app-text)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              placeholder="Minimum 8 characters"
              className="w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-2.5 text-[var(--app-text)] placeholder:text-[var(--app-text-soft)] focus:outline-none focus:ring-2 focus:ring-brand-purple"
              required
            />
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i <= pwStrength.score ? pwStrength.color : 'bg-[var(--app-muted)]'
                      }`}
                    />
                  ))}
                </div>
                <p className={`mt-1 text-xs ${
                  pwStrength.score <= 1 ? 'text-red-500' :
                  pwStrength.score <= 2 ? 'text-orange-500' :
                  pwStrength.score <= 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {pwStrength.label}
                </p>
              </div>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm text-[var(--app-text-muted)]">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 accent-brand-purple"
              required
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" className="text-brand-purple hover:underline" target="_blank">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-brand-purple hover:underline" target="_blank">
                Privacy Policy
              </Link>
            </span>
          </label>

          {error && <p className="text-sm text-red-500 dark:text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="w-full rounded-[14px] bg-brand-purple py-2.5 font-semibold text-white transition hover:bg-brand-purple-dark disabled:opacity-50"
          >
            {loading ? 'Creating workspace...' : 'Create Clinic Workspace'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--app-text-muted)]">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-purple hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
