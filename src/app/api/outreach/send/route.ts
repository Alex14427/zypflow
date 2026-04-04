import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyDashboardUser } from '@/lib/auth-cookie';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';
import { getAnthropic, MODELS } from '@/lib/ai-client';

const MAX_BATCH_SIZE = 50;

const BodySchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(MAX_BATCH_SIZE),
  templateType: z.enum(['audit_hook', 'follow_up', 'value_add']),
  orgId: z.string().uuid(),
});

function buildPrompt(
  templateType: 'audit_hook' | 'follow_up' | 'value_add',
  lead: { email: string; website?: string | null; lead_score?: number | null },
  org: { name: string; website?: string | null }
): string {
  const scoreNote =
    lead.lead_score != null
      ? `Their website audit score is ${lead.lead_score}/100.`
      : '';

  const leadWebsite = lead.website ? `Their website: ${lead.website}.` : '';
  const orgInfo = `You are reaching out on behalf of ${org.name}${org.website ? ` (${org.website})` : ''}.`;

  switch (templateType) {
    case 'audit_hook':
      return `${orgInfo} ${leadWebsite} ${scoreNote}

Write a short cold email with an "I found issues with your website" angle. Be specific, helpful, and direct. Mention one or two concrete improvement areas if you can infer them from the website or score. Do not be salesy. Sign off naturally. Output JSON with keys "subject" and "body" only.`;

    case 'follow_up':
      return `${orgInfo} ${leadWebsite} ${scoreNote}

Write a short follow-up cold email checking in after no reply to a previous message. Keep it light, not pushy. Reference that you reached out before. Do not repeat the full pitch. Output JSON with keys "subject" and "body" only.`;

    case 'value_add':
      return `${orgInfo} ${leadWebsite} ${scoreNote}

Write a short cold email that shares one genuinely useful tip or insight relevant to their business or website. No hard sell — just value. Output JSON with keys "subject" and "body" only.`;
  }
}

export async function POST(req: NextRequest) {
  // Auth check
  const authResult = await verifyDashboardUser(req);
  if (authResult instanceof NextResponse) return authResult;

  // Parse and validate body
  let parsed: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    parsed = BodySchema.parse(raw);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body', details: String(err) }, { status: 400 });
  }

  const { leadIds, templateType, orgId } = parsed;

  // Fetch org details
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organisations')
    .select('id, name, website')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
  }

  const anthropic = getAnthropic();
  let sent = 0;
  let failed = 0;

  for (const leadId of leadIds) {
    try {
      // Fetch lead
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('id, email, website, lead_score')
        .eq('id', leadId)
        .single();

      if (leadError || !lead || !lead.email) {
        console.warn(`Skipping lead ${leadId}: not found or missing email`);
        failed++;
        continue;
      }

      // Generate personalised email via Claude Haiku
      const prompt = buildPrompt(templateType, lead, org);

      const message = await anthropic.messages.create({
        model: MODELS.cheap,
        max_tokens: 512,
        system:
          'You are a UK business outreach specialist. Write short, personal cold emails. No fluff. Include specific data about their website. Keep under 150 words. British English. Always respond with valid JSON containing exactly two keys: "subject" and "body".',
        messages: [{ role: 'user', content: prompt }],
      });

      const rawText =
        message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';

      let subject: string;
      let body: string;

      try {
        // Strip markdown code fences if present
        const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        const parsed = JSON.parse(jsonText);
        subject = String(parsed.subject || '');
        body = String(parsed.body || '');
      } catch {
        console.warn(`Could not parse Claude JSON for lead ${leadId}, using raw text`);
        subject = templateType === 'audit_hook'
          ? 'A few things I noticed about your website'
          : templateType === 'follow_up'
          ? 'Following up'
          : 'A quick tip for your business';
        body = rawText;
      }

      if (!subject || !body) {
        console.warn(`Empty subject or body generated for lead ${leadId}`);
        failed++;
        continue;
      }

      // Send email via Resend
      const { error: sendError } = await sendEmail({
        to: lead.email,
        subject,
        html: `<p style="white-space:pre-wrap">${body.replace(/\n/g, '<br>')}</p>`,
      });

      if (sendError) {
        console.error(`Email send failed for lead ${leadId}:`, sendError);
        // Record as failed in outreach table
        await supabaseAdmin.from('outreach').insert({
          org_id: orgId,
          lead_id: leadId,
          contact_email: lead.email,
          subject,
          body,
          sequence_step: 1,
          status: 'failed',
          sent_at: null,
        });
        failed++;
        continue;
      }

      // Record successful send
      await supabaseAdmin.from('outreach').insert({
        org_id: orgId,
        lead_id: leadId,
        contact_email: lead.email,
        subject,
        body,
        sequence_step: 1,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      sent++;
    } catch (err) {
      console.error(`Unexpected error processing lead ${leadId}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ success: true, sent, failed });
}
