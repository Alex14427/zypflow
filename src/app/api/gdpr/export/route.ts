import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { verifyDashboardUser } from '@/lib/auth-cookie'

const ExportRequestSchema = z.object({
  email: z.string().email('Must be a valid email address'),
})

export async function POST(req: NextRequest) {
  // 1. Auth
  const authResult = await verifyDashboardUser(req)
  if (authResult instanceof NextResponse) return authResult
  const { user } = authResult

  // 2. Parse + validate body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ExportRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid request' },
      { status: 400 }
    )
  }

  const { email } = parsed.data

  // 3. Resolve org_id from org_members
  const { data: member, error: memberError } = await supabaseAdmin
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (memberError || !member) {
    return NextResponse.json({ error: 'Organisation not found' }, { status: 403 })
  }

  const { org_id } = member

  // 4. Query all tables for this email within the org

  // 4a. leads (by email + org_id)
  const { data: leads } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('email', email)
    .eq('org_id', org_id)

  const leadIds = (leads ?? []).map((l: { id: string }) => l.id)

  // 4b. conversations (by lead_id)
  const { data: conversations } = leadIds.length > 0
    ? await supabaseAdmin
        .from('conversations')
        .select('*')
        .in('lead_id', leadIds)
        .eq('org_id', org_id)
    : { data: [] }

  // 4c. appointments (by lead_id)
  const { data: appointments } = leadIds.length > 0
    ? await supabaseAdmin
        .from('appointments')
        .select('*')
        .in('lead_id', leadIds)
        .eq('org_id', org_id)
    : { data: [] }

  // 4d. reviews (by lead_id)
  const { data: reviews } = leadIds.length > 0
    ? await supabaseAdmin
        .from('reviews')
        .select('*')
        .in('lead_id', leadIds)
        .eq('org_id', org_id)
    : { data: [] }

  // 4e. gdpr_consents (by contact_id which maps to lead.id)
  const { data: consents } = leadIds.length > 0
    ? await supabaseAdmin
        .from('gdpr_consents')
        .select('*')
        .in('contact_id', leadIds)
        .eq('org_id', org_id)
    : { data: [] }

  // 4f. audits (by email — no org_id on audits table; scoped to public audit tool)
  const { data: audits } = await supabaseAdmin
    .from('audits')
    .select('id, url, score_performance, score_accessibility, score_best_practices, score_seo, is_mobile_friendly, has_ssl, ai_summary, created_at')
    .eq('email', email)

  // 5. Write IMMUTABLE audit log entry
  // NOTE: the `details` JSONB column must be added via migration if not yet present:
  //   ALTER TABLE gdpr_audit_log ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
  await supabaseAdmin.from('gdpr_audit_log').insert({
    org_id,
    event_type: 'data_subject_access_request',
    performed_by: user.id,
    data_fields_accessed: ['email', 'phone', 'name', 'conversations', 'appointments', 'reviews', 'consents', 'audits'],
    details: {
      email: '[redacted]',
      records_returned: {
        leads: (leads ?? []).length,
        conversations: (conversations ?? []).length,
        appointments: (appointments ?? []).length,
        reviews: (reviews ?? []).length,
        consents: (consents ?? []).length,
        audits: (audits ?? []).length,
      },
    },
  })

  // 6. Return compiled data
  return NextResponse.json({
    leads: leads ?? [],
    conversations: conversations ?? [],
    appointments: appointments ?? [],
    reviews: reviews ?? [],
    consents: consents ?? [],
    audits: audits ?? [],
  })
}
