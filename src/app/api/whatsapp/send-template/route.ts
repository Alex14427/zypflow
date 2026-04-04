import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveRequestOrgAccess } from '@/lib/server-org-access';

const WHATSAPP_API = 'https://graph.facebook.com/v19.0';

const templateSchema = z.object({
  orgId: z.string().uuid(),
  to: z.string().min(5),
  templateName: z.string().min(1),
  languageCode: z.string().default('en_GB'),
  leadId: z.string().uuid().optional(),
  components: z.array(z.object({
    type: z.enum(['header', 'body', 'button']),
    parameters: z.array(z.object({
      type: z.enum(['text', 'currency', 'date_time', 'image', 'document', 'video']),
      text: z.string().optional(),
      currency: z.object({
        fallback_value: z.string(),
        code: z.string(),
        amount_1000: z.number(),
      }).optional(),
      date_time: z.object({ fallback_value: z.string() }).optional(),
      image: z.object({ link: z.string() }).optional(),
    })),
    sub_type: z.enum(['quick_reply', 'url']).optional(),
    index: z.string().optional(),
  })).optional(),
});

function normalizeWhatsappNumber(value: string) {
  const trimmed = value.trim();
  const international = trimmed.startsWith('+')
    ? trimmed
    : trimmed.startsWith('0')
      ? `+44${trimmed.slice(1)}`
      : `+${trimmed}`;

  return international.replace(/[^+\d]/g, '');
}

// Send a WhatsApp template message (for marketing/utility outside 24h window)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { orgId, to, templateName, languageCode, leadId, components } = parsed.data;
  const access = await resolveRequestOrgAccess(req, {
    requestedOrgId: orgId,
    allowAutomation: true,
    minimumRole: 'member',
  });
  if (access instanceof NextResponse) return access;

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('wa_phone_number_id, wa_access_token')
    .eq('id', access.orgId)
    .single();

  if (!business?.wa_phone_number_id || !business?.wa_access_token) {
    return NextResponse.json(
      { error: 'WhatsApp not connected. Go to Settings -> Integrations to connect.' },
      { status: 400 }
    );
  }

  const formattedTo = normalizeWhatsappNumber(to);
  const leadLookup = leadId
    ? await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('org_id', access.orgId)
        .eq('id', leadId)
        .maybeSingle()
    : await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('org_id', access.orgId)
        .eq('phone', formattedTo)
        .maybeSingle();

  const lead = leadLookup.data;
  if (!lead?.id) {
    return NextResponse.json(
      { error: 'Lead not found for this WhatsApp recipient. Save the lead first before sending templates.' },
      { status: 404 }
    );
  }

  const { data: consent } = await supabaseAdmin
    .from('gdpr_consents')
    .select('id')
    .eq('org_id', access.orgId)
    .eq('contact_id', lead.id)
    .eq('channel', 'whatsapp')
    .is('revoked_at', null)
    .limit(1)
    .maybeSingle();

  if (!consent) {
    await supabaseAdmin.from('gdpr_audit_log').insert({
      event_type: 'whatsapp_template_blocked',
      org_id: access.orgId,
      contact_id: lead.id,
      performed_by: access.source === 'dashboard' ? access.user.id : null,
      data_fields_accessed: ['phone', 'consent'],
    });

    return NextResponse.json(
      { error: 'WhatsApp consent required before sending template messages to this lead.' },
      { status: 403 }
    );
  }

  try {
    const messagePayload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: formattedTo,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components && { components }),
      },
    };

    const response = await fetch(`${WHATSAPP_API}/${business.wa_phone_number_id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${business.wa_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('WhatsApp template send error:', errorBody);
      return NextResponse.json(
        { error: 'Failed to send template message', details: errorBody },
        { status: 502 }
      );
    }

    const data = await response.json();
    await supabaseAdmin.from('gdpr_audit_log').insert({
      event_type: 'whatsapp_template_sent',
      org_id: access.orgId,
      contact_id: lead.id,
      performed_by: access.source === 'dashboard' ? access.user.id : null,
      data_fields_accessed: ['phone', 'consent'],
    });

    return NextResponse.json({
      success: true,
      messageId: data.messages?.[0]?.id,
    });
  } catch (error) {
    console.error('WhatsApp template API error:', error);
    return NextResponse.json({ error: 'WhatsApp API unavailable' }, { status: 500 });
  }
}
