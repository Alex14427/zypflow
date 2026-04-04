import { supabaseAdmin } from '@/lib/supabase';

export async function resolveServerBusinessForUser(user: { id: string; email?: string | null }) {
  const { data: membership } = await supabaseAdmin
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership?.org_id) {
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id, email, plan, stripe_customer_id, stripe_subscription_id')
      .eq('id', membership.org_id)
      .maybeSingle();

    if (business?.id) {
      return { business, role: membership.role || 'owner' };
    }
  }

  const { data: ownedBusiness } = await supabaseAdmin
    .from('businesses')
    .select('id, email, plan, stripe_customer_id, stripe_subscription_id')
    .or(`owner_id.eq.${user.id},email.eq.${user.email ?? ''}`)
    .limit(1)
    .maybeSingle();

  if (!ownedBusiness?.id) {
    return null;
  }

  return {
    business: ownedBusiness,
    role: 'owner',
  };
}
