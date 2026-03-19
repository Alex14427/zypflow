import { NextRequest, NextResponse } from 'next/server';

/**
 * Verifies that automation endpoint requests come from authorized sources:
 * - Vercel Cron (CRON_SECRET in Authorization header)
 * - Make.com (MAKE_API_TOKEN in Authorization header or x-api-key header)
 *
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export function verifyAutomationAuth(req: NextRequest): NextResponse | null {
  // Vercel cron sends: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization');
  const apiKey = req.headers.get('x-api-key');

  const cronSecret = process.env.CRON_SECRET;
  const makeToken = process.env.MAKE_API_TOKEN;

  // Allow Vercel cron calls
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return null;
  }

  // Allow Make.com calls via Bearer token
  if (makeToken && authHeader === `Bearer ${makeToken}`) {
    return null;
  }

  // Allow Make.com calls via x-api-key header
  if (makeToken && apiKey === makeToken) {
    return null;
  }

  // In development, allow unauthenticated calls
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
