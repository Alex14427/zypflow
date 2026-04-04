import { supabaseAdmin } from '@/lib/supabase';

const PLAN_LIMITS = {
  trial: { scraping: 100, email: 500, ai: 20 },
  starter: { scraping: 100, email: 500, ai: 20 },
  growth: { scraping: 500, email: 5000, ai: 100 },
  enterprise: { scraping: 99999, email: 99999, ai: 99999 },
} as const;

type CreditType = 'scraping' | 'email' | 'ai';
type PlanKey = keyof typeof PLAN_LIMITS;

const COLUMN_MAP: Record<CreditType, string> = {
  scraping: 'scraping_credits',
  email: 'email_credits',
  ai: 'ai_credits',
};

function getPlanKey(plan: string): PlanKey {
  if (plan in PLAN_LIMITS) return plan as PlanKey;
  return 'starter';
}

export async function checkCredits(
  orgId: string,
  type: CreditType,
  amount: number = 1
): Promise<{ allowed: boolean; remaining: number; plan: string }> {
  const column = COLUMN_MAP[type];

  const { data, error } = await supabaseAdmin
    .from('organisations')
    .select(`plan, ${column}`)
    .eq('id', orgId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to fetch org credits: ${error?.message ?? 'not found'}`);
  }

  const plan: string = data.plan ?? 'starter';

  if (plan === 'enterprise') {
    return { allowed: true, remaining: Infinity, plan };
  }

  const remaining: number = data[column] ?? 0;
  return {
    allowed: remaining >= amount,
    remaining,
    plan,
  };
}

export async function deductCredits(
  orgId: string,
  type: CreditType,
  amount: number = 1
): Promise<{ success: boolean; remaining: number }> {
  const column = COLUMN_MAP[type];

  const { data, error } = await supabaseAdmin
    .from('organisations')
    .select(`plan, ${column}`)
    .eq('id', orgId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to fetch org credits: ${error?.message ?? 'not found'}`);
  }

  const plan: string = data.plan ?? 'starter';
  const current: number = data[column] ?? 0;

  if (plan !== 'enterprise' && current < amount) {
    return { success: false, remaining: current };
  }

  if (plan === 'enterprise') {
    return { success: true, remaining: Infinity };
  }

  const newRemaining = current - amount;

  const { error: updateError } = await supabaseAdmin
    .from('organisations')
    .update({ [column]: newRemaining })
    .eq('id', orgId);

  if (updateError) {
    throw new Error(`Failed to deduct credits: ${updateError.message}`);
  }

  return { success: true, remaining: newRemaining };
}

export async function resetMonthlyCredits(orgId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('organisations')
    .select('plan')
    .eq('id', orgId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to fetch org plan: ${error?.message ?? 'not found'}`);
  }

  const planKey = getPlanKey(data.plan ?? 'starter');
  const limits = PLAN_LIMITS[planKey];

  const { error: updateError } = await supabaseAdmin
    .from('organisations')
    .update({
      scraping_credits: limits.scraping,
      email_credits: limits.email,
      ai_credits: limits.ai,
    })
    .eq('id', orgId);

  if (updateError) {
    throw new Error(`Failed to reset monthly credits: ${updateError.message}`);
  }
}

export async function getCreditUsage(orgId: string): Promise<{
  scraping: { used: number; limit: number };
  email: { used: number; limit: number };
  ai: { used: number; limit: number };
}> {
  const { data, error } = await supabaseAdmin
    .from('organisations')
    .select('plan, scraping_credits, email_credits, ai_credits')
    .eq('id', orgId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to fetch org usage: ${error?.message ?? 'not found'}`);
  }

  const planKey = getPlanKey(data.plan ?? 'starter');
  const limits = PLAN_LIMITS[planKey];

  const scrapingRemaining: number = data.scraping_credits ?? 0;
  const emailRemaining: number = data.email_credits ?? 0;
  const aiRemaining: number = data.ai_credits ?? 0;

  return {
    scraping: {
      used: limits.scraping - scrapingRemaining,
      limit: limits.scraping,
    },
    email: {
      used: limits.email - emailRemaining,
      limit: limits.email,
    },
    ai: {
      used: limits.ai - aiRemaining,
      limit: limits.ai,
    },
  };
}
