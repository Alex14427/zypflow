import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { verifyDashboardUser } from '@/lib/auth-cookie'

const DeleteRequestSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  reason: z.string().optional(),
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

  const parsed = DeleteRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid request' },
      { status: 400 }
    )
  }

  const { email, reason } = parsed.data

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

  // 4. Find all lead IDs for this email within the org
  const { data: leads } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('email', email)
    .eq('org_id', org_id)

  const leadIds = (leads ?? []).map((l: { id: string }) => l.id)

  const tablesAffected: string[] = []
  let totalRowsDeleted = 0

  // 5. Delete child tables first (FK references lead_id), then leads

  // 5a. conversations
  if (leadIds.length > 0) {
    const { data: deleted, error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .in('lead_id', leadIds)
      .select('id')
    if (!error && deleted && deleted.length > 0) {
      tablesAffected.push('conversations')
      totalRowsDeleted += deleted.length
    }
  }

  // 5b. appointments
  if (leadIds.length > 0) {
    const { data: deleted, error } = await supabaseAdmin
      .from('appointments')
      .delete()
      .in('lead_id', leadIds)
      .select('id')
    if (!error && deleted && deleted.length > 0) {
      tablesAffected.push('appointments')
      totalRowsDeleted += deleted.length
    }
  }

  // 5c. follow_ups
  if (leadIds.length > 0) {
    const { data: deleted, error } = await supabaseAdmin
      .from('follow_ups')
      .delete()
      .in('lead_id', leadIds)
      .select('id')
    if (!error && deleted && deleted.length > 0) {
      tablesAffected.push('follow_ups')
      totalRowsDeleted += deleted.length
    }
  }

  // 5d. reviews
  if (leadIds.length > 0) {
    const { data: deleted, error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .in('lead_id', leadIds)
      .select('id')
    if (!error && deleted && deleted.length > 0) {
      tablesAffected.push('reviews')
      totalRowsDeleted += deleted.length
    }
  }

  // 5e. gdpr_consents — keyed by contact_id which maps to lead.id
  if (leadIds.length > 0) {
    const { data: deleted, error } = await supabaseAdmin
      .from('gdpr_consents')
      .delete()
      .in('contact_id', leadIds)
      .eq('org_id', org_id)
      .select('id')
    if (!error && deleted && deleted.length > 0) {
      tablesAffected.push('gdpr_consents')
      totalRowsDeleted += deleted.length
    }
  }

  // 5f. audits — anonymize rows matching this email (audit trail kept, PII removed)
  const { data: anonymizedAudits, error: auditAnonError } = await supabaseAdmin
    .from('audits')
    .update({ email: '[deleted]', ip_address: null })
    .eq('email', email)
    .select('id')
  if (!auditAnonError && anonymizedAudits && anonymizedAudits.length > 0) {
    tablesAffected.push('audits')
    totalRowsDeleted += anonymizedAudits.length
  }

  // 5g. leads (delete last — other tables reference lead_id)
  if (leadIds.length > 0) {
    const { data: deleted, error } = await supabaseAdmin
      .from('leads')
      .delete()
      .in('id', leadIds)
      .select('id')
    if (!error && deleted && deleted.length > 0) {
      tablesAffected.push('leads')
      totalRowsDeleted += deleted.length
    }
  }

  // 6. Write IMMUTABLE audit log entry (never delete from gdpr_audit_log)
  // NOTE: the `details` JSONB column must be added via migration if not yet present:
  //   ALTER TABLE gdpr_audit_log ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
  await supabaseAdmin.from('gdpr_audit_log').insert({
    org_id,
    event_type: 'data_subject_deletion',
    performed_by: user.id,
    data_fields_accessed: ['email', 'phone', 'name', 'conversations'],
    details: {
      email: '[redacted]',
      reason: reason ?? null,
      tables_affected: tablesAffected,
      rows_deleted: totalRowsDeleted,
    },
  })

  // 7. Return result
  return NextResponse.json({
    success: true,
    tablesAffected,
    totalRowsDeleted,
  })
}
