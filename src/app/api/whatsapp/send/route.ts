import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const WHATSAPP_API = 'https://graph.facebook.com/v19.0';

// Send a WhatsApp text message via Meta Cloud API
export async function POST(req: NextRequest) {
  // Auth check — dashboard user or automation source
  const { verifyAutomationAuth } = await import('@/lib/auth-automation');
  const authError = verifyAutomationAuth(req);

  // If automation auth fails, check for dashboard user auth
  if (authError) {
    const { verifyDashboardUser } = await import('@/lib/auth-cookie');
    const dashResult = await verifyDashboardUser(req);
    if (dashResult instanceof NextResponse) return dashResult;
  }

  const { orgId, to, message } = await req.json();

  if (!orgId || !to || !message) {
    return NextResponse.json({ error: 'orgId, to, and message are required' }, { status: 400 });
  }

  // Get business WhatsApp credentials
  const { data: biz } = await supabaseAdmin
    .from('businesses')
    .select('wa_phone_number_id, wa_access_token, name')
    .eq('id', orgId)
    .single();

  if (!biz?.wa_phone_number_id || !biz?.wa_access_token) {
    return NextResponse.json({ error: 'WhatsApp not connected for this business. Connect in Settings → Integrations.' }, { status: 400 });
  }

  // Check GDPR consent for marketing messages
  const { data: consent } = await supabaseAdmin
    .from('gdpr_consents')
    .select('id')
    .eq('org_id', orgId)
    .eq('channel', 'whatsapp')
    .is('revoked_at', null)
    .limit(1)
    .maybeSingle();

  // Log the GDPR audit event
  await supabaseAdmin.from('gdpr_audit_log').insert({
    event_type: 'whatsapp_message_sent',
    org_id: orgId,
    data_fields_accessed: ['phone'],
  });

  try {
    // Format UK number: ensure +44 prefix
    const formattedTo = to.startsWith('+') ? to : to.startsWith('0')
      ? `+44${to.slice(1)}`
      : `+${to}`;

    const res = await fetch(`${WHATSAPP_API}/${biz.wa_phone_number_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${biz.wa_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedTo.replace(/[^+\d]/g, ''),
        type: 'text',
        text: { body: message },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('WhatsApp send error:', err);
      return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, messageId: data.messages?.[0]?.id, consent: !!consent });
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return NextResponse.json({ error: 'WhatsApp API unavailable' }, { status: 500 });
  }
}
