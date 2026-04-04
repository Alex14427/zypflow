import { NextRequest, NextResponse } from 'next/server';
import { syncActivationForOrganisation } from '@/lib/activation-engine';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyDashboardUser } from '@/lib/auth-cookie';
import { getLaunchPackById } from '@/lib/launch-pack';
import { z } from 'zod';

const deploySchema = z.object({
  templateId: z.string().min(1).optional(),
  packId: z.string().min(1).optional(),
  config: z.record(z.unknown()).optional(),
  perTemplateConfig: z.record(z.string(), z.record(z.unknown())).optional(),
}).refine((value) => value.templateId || value.packId, {
  message: 'templateId or packId is required',
  path: ['templateId'],
});

async function resolveOrgAccess(userId: string, email?: string | null) {
  const { data: membership } = await supabaseAdmin
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', userId)
    .single();

  if (membership?.org_id) {
    return membership;
  }

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .or(`owner_id.eq.${userId},email.eq.${email ?? ''}`)
    .limit(1)
    .maybeSingle();

  if (!business) {
    return null;
  }

  return { org_id: business.id, role: 'owner' };
}

// POST — deploy (activate) a template for the user's org
export async function POST(req: NextRequest) {
  const authResult = await verifyDashboardUser(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const membership = await resolveOrgAccess(user.id, user.email);

  if (!membership) {
    return NextResponse.json({ error: 'No organisation found' }, { status: 403 });
  }

  if (membership.role === 'viewer') {
    return NextResponse.json({ error: 'Viewers cannot deploy templates' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = deploySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { templateId, packId, config, perTemplateConfig } = parsed.data;

  const pack = packId ? getLaunchPackById(packId) : null;
  if (packId && !pack) {
    return NextResponse.json({ error: 'Unknown workflow pack' }, { status: 404 });
  }

  const templateIds = pack ? pack.templateIds : [templateId as string];
  const deployedAt = new Date().toISOString();
  const upsertRows = templateIds.map((id) => ({
    org_id: membership.org_id,
    template_id: id,
    is_active: true,
    config: perTemplateConfig?.[id] || config || {},
    deployed_at: deployedAt,
  }));

  const { data, error } = await supabaseAdmin
    .from('deployed_templates')
    .upsert(upsertRows, { onConflict: 'org_id,template_id' })
    .select('template_id, is_active, config, deployed_at');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await syncActivationForOrganisation({
    orgId: membership.org_id,
  }).catch((syncError) => {
    console.error('Activation sync failed after deploy:', syncError);
  });

  return NextResponse.json({
    deployed: data || [],
    pack: pack ? { id: pack.id, name: pack.name, templateIds: pack.templateIds } : null,
  });
}

// DELETE — deactivate a template for the user's org
export async function DELETE(req: NextRequest) {
  const authResult = await verifyDashboardUser(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const membership = await resolveOrgAccess(user.id, user.email);

  if (!membership) {
    return NextResponse.json({ error: 'No organisation found' }, { status: 403 });
  }

  if (membership.role === 'viewer') {
    return NextResponse.json({ error: 'Viewers cannot manage templates' }, { status: 403 });
  }

  const templateId = req.nextUrl.searchParams.get('templateId');
  const packId = req.nextUrl.searchParams.get('packId');

  if (!templateId && !packId) {
    return NextResponse.json({ error: 'templateId or packId required' }, { status: 400 });
  }

  const pack = packId ? getLaunchPackById(packId) : null;
  if (packId && !pack) {
    return NextResponse.json({ error: 'Unknown workflow pack' }, { status: 404 });
  }

  const templateIds = pack ? pack.templateIds : [templateId as string];

  const { error } = await supabaseAdmin
    .from('deployed_templates')
    .update({ is_active: false })
    .eq('org_id', membership.org_id)
    .in('template_id', templateIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await syncActivationForOrganisation({
    orgId: membership.org_id,
    allowAutoDeploy: false,
  }).catch((syncError) => {
    console.error('Activation sync failed after deactivate:', syncError);
  });

  return NextResponse.json({ success: true, templateIds });
}

// GET — list deployed templates for the user's org
export async function GET(req: NextRequest) {
  const authResult = await verifyDashboardUser(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const membership = await resolveOrgAccess(user.id, user.email);

  if (!membership) {
    return NextResponse.json({ error: 'No organisation found' }, { status: 403 });
  }

  const { data: deployed } = await supabaseAdmin
    .from('deployed_templates')
    .select('template_id, is_active, config, deployed_at')
    .eq('org_id', membership.org_id)
    .eq('is_active', true);

  return NextResponse.json({ deployed: deployed || [] });
}
