import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Only protect dashboard routes
  if (!req.nextUrl.pathname.startsWith('/dashboard')) return NextResponse.next();

  const token = req.cookies.get('sb-access-token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
