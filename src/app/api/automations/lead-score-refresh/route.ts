import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { onLeadScoreUpdate } from '@/lib/workflow-triggers';

const BATCH_LIMIT = 500;
const HOT_THRESHOLD = 70;

export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  const now = new Date();

  // Fetch active leads (not won/lost), capped at BATCH_LIMIT
  const { data: leads, error } = await supabaseAdmin
    .from('leads')
    .select('id, org_id, email, phone, score, lead_score, created_at, last_contact_at')
    .not('status', 'in', '("won","lost")')
    .order('created_at', { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch leads', detail: error.message }, { status: 500 });
  }

  if (!leads || leads.length === 0) {
    return NextResponse.json({ refreshed: 0, hotCrossings: 0 });
  }

  // Gather all lead IDs to check for appointments in bulk
  const leadIds = leads.map((l: { id: string }) => l.id);
  const { data: appointmentLeads } = await supabaseAdmin
    .from('appointments')
    .select('lead_id')
    .in('lead_id', leadIds);

  const leadsWithAppointments = new Set(
    (appointmentLeads ?? []).map((a: { lead_id: string }) => a.lead_id)
  );

  let refreshed = 0;
  let hotCrossings = 0;

  for (const lead of leads) {
    const oldScore = lead.score ?? lead.lead_score ?? 0;
    const newScore = calculateScore(lead, now, leadsWithAppointments.has(lead.id));

    const { error: updateError } = await supabaseAdmin
      .from('leads')
      .update({ score: newScore, lead_score: newScore })
      .eq('id', lead.id);

    if (updateError) {
      continue;
    }

    refreshed++;

    // Fire workflow trigger if score crossed from below to at/above the hot threshold
    if (oldScore < HOT_THRESHOLD && newScore >= HOT_THRESHOLD) {
      hotCrossings++;
      await onLeadScoreUpdate(lead.org_id, lead.id, newScore);
    }
  }

  return NextResponse.json({ refreshed, hotCrossings, total: leads.length });
}

function calculateScore(
  lead: {
    email: string | null;
    phone: string | null;
    created_at: string;
    last_contact_at: string | null;
  },
  now: Date,
  hasAppointment: boolean
): number {
  let score = 50; // baseline

  // --- Contact completeness ---
  const hasEmail = Boolean(lead.email);
  const hasPhone = Boolean(lead.phone);
  if (hasEmail && hasPhone) {
    score += 15;
  } else if (hasEmail || hasPhone) {
    score += 5;
  }

  // --- Appointment boost ---
  if (hasAppointment) {
    score += 20;
  }

  // --- Days since last contact (staleness penalty) ---
  const lastContact = lead.last_contact_at ? new Date(lead.last_contact_at) : null;
  if (lastContact) {
    const daysSinceContact = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceContact <= 3) {
      score += 15;
    } else if (daysSinceContact <= 7) {
      score += 5;
    } else if (daysSinceContact <= 14) {
      score -= 5;
    } else {
      score -= 15;
    }
  } else {
    // Never contacted — penalty
    score -= 10;
  }

  // --- Days since creation (age decay unless recently active) ---
  const daysSinceCreation = Math.floor(
    (now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const recentlyActive = lastContact
    ? Math.floor((now.getTime() - new Date(lead.last_contact_at!).getTime()) / (1000 * 60 * 60 * 24)) <= 7
    : false;

  if (!recentlyActive) {
    if (daysSinceCreation > 30) {
      score -= 15;
    } else if (daysSinceCreation > 14) {
      score -= 5;
    }
  }

  // Clamp to 0–100
  return Math.max(0, Math.min(100, score));
}
