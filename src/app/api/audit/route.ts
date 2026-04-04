import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropic, MODELS } from '@/lib/ai-client';
import { aiRouteRateLimit } from '@/lib/ratelimit';

const AuditRequestSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  email: z.string().email().optional(),
});

const PAGESPEED_BASE =
  'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

function buildPageSpeedUrl(url: string): string {
  const params = new URLSearchParams({
    url,
    strategy: 'mobile',
  });
  params.append('category', 'performance');
  params.append('category', 'accessibility');
  params.append('category', 'best-practices');
  params.append('category', 'seo');
  return `${PAGESPEED_BASE}?${params.toString()}`;
}

function extractScore(
  categories: Record<string, { score: number | null }>,
  key: string
): number {
  const raw = categories[key]?.score;
  if (raw == null) return 0;
  return Math.round(raw * 100);
}

function calcLeadScore(
  performance: number,
  accessibility: number,
  bestPractices: number,
  seo: number
): number {
  const avg = (performance + accessibility + bestPractices + seo) / 4;
  return Math.min(Math.round(avg), 100);
}

/**
 * POST /api/audit
 * Public endpoint — no auth required.
 * Accepts { url, email? }, runs a Google PageSpeed audit, optionally generates
 * an AI summary, stores the result and returns it.
 */
export async function POST(req: NextRequest) {
  // 1. Rate limit by IP — 10 audits per hour
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success: rateLimitOk } = await aiRouteRateLimit.limit(
    `audit:${ip}`
  );
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429 }
    );
  }

  // 2. Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = AuditRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  const { url, email } = parsed.data;

  // 3. Cache check — same URL audited in last 7 days
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: cached } = await supabaseAdmin
    .from('audits')
    .select('*')
    .eq('url', url)
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({
      id: cached.id,
      url: cached.url,
      scores: {
        performance: cached.score_performance,
        accessibility: cached.score_accessibility,
        bestPractices: cached.score_best_practices,
        seo: cached.score_seo,
      },
      isMobileFriendly: cached.is_mobile_friendly,
      hasSsl: cached.has_ssl,
      aiSummary: cached.ai_summary ?? null,
      cached: true,
    });
  }

  // 4. Call Google PageSpeed Insights API
  let pageSpeedData: Record<string, unknown>;
  try {
    const psUrl = buildPageSpeedUrl(url);
    const psRes = await fetch(psUrl, { cache: 'no-store' });
    if (!psRes.ok) {
      throw new Error(`PageSpeed responded with ${psRes.status}`);
    }
    pageSpeedData = (await psRes.json()) as Record<string, unknown>;
  } catch (err) {
    console.error('PageSpeed API error:', err);
    return NextResponse.json(
      {
        error:
          'Failed to audit website. Please check the URL and try again.',
      },
      { status: 502 }
    );
  }

  // 5. Extract scores
  const categories = (
    pageSpeedData as { lighthouseResult?: { categories?: Record<string, { score: number | null }> } }
  ).lighthouseResult?.categories ?? {};

  const scorePerformance = extractScore(categories, 'performance');
  const scoreAccessibility = extractScore(categories, 'accessibility');
  const scoreBestPractices = extractScore(categories, 'best-practices');
  const scoreSeo = extractScore(categories, 'seo');

  // 6. Derived flags
  const hasSsl = url.startsWith('https');
  const isMobileFriendly = scoreAccessibility >= 70;

  // 7. AI summary (only when email is provided)
  let aiSummary: string | null = null;
  if (email) {
    try {
      const anthropic = getAnthropic();
      const aiRes = await anthropic.messages.create({
        model: MODELS.cheap,
        max_tokens: 500,
        system:
          'You are a UK web consultant. Write a brief, actionable website audit summary in plain English. Be specific about what\'s wrong and how to fix it. Keep it under 200 words.',
        messages: [
          {
            role: 'user',
            content: `Please provide a website audit summary for: ${url}

PageSpeed Insights scores (0–100):
- Performance: ${scorePerformance}
- Accessibility: ${scoreAccessibility}
- Best Practices: ${scoreBestPractices}
- SEO: ${scoreSeo}

SSL (HTTPS): ${hasSsl ? 'Yes' : 'No'}
Mobile Friendly (accessibility ≥ 70): ${isMobileFriendly ? 'Yes' : 'No'}

Write a brief, actionable summary highlighting the key issues and how to fix them.`,
          },
        ],
      });
      const textBlock = aiRes.content.find(
        (b: { type: string; text?: string }) => b.type === 'text'
      ) as { type: 'text'; text: string } | undefined;
      aiSummary = textBlock ? textBlock.text : null;
    } catch (err) {
      console.error('AI summary generation error:', err);
      // Non-fatal — proceed without summary
    }
  }

  // 8. Store audit result
  const userAgent = req.headers.get('user-agent') ?? null;

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('audits')
    .insert({
      url,
      email: email ?? null,
      score_performance: scorePerformance,
      score_accessibility: scoreAccessibility,
      score_best_practices: scoreBestPractices,
      score_seo: scoreSeo,
      is_mobile_friendly: isMobileFriendly,
      has_ssl: hasSsl,
      raw_results: pageSpeedData,
      ai_summary: aiSummary,
      ip_address: ip,
      user_agent: userAgent,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Audit insert error:', insertError);
    // Still return results even if storage fails
  }

  // 9. Auto-create lead when email is provided and audit was stored
  if (email && inserted?.id) {
    const leadScore = calcLeadScore(
      scorePerformance,
      scoreAccessibility,
      scoreBestPractices,
      scoreSeo
    );

    try {
      // Upsert into the Zypflow house pool (no org_id) — same email deduplication
      const { data: existingLeads } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('email', email)
        .is('org_id', null)
        .limit(1);

      const existingLead = existingLeads?.[0];
      let leadId: string | null = null;

      if (existingLead) {
        await supabaseAdmin
          .from('leads')
          .update({ lead_score: leadScore })
          .eq('id', existingLead.id);
        leadId = existingLead.id;
      } else {
        const { data: newLead } = await supabaseAdmin
          .from('leads')
          .insert({
            email,
            website: url,
            source: 'website_audit',
            status: 'new',
            lead_score: leadScore,
            org_id: null,
          })
          .select('id')
          .single();
        leadId = newLead?.id ?? null;
      }

      // Link the audit to the lead
      if (leadId) {
        await supabaseAdmin
          .from('audits')
          .update({ lead_id: leadId })
          .eq('id', inserted.id);
      }
    } catch (leadErr) {
      // Non-fatal — audit result is still returned
      console.error('Auto lead creation error:', leadErr);
    }
  }

  // 10. Return response
  return NextResponse.json({
    id: inserted?.id ?? null,
    url,
    scores: {
      performance: scorePerformance,
      accessibility: scoreAccessibility,
      bestPractices: scoreBestPractices,
      seo: scoreSeo,
    },
    isMobileFriendly,
    hasSsl,
    aiSummary,
  });
}
