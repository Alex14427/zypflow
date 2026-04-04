import { supabase } from '@/lib/supabase';

export interface CurrentBusiness {
  id: string;
  name: string;
  plan: string;
  trial_ends_at: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  website: string | null;
  booking_url: string | null;
  google_review_link: string | null;
  widget_color: string | null;
  avg_job_value: number | null;
  services?: unknown[] | null;
  knowledge_base?: unknown[] | null;
  ai_personality?: string | null;
  system_prompt?: string | null;
  settings?: Record<string, unknown> | null;
  role?: string | null;
}

export async function resolveCurrentBusiness() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unable to authenticate the current user.');
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership?.org_id) {
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(
        'id, name, plan, trial_ends_at, email, phone, industry, website, booking_url, google_review_link, widget_color, avg_job_value, services, knowledge_base, ai_personality, system_prompt, settings'
      )
      .eq('id', membership.org_id)
      .maybeSingle();

    if (businessError || !business) {
      throw new Error('Unable to load business for current user.');
    }

    return { user, business: { ...business, role: membership.role } as CurrentBusiness };
  }

  const { data: ownedBusiness, error: fallbackError } = await supabase
    .from('businesses')
    .select(
      'id, name, plan, trial_ends_at, email, phone, industry, website, booking_url, google_review_link, widget_color, avg_job_value, services, knowledge_base, ai_personality, system_prompt, settings'
    )
    .or(`owner_id.eq.${user.id},email.eq.${user.email ?? ''}`)
    .limit(1)
    .maybeSingle();

  if (fallbackError || !ownedBusiness) {
    throw new Error('Unable to resolve a business for the current user.');
  }

  return { user, business: { ...ownedBusiness, role: 'owner' } as CurrentBusiness };
}
