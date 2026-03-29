import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const deploySchema = z.object({
  templateId: z.string().min(1),
  config: z.record(z.unknown()).optional(),
});

// POST — deploy (activate) a template for the user's org
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // Get user's org
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', session.user.id)
    .single();

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

  const { templateId, config } = parsed.data;

  // Upsert into deployed_templates (toggle on)
  const { data, error } = await supabase
    .from('deployed_templates')
    .upsert(
      {
        org_id: membership.org_id,
        template_id: templateId,
        is_active: true,
        config: config || {},
        deployed_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,template_id' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deployed: data });
}

// DELETE — deactivate a template for the user's org
export async function DELETE(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', session.user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'No organisation found' }, { status: 403 });
  }

  if (membership.role === 'viewer') {
    return NextResponse.json({ error: 'Viewers cannot manage templates' }, { status: 403 });
  }

  const templateId = req.nextUrl.searchParams.get('templateId');
  if (!templateId) {
    return NextResponse.json({ error: 'templateId required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('deployed_templates')
    .update({ is_active: false })
    .eq('org_id', membership.org_id)
    .eq('template_id', templateId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// GET — list deployed templates for the user's org
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', session.user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'No organisation found' }, { status: 403 });
  }

  const { data: deployed } = await supabase
    .from('deployed_templates')
    .select('template_id, is_active, config, deployed_at')
    .eq('org_id', membership.org_id)
    .eq('is_active', true);

  return NextResponse.json({ deployed: deployed || [] });
}
