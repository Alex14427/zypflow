import { createBrowserClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const requireEnv = (name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY' | 'SUPABASE_SERVICE_ROLE_KEY'): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const supabaseUrl = () => requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = () => requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

let browserClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/** Safe client for browser/UI usage (anon key + RLS). */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!browserClient) {
      browserClient = createBrowserClient(supabaseUrl(), supabaseAnonKey());
    }

    return (browserClient as any)[prop];
  },
});

/** Server-only admin client (service role key, bypasses RLS). */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (typeof window !== 'undefined') {
      throw new Error('supabaseAdmin is server-only and cannot run in the browser.');
    }

    if (!adminClient) {
      adminClient = createClient(supabaseUrl(), requireEnv('SUPABASE_SERVICE_ROLE_KEY'));
    }

    return (adminClient as any)[prop];
  },
});
