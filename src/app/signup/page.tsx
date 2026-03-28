'use client';

import { useState, useMemo, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get('plan');

  const pwStrength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      // If user already exists, try logging them in instead
      if (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('already been registered')) {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
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
      const { data: org, error: orgError } = await supabase.from('organisations').insert({
        name: businessName,
        email,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold inline-block hover:opacity-80 transition">
            <span className="text-brand-purple">Zyp</span>flow
          </Link>
          <p className="text-gray-500 mt-2">Start your 14-day free trial</p>
          {preselectedPlan && (
            <p className="text-xs text-brand-purple mt-1 font-medium uppercase">{preselectedPlan} plan selected</p>
          )}
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs text-gray-400">
          <span>No credit card required</span>
          <span>&middot;</span>
          <span>Setup in 2 minutes</span>
          <span>&middot;</span>
          <span>Cancel anytime</span>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Bright Smile Dental"
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
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
              minLength={8}
              placeholder="Minimum 8 characters"
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              required
            />
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i <= pwStrength.score ? pwStrength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${
                  pwStrength.score <= 1 ? 'text-red-500' :
                  pwStrength.score <= 2 ? 'text-orange-500' :
                  pwStrength.score <= 3 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {pwStrength.label}
                </p>
              </div>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-600">
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

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Start Free Trial'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-purple hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
