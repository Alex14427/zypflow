import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

  // Create a response that we can modify (to update cookies)
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            response.cookies.set(name, value, options as any);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const userEmail = user.email;

  // Trial expiry check — enforce read-only mode for expired trials
  if (req.nextUrl.pathname.startsWith('/dashboard') && userEmail) {
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
          const isWritePath = WRITE_ACTION_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
          if (isWritePath) {
            const url = new URL('/pricing', req.url);
            url.searchParams.set('reason', 'trial_expired');
            return NextResponse.redirect(url);
          }
          response.headers.set('x-trial-expired', 'true');
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/onboarding/:path*', '/admin/:path*'],
};
