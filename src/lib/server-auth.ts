import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAuthCookieName() {
  const match = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.+?)\.supabase/);
  return match?.[1] ? `sb-${match[1]}-auth-token` : null;
}

export async function resolveServerUser() {
  const cookieName = getSupabaseAuthCookieName();
  if (!cookieName) {
    return null;
  }

  const authCookie = cookies().get(cookieName)?.value;
  if (!authCookie) {
    return null;
  }

  try {
    const parsed = JSON.parse(authCookie);
    const accessToken =
      Array.isArray(parsed) ? parsed[0] : typeof parsed === 'object' && parsed ? parsed.access_token : null;

    if (!accessToken) {
      return null;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);

    return user ?? null;
  } catch {
    return null;
  }
}
