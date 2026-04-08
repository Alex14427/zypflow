import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const TRIAL_EXEMPT_PATHS = [
  '/dashboard/settings',
  '/pricing',
  '/api/',
];

const WRITE_ACTION_PATHS = [
  '/dashboard/leads',
  '/dashboard/bookings',
  '/dashboard/conversations',
  '/dashboard/reviews',
];

export async function middleware(req: NextRequest) {
  const protectedPaths = ['/dashboard', '/onboarding', '/admin'];
  const isProtected = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path));
  if (!isProtected) {
    return NextResponse.next();
  }

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
            response.cookies.set(name, value, options as never);
          });
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable (placeholder URL, network issue, etc.)
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (req.nextUrl.pathname.startsWith('/dashboard') && user.email) {
    const isExempt = TRIAL_EXEMPT_PATHS.some((path) => req.nextUrl.pathname.startsWith(path));

    if (!isExempt) {
      const { data: business } = await supabase
        .from('businesses')
        .select('plan, trial_ends_at')
        .eq('email', user.email)
        .maybeSingle();

      if (business?.plan === 'trial' && business.trial_ends_at) {
        const trialExpired = new Date(business.trial_ends_at).getTime() < Date.now();
        if (trialExpired) {
          const isWritePath = WRITE_ACTION_PATHS.some((path) => req.nextUrl.pathname.startsWith(path));
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
  matcher: ['/dashboard', '/dashboard/:path*', '/onboarding', '/onboarding/:path*', '/admin', '/admin/:path*'],
};
