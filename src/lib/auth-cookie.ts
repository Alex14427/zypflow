import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Extracts and verifies the authenticated user from Supabase auth cookie.
 * Returns the user object if valid, or a 401 NextResponse if not.
 *
 * Usage in API routes:
 * ```ts
 * const result = await verifyDashboardUser(req);
 * if (result instanceof NextResponse) return result;
 * const { user, accessToken } = result;
 * ```
 */
export async function verifyDashboardUser(
  req: NextRequest
): Promise<{ user: { id: string; email: string }; accessToken: string } | NextResponse> {
  const supabaseRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.+?)\.supabase/)?.[1];
  const authCookie = req.cookies.get(`sb-${supabaseRef}-auth-token`)?.value;

  if (!authCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parsed = JSON.parse(authCookie);
    const accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return { user: { id: user.id, email: user.email }, accessToken };
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
