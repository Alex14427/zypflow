import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client (safe for frontend, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (server-side API routes ONLY, never in frontend)
// Falls back to anon key if service role not set (build time)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
);
