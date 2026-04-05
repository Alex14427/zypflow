import { supabaseAdmin } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// FAQ Caching Layer
// Reduces AI costs by caching common question/answer pairs per business.
// Uses Supabase `faq_cache` table as the cache store.
// ---------------------------------------------------------------------------

/**
 * Normalize a question for consistent hashing:
 * lowercase, trim whitespace, strip punctuation.
 */
function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Simple hash: take first 100 chars of normalized question, sum char codes,
 * return hex string. No crypto needed.
 */
function hashQuestion(normalized: string): string {
  const slice = normalized.slice(0, 100);
  let sum = 0;
  for (let i = 0; i < slice.length; i++) {
    sum += slice.charCodeAt(i);
  }
  return sum.toString(16);
}

/**
 * Look up a cached answer for the given org + question.
 * Returns the answer string if a non-expired cache hit exists, otherwise null.
 */
export async function getCachedAnswer(
  orgId: string,
  question: string,
): Promise<string | null> {
  const normalized = normalizeQuestion(question);
  const questionHash = hashQuestion(normalized);

  const { data, error } = await supabaseAdmin
    .from('faq_cache')
    .select('id, answer, hit_count, expires_at')
    .eq('org_id', orgId)
    .eq('question_hash', questionHash)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  // Check expiry
  if (new Date(data.expires_at) <= new Date()) {
    return null;
  }

  // Best-effort increment hit_count (fire-and-forget)
  void supabaseAdmin
    .from('faq_cache')
    .update({ hit_count: (data.hit_count ?? 0) + 1 })
    .eq('id', data.id);

  return data.answer;
}

/**
 * Cache an AI-generated answer for a given org + question.
 * Only caches substantive answers (> 50 chars).
 */
export async function cacheAnswer(
  orgId: string,
  question: string,
  answer: string,
  ttlDays = 30,
): Promise<void> {
  // Only cache substantive answers
  if (answer.length <= 50) return;

  const normalized = normalizeQuestion(question);
  const questionHash = hashQuestion(normalized);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  const { error } = await supabaseAdmin.from('faq_cache').upsert(
    {
      org_id: orgId,
      question_hash: questionHash,
      question: normalized,
      answer,
      hit_count: 0,
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: 'org_id,question_hash' },
  );

  if (error) {
    console.error('[faq-cache] Failed to cache answer:', error.message);
  }
}

/**
 * Returns true if the question matches common FAQ patterns that are worth caching.
 */
export function shouldCache(question: string): boolean {
  const normalized = normalizeQuestion(question);

  const faqPatterns = [
    /\b(what|when)\s+(are|is)\s+(your|the)\s+(hours|opening|closing)/,
    /\bhow\s+much\b/,
    /\bdo\s+you\s+offer\b/,
    /\bwhere\s+are\s+you\b/,
    /\bhow\s+do\s+i\s+book\b/,
    /\bwhat\s+services\b/,
    /\bare\s+you\s+open\b/,
    /\bphone\s*number\b/,
    /\baddress\b/,
    /\bparking\b/,
    /\bpric(e|es|ing)\b/,
    /\bcost\b/,
    /\blocation\b/,
    /\bcontact\b/,
    /\bemail\s*address\b/,
    /\bopening\s*(hours|times)\b/,
    /\bbooking\b/,
    /\bappointment\b/,
    /\bavailab(le|ility)\b/,
  ];

  return faqPatterns.some((pattern) => pattern.test(normalized));
}
