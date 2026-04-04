import { NextRequest, NextResponse } from 'next/server';
import { auditRequestSchema } from '@/lib/validators';
import { supabaseAdmin } from '@/lib/supabase';
import { fireWebhook } from '@/lib/webhook';
import { generateRevenueLeakAudit } from '@/lib/audit-engine';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = auditRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' },
      { status: 400 }
    );
  }

  const { name, business, website, email, phone, source } = parsed.data;

  try {
    const report = await generateRevenueLeakAudit({
      website,
      businessName: business,
    });

    const rawResults = {
      intake: { name, business, website, email, phone, source },
      ...report,
    };

    const aiSummary = `${report.summary.headline}. ${report.summary.body}`;

    const { data: audit, error: auditError } = await supabaseAdmin
      .from('audits')
      .insert({
        url: report.finalUrl,
        email,
        score_performance: report.scorecards.find((card) => card.key === 'performance')?.score ?? null,
        score_accessibility: report.scorecards.find((card) => card.key === 'accessibility')?.score ?? null,
        score_best_practices: report.scorecards.find((card) => card.key === 'best_practices')?.score ?? null,
        score_seo: report.scorecards.find((card) => card.key === 'seo')?.score ?? null,
        is_mobile_friendly: report.signals.hasViewport,
        has_ssl: report.signals.hasSsl,
        raw_results: rawResults,
        ai_summary: aiSummary,
        ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        user_agent: req.headers.get('user-agent') ?? null,
      })
      .select('id')
      .single();

    if (auditError || !audit) {
      console.error('Audit insert error:', auditError);
      return NextResponse.json({ error: 'Failed to save audit.' }, { status: 500 });
    }

    const { error: enquiryError } = await supabaseAdmin.from('website_enquiries').insert({
      name,
      email,
      business_name: business,
      phone,
      source,
    });

    if (enquiryError) {
      console.error('Audit enquiry insert error:', enquiryError);
    }

    if (process.env.MAKE_WEBHOOK_URL) {
      fireWebhook(
        process.env.MAKE_WEBHOOK_URL,
        {
          type: 'revenue_leak_audit',
          auditId: audit.id,
          name,
          email,
          business,
          phone,
          website: report.finalUrl,
          overallScore: report.overallScore,
          topLeak: report.summary.topLeak,
          scorecards: report.scorecards,
        },
        'make_revenue_leak_audit'
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      auditId: audit.id,
      overallScore: report.overallScore,
      reportPath: `/audit/${audit.id}`,
    });
  } catch (error) {
    console.error('Audit generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate audit.' }, { status: 500 });
  }
}
