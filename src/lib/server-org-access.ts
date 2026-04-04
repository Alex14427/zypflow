import { NextRequest, NextResponse } from 'next/server';
import { verifyAutomationAuthWithOptions } from '@/lib/auth-automation';
import { verifyDashboardUser } from '@/lib/auth-cookie';
import { supabaseAdmin } from '@/lib/supabase';

type DashboardRole = 'owner' | 'admin' | 'member' | 'viewer';

const roleRank: Record<DashboardRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export interface DashboardOrgAccess {
  source: 'dashboard';
  orgId: string;
  role: DashboardRole;
  user: {
    id: string;
    email: string;
  };
  accessToken: string;
}

export interface AutomationOrgAccess {
  source: 'automation';
  orgId: string;
  role: 'automation';
}

export type RequestOrgAccess = DashboardOrgAccess | AutomationOrgAccess;

async function resolveDashboardMembership(
  userId: string,
  email: string,
  requestedOrgId?: string | null
): Promise<{ org_id: string; role: DashboardRole } | null> {
  if (requestedOrgId) {
    const { data: directMembership } = await supabaseAdmin
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', userId)
      .eq('org_id', requestedOrgId)
      .maybeSingle();

    if (directMembership?.org_id) {
      return {
        org_id: directMembership.org_id,
        role: (directMembership.role ?? 'member') as DashboardRole,
      };
    }

    const { data: ownedBusiness } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('id', requestedOrgId)
      .or(`owner_id.eq.${userId},email.eq.${email}`)
      .maybeSingle();

    if (ownedBusiness?.id) {
      return { org_id: ownedBusiness.id, role: 'owner' };
    }

    return null;
  }

  const { data: earliestMembership } = await supabaseAdmin
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (earliestMembership?.org_id) {
    return {
      org_id: earliestMembership.org_id,
      role: (earliestMembership.role ?? 'member') as DashboardRole,
    };
  }

  const { data: ownedBusiness } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .or(`owner_id.eq.${userId},email.eq.${email}`)
    .limit(1)
    .maybeSingle();

  if (!ownedBusiness?.id) {
    return null;
  }

  return { org_id: ownedBusiness.id, role: 'owner' };
}

export async function resolveRequestOrgAccess(
  req: NextRequest,
  options: {
    requestedOrgId?: string | null;
    allowAutomation?: boolean;
    minimumRole?: DashboardRole;
  } = {}
): Promise<RequestOrgAccess | NextResponse> {
  const authResult = await verifyDashboardUser(req);

  if (!(authResult instanceof NextResponse)) {
    const membership = await resolveDashboardMembership(
      authResult.user.id,
      authResult.user.email,
      options.requestedOrgId
    );

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (
      options.minimumRole &&
      roleRank[membership.role] < roleRank[options.minimumRole]
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return {
      source: 'dashboard',
      orgId: membership.org_id,
      role: membership.role,
      user: authResult.user,
      accessToken: authResult.accessToken,
    };
  }

  if (!options.allowAutomation) {
    return authResult;
  }

  const automationError = verifyAutomationAuthWithOptions(req, {
    allowDevelopmentFallback: false,
  });
  if (automationError) {
    return automationError;
  }

  const orgId = options.requestedOrgId;
  if (!orgId) {
    return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  }

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('id', orgId)
    .maybeSingle();

  if (!business?.id) {
    return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
  }

  return {
    source: 'automation',
    orgId: business.id,
    role: 'automation',
  };
}
