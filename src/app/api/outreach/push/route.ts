import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { buildOutreachStep, buildProspectAudit } from '@/lib/outreach-engine';

const pushSchema = z.object({
  industry: z.string().trim().optional().nullable(),
  limit: z.number().int().min(1).max(100).optional(),
});

const OUTREACH_READY_STATUSES = new Set([
  'new',
  'retry_required',
  'outreach_sent',
  'follow_up_scheduled',
  'opened',
  'clicked',
]);

// Send native Zypflow outreach emails with audit-led personalization.
// This replaces the old "push into Instantly" behavior with direct sending plus tracked follow-up state.
export async function POST(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = pushSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid outreach payload' }, { status: 400 });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const maxLeads = parsed.data.limit ?? 25;

  let query = supabaseAdmin
    .from('prospects')
    .select(
      'id, name, email, phone, business_name, website, industry, city, status, audit_id, audit_score, audit_top_leak, outreach_stage, sequence_name, next_follow_up_at'
    )
    .not('email', 'is', null)
    .or(`next_follow_up_at.is.null,next_follow_up_at.lte.${nowIso}`)
    .order('created_at', { ascending: true });

  if (parsed.data.industry) {
    query = query.ilike('industry', `%${parsed.data.industry}%`);
  }

  const { data: prospects, error } = await query.limit(Math.min(200, Math.max(maxLeads * 4, 50)));

  if (error) {
    console.error('Prospect query failed:', error);
    return NextResponse.json({ error: 'Failed to load prospects for outreach' }, { status: 500 });
  }

  const readyProspects = (prospects || [])
    .filter((prospect) => {
      if (!prospect.status) return true;
      return OUTREACH_READY_STATUSES.has(prospect.status);
    })
    .slice(0, maxLeads);

  if (readyProspects.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No prospects ready for outreach' });
  }

  let sent = 0;
  let auditsGenerated = 0;
  const errors: string[] = [];

  for (const prospect of readyProspects) {
    if (!prospect.email) continue;

    try {
      let auditContext: { id: string; report: Awaited<ReturnType<typeof buildProspectAudit>>['report'] } | null = null;
      let auditId = prospect.audit_id ?? null;
      let auditScore = prospect.audit_score ?? null;
      let auditTopLeak = prospect.audit_top_leak ?? null;

      if (prospect.website && !auditId) {
        const audit = await buildProspectAudit({
          website: prospect.website,
          businessName: prospect.business_name || prospect.name || prospect.email,
          email: prospect.email,
        });

        const { data: savedAudit, error: auditError } = await supabaseAdmin
          .from('audits')
          .insert(audit.insertPayload)
          .select('id')
          .single();

        if (!auditError && savedAudit?.id) {
          auditId = savedAudit.id;
          auditScore = audit.report.overallScore;
          auditTopLeak = audit.report.summary.topLeak;
          auditsGenerated++;
          auditContext = {
            id: savedAudit.id,
            report: audit.report,
          };
        } else if (auditError) {
          console.error('Prospect audit insert failed:', auditError);
        }
      } else if (auditId) {
        const { data: existingAudit } = await supabaseAdmin
          .from('audits')
          .select('id, raw_results')
          .eq('id', auditId)
          .maybeSingle();

        if (existingAudit?.id) {
          auditContext = {
            id: existingAudit.id,
            report: existingAudit.raw_results as Awaited<ReturnType<typeof buildProspectAudit>>['report'],
          };
        }
      }

      const outreachStep = buildOutreachStep({
        prospect: {
          ...prospect,
          audit_id: auditId,
          audit_score: auditScore,
          audit_top_leak: auditTopLeak,
        },
        audit: auditContext,
      });

      if (!outreachStep) {
        await supabaseAdmin
          .from('prospects')
          .update({
            status: 'sequence_complete',
            next_follow_up_at: null,
          })
          .eq('id', prospect.id);
        continue;
      }

      const emailResult = await outreachStep.send();
      if (emailResult.error) {
        errors.push(`${prospect.email}: ${emailResult.error.message}`);
        await supabaseAdmin
          .from('prospects')
          .update({
            status: 'retry_required',
            audit_id: auditId,
            audit_score: auditScore,
            audit_top_leak: auditTopLeak,
          })
          .eq('id', prospect.id);
        continue;
      }

      const nextStatus = outreachStep.nextFollowUpAt
        ? outreachStep.stageIndex === 0
          ? 'outreach_sent'
          : 'follow_up_scheduled'
        : 'sequence_complete';

      await supabaseAdmin
        .from('prospects')
        .update({
          status: nextStatus,
          audit_id: auditId,
          audit_score: auditScore,
          audit_top_leak: auditTopLeak,
          outreach_stage: outreachStep.stageIndex + 1,
          sequence_name: outreachStep.sequenceName,
          last_contacted_at: nowIso,
          next_follow_up_at: outreachStep.nextFollowUpAt,
          last_email_subject: outreachStep.subject,
          last_email_preview: outreachStep.preview,
          last_email_provider: 'resend',
        })
        .eq('id', prospect.id);

      sent++;
    } catch (sendError) {
      console.error('Prospect outreach failed:', sendError);
      errors.push(`${prospect.email}: ${String(sendError)}`);
    }
  }

  return NextResponse.json({
    sent,
    total: readyProspects.length,
    auditsGenerated,
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
  });
}
