import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Meta webhook verification (GET) — required for WhatsApp Cloud API setup
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const token = req.nextUrl.searchParams.get('hub.verify_token');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Receive inbound WhatsApp messages (POST)
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Meta sends a complex nested structure
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  if (!value) {
    return NextResponse.json({ received: true });
  }

  // Handle incoming messages
  const messages = value.messages;
  if (messages?.length > 0) {
    for (const msg of messages) {
      const from = msg.from; // Phone number in +44... format
      const text = msg.text?.body || '';
      const timestamp = msg.timestamp;
      const waMessageId = msg.id;

      // Find which business this is for (by wa_phone_number_id)
      const phoneNumberId = value.metadata?.phone_number_id;
      const { data: biz } = await supabaseAdmin
        .from('organisations')
        .select('id, name')
        .eq('wa_phone_number_id', phoneNumberId)
        .maybeSingle();

      if (!biz) {
        console.error('No business found for WhatsApp phone_number_id:', phoneNumberId);
        continue;
      }

      // Handle STOP/opt-out (GDPR compliance)
      if (text.toUpperCase().trim() === 'STOP') {
        await supabaseAdmin.from('gdpr_consents')
          .update({ revoked_at: new Date().toISOString() })
          .eq('org_id', biz.id)
          .eq('channel', 'whatsapp');

        await supabaseAdmin.from('gdpr_audit_log').insert({
          event_type: 'consent_revoked',
          org_id: biz.id,
          performed_at: new Date().toISOString(),
          data_fields_accessed: ['phone', 'consent'],
        });
        continue;
      }

      // Find or create lead from phone number
      const formattedPhone = from.startsWith('+') ? from : `+${from}`;
      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('org_id', biz.id)
        .eq('phone', formattedPhone)
        .maybeSingle();

      let leadId = existingLead?.id;
      if (!leadId) {
        const { data: newLead } = await supabaseAdmin
          .from('leads')
          .insert({
            org_id: biz.id,
            phone: formattedPhone,
            source: 'whatsapp',
            status: 'new',
            score: 60,
          })
          .select('id')
          .single();
        leadId = newLead?.id;
      }

      // Find or create conversation
      const { data: existingConv } = await supabaseAdmin
        .from('conversations')
        .select('id, messages')
        .eq('org_id', biz.id)
        .eq('lead_id', leadId)
        .eq('channel', 'sms') // Using 'sms' channel type for now — will add 'whatsapp' later
        .maybeSingle();

      const newMessage = {
        role: 'user',
        content: text,
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
        wa_message_id: waMessageId,
        channel: 'whatsapp',
      };

      if (existingConv) {
        const messages = [...(existingConv.messages || []), newMessage];
        await supabaseAdmin.from('conversations')
          .update({ messages, updated_at: new Date().toISOString() })
          .eq('id', existingConv.id);
      } else {
        await supabaseAdmin.from('conversations')
          .insert({
            org_id: biz.id,
            lead_id: leadId,
            channel: 'sms',
            messages: [newMessage],
          });
      }

      // Record GDPR consent (service message — customer initiated)
      try {
        await supabaseAdmin.from('gdpr_consents').insert({
          contact_id: leadId,
          org_id: biz.id,
          channel: 'whatsapp',
          consent_type: 'service',
          obtained_via: 'customer_initiated',
        });
      } catch {
        // Consent may already exist — ignore duplicate
      }
    }
  }

  // Handle status updates (delivered, read, etc.)
  const statuses = value.statuses;
  if (statuses?.length > 0) {
    // Log but don't process for now — future: track delivery/read rates
    for (const status of statuses) {
      console.log(`WhatsApp status: ${status.id} → ${status.status}`);
    }
  }

  return NextResponse.json({ received: true });
}
