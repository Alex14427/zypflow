import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'

const LeadFromAuditSchema = z.object({
  auditId: z.string().uuid('auditId must be a valid UUID'),
  orgId: z.string().uuid('orgId must be a valid UUID').optional(),
})

/**
 * POST /api/audit/lead
 * Manual trigger for the sales team to create or update a lead from an audit result.
 * Also usable programmatically when an org context is known at time of import.
 *
 * Body: { auditId: string, orgId?: string }
 */
export async function POST(req: NextRequest) {
  // 1. Parse + validate body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = LeadFromAuditSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid request' },
      { status: 400 },
    )
  }

  const { auditId, orgId } = parsed.data

  // 2. Look up audit
  const { data: audit, error: auditError } = await supabaseAdmin
    .from('audits')
    .select('id, email, url, score_performance, score_accessibility, score_best_practices, score_seo, ai_summary')
    .eq('id', auditId)
    .maybeSingle()

  if (auditError) {
    console.error('Audit fetch error:', auditError)
    return NextResponse.json({ error: 'Failed to fetch audit' }, { status: 500 })
  }

  if (!audit) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
  }

  // 3. Require email
  if (!audit.email) {
    return NextResponse.json(
      { error: 'Audit has no email — cannot create lead' },
      { status: 400 },
    )
  }

  // 4. Compute lead score — average of the four audit scores
  const leadScore = Math.min(
    Math.round(
      (audit.score_performance + audit.score_accessibility + audit.score_best_practices + audit.score_seo) / 4,
    ),
    100,
  )

  // 5. Check for existing lead with same email (and matching org if provided)
  const existingQuery = supabaseAdmin
    .from('leads')
    .select('id, org_id')
    .eq('email', audit.email)

  const { data: existingLeads } = await existingQuery

  // Find a lead that matches: same org_id (or both null for house pool)
  const matchingLead = existingLeads?.find((l) =>
    orgId ? l.org_id === orgId : l.org_id === null,
  )

  let leadId: string

  if (matchingLead) {
    // 6a. Update existing lead — refresh score and link audit
    const { error: updateError } = await supabaseAdmin
      .from('leads')
      .update({ lead_score: leadScore })
      .eq('id', matchingLead.id)

    if (updateError) {
      console.error('Lead update error:', updateError)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    leadId = matchingLead.id
  } else {
    // 6b. Create new lead
    const { data: newLead, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({
        email: audit.email,
        website: audit.url,
        source: 'website_audit',
        status: 'new',
        lead_score: leadScore,
        org_id: orgId ?? null,
      })
      .select('id')
      .single()

    if (insertError || !newLead) {
      console.error('Lead insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }

    leadId = newLead.id
  }

  // 7. Link the audit back to this lead
  const { error: auditUpdateError } = await supabaseAdmin
    .from('audits')
    .update({ lead_id: leadId })
    .eq('id', auditId)

  if (auditUpdateError) {
    // Non-fatal — log and continue
    console.error('Failed to link audit to lead:', auditUpdateError)
  }

  // 8. Notify the sales team
  const summaryPreview = audit.ai_summary
    ? audit.ai_summary.slice(0, 300) + (audit.ai_summary.length > 300 ? '…' : '')
    : 'No AI summary available for this audit.'

  try {
    await sendEmail({
      to: 'alex@zypflow.co.uk',
      subject: `New Audit Lead: ${audit.email}`,
      html: `<h2 style="color:#1f2937">New Audit Lead</h2>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:4px 0"><strong>Email:</strong> ${audit.email}</p>
          <p style="margin:4px 0"><strong>Website:</strong> <a href="${audit.url}" style="color:#6c3cff">${audit.url}</a></p>
          <p style="margin:4px 0"><strong>Lead Score:</strong> ${leadScore}/100</p>
        </div>
        <h3 style="color:#1f2937;margin-top:20px">PageSpeed Scores</h3>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:8px 0">
          <p style="margin:4px 0"><strong>Performance:</strong> ${audit.score_performance}/100</p>
          <p style="margin:4px 0"><strong>Accessibility:</strong> ${audit.score_accessibility}/100</p>
          <p style="margin:4px 0"><strong>Best Practices:</strong> ${audit.score_best_practices}/100</p>
          <p style="margin:4px 0"><strong>SEO:</strong> ${audit.score_seo}/100</p>
        </div>
        <h3 style="color:#1f2937;margin-top:20px">AI Summary Preview</h3>
        <p style="color:#374151;line-height:1.6">${summaryPreview}</p>`,
    })
  } catch (emailErr) {
    // Non-fatal — log and continue
    console.error('Failed to send audit lead notification email:', emailErr)
  }

  // 9. Return result
  return NextResponse.json({ success: true, leadId })
}
