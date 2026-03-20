import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Routes that remain accessible even when trial has expired (read-only mode)
const TRIAL_EXEMPT_PATHS = [
  '/dashboard/settings',
  '/pricing',
  '/api/',
];

// Routes that perform write actions — blocked when trial expired
const WRITE_ACTION_PATHS = [
  '/dashboard/leads',
  '/dashboard/bookings',
  '/dashboard/conversations',
  '/dashboard/reviews',
];

export async function middleware(req: NextRequest) {
  // Serve the static landing page at the root URL
  if (req.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/landing.html', req.url));
  }

  // Only protect dashboard and onboarding routes
  const protectedPaths = ['/dashboard', '/onboarding', '/admin'];
  const isProtected = protectedPaths.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Supabase v2 stores auth in sb-<ref>-auth-token cookie
  const supabaseRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.+?)\.supabase/)?.[1];
  const authCookie = req.cookies.get(`sb-${supabaseRef}-auth-token`)?.value;

  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Verify the token is valid
  let userEmail: string | undefined;
  try {
    const parsed = JSON.parse(authCookie);
    const accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token;
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Verify with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    userEmail = user.email;

    // Trial expiry check — enforce read-only mode for expired trials
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      const isExempt = TRIAL_EXEMPT_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
      if (!isExempt) {
        const { data: biz } = await supabase
          .from('businesses')
          .select('plan, trial_ends_at')
          .eq('email', userEmail)
          .maybeSingle();

        if (biz?.plan === 'trial' && biz.trial_ends_at) {
          const trialExpired = new Date(biz.trial_ends_at).getTime() < Date.now();
          if (trialExpired) {
            // Allow viewing the overview dashboard (read-only) but redirect write pages to pricing
            const isWritePath = WRITE_ACTION_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
            if (isWritePath) {
              const url = new URL('/pricing', req.url);
              url.searchParams.set('reason', 'trial_expired');
              return NextResponse.redirect(url);
            }
            // For overview/analytics/templates — add header so client can show read-only banner
            const res = NextResponse.next();
            res.headers.set('x-trial-expired', 'true');
            return res;
          }
        }
      }
    }
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/onboarding/:path*', '/admin/:path*'],
};
