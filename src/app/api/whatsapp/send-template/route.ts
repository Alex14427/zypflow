import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const WHATSAPP_API = 'https://graph.facebook.com/v19.0';

const templateSchema = z.object({
  orgId: z.string().uuid(),
  to: z.string().min(5),
  templateName: z.string().min(1),
  languageCode: z.string().default('en_GB'),
  components: z.array(z.object({
    type: z.enum(['header', 'body', 'button']),
    parameters: z.array(z.object({
      type: z.enum(['text', 'currency', 'date_time', 'image', 'document', 'video']),
      text: z.string().optional(),
      currency: z.object({ fallback_value: z.string(), code: z.string(), amount_1000: z.number() }).optional(),
      date_time: z.object({ fallback_value: z.string() }).optional(),
      image: z.object({ link: z.string() }).optional(),
    })),
    sub_type: z.enum(['quick_reply', 'url']).optional(),
    index: z.string().optional(),
  })).optional(),
});

// Send a WhatsApp template message (for marketing/utility outside 24h window)
export async function POST(req: NextRequest) {
  // Auth: automation or dashboard user
  const { verifyAutomationAuth } = await import('@/lib/auth-automation');
  const authError = verifyAutomationAuth(req);

  if (authError) {
    const { verifyDashboardUser } = await import('@/lib/auth-cookie');
    const dashResult = await verifyDashboardUser(req);
    if (dashResult instanceof NextResponse) return dashResult;
  }

  const body = await req.json();
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { orgId, to, templateName, languageCode, components } = parsed.data;

  // Get org WhatsApp credentials
  const { data: org } = await supabaseAdmin
    .from('businesses')
    .select('wa_phone_number_id, wa_access_token, name')
    .eq('id', orgId)
    .single();

  if (!org?.wa_phone_number_id || !org?.wa_access_token) {
    return NextResponse.json(
      { error: 'WhatsApp not connected. Go to Settings → Integrations to connect.' },
      { status: 400 }
    );
  }

  // GDPR audit
  await supabaseAdmin.from('gdpr_audit_log').insert({
    event_type: 'whatsapp_template_sent',
    org_id: orgId,
    data_fields_accessed: ['phone'],
    details: { template: templateName },
  });

  try {
    // Format UK number
    const formattedTo = to.startsWith('+') ? to : to.startsWith('0')
      ? `+44${to.slice(1)}`
      : `+${to}`;

    const messagePayload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: formattedTo.replace(/[^+\d]/g, ''),
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components && { components }),
      },
    };

    const res = await fetch(`${WHATSAPP_API}/${org.wa_phone_number_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${org.wa_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('WhatsApp template send error:', err);
      return NextResponse.json(
        { error: 'Failed to send template message', details: err },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      messageId: data.messages?.[0]?.id,
    });
  } catch (error) {
    console.error('WhatsApp template API error:', error);
    return NextResponse.json({ error: 'WhatsApp API unavailable' }, { status: 500 });
  }
}
