import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/onboarding/:path*', '/admin/:path*'],
};
