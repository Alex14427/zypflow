import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function normalizeWhatsappNumber(value: string) {
  const trimmed = value.trim();
  const international = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  return international.replace(/[^+\d]/g, '');
}

// Meta webhook verification (GET) - required for WhatsApp Cloud API setup
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

  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  if (!value) {
    return NextResponse.json({ received: true });
  }

  const messages = value.messages;
  if (messages?.length > 0) {
    for (const msg of messages) {
      const from = msg.from;
      const text = msg.text?.body || '';
      const timestamp = msg.timestamp;
      const waMessageId = msg.id;

      const phoneNumberId = value.metadata?.phone_number_id;
      const { data: business } = await supabaseAdmin
        .from('businesses')
        .select('id, name')
        .eq('wa_phone_number_id', phoneNumberId)
        .maybeSingle();

      if (!business) {
        console.error('No business found for WhatsApp phone_number_id:', phoneNumberId);
        continue;
      }

      const formattedPhone = normalizeWhatsappNumber(from);
      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('org_id', business.id)
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (text.toUpperCase().trim() === 'STOP') {
        if (existingLead?.id) {
          await supabaseAdmin.from('gdpr_consents')
            .update({ revoked_at: new Date().toISOString() })
            .eq('org_id', business.id)
            .eq('contact_id', existingLead.id)
            .eq('channel', 'whatsapp')
            .is('revoked_at', null);
        }

        await supabaseAdmin.from('gdpr_audit_log').insert({
          event_type: 'consent_revoked',
          org_id: business.id,
          contact_id: existingLead?.id ?? null,
          performed_at: new Date().toISOString(),
          data_fields_accessed: ['phone', 'consent'],
        });
        continue;
      }

      let leadId = existingLead?.id;
      if (!leadId) {
        const { data: newLead } = await supabaseAdmin
          .from('leads')
          .insert({
            org_id: business.id,
            phone: formattedPhone,
            source: 'whatsapp',
            status: 'new',
            score: 60,
          })
          .select('id')
          .single();
        leadId = newLead?.id;
      }

      const { data: existingConversation } = await supabaseAdmin
        .from('conversations')
        .select('id, messages')
        .eq('org_id', business.id)
        .eq('lead_id', leadId)
        .eq('channel', 'whatsapp')
        .maybeSingle();

      const newMessage = {
        role: 'user',
        content: text,
        timestamp: new Date(parseInt(timestamp, 10) * 1000).toISOString(),
        wa_message_id: waMessageId,
        channel: 'whatsapp',
      };

      if (existingConversation) {
        const messages = [...(existingConversation.messages || []), newMessage];
        await supabaseAdmin.from('conversations')
          .update({ messages, updated_at: new Date().toISOString() })
          .eq('id', existingConversation.id);
      } else {
        await supabaseAdmin.from('conversations')
          .insert({
            org_id: business.id,
            lead_id: leadId,
            channel: 'whatsapp',
            messages: [newMessage],
          });
      }

      const { data: activeConsent } = await supabaseAdmin
        .from('gdpr_consents')
        .select('id')
        .eq('org_id', business.id)
        .eq('contact_id', leadId)
        .eq('channel', 'whatsapp')
        .is('revoked_at', null)
        .limit(1)
        .maybeSingle();

      if (!activeConsent) {
        await supabaseAdmin.from('gdpr_consents').insert({
          contact_id: leadId,
          org_id: business.id,
          channel: 'whatsapp',
          consent_type: 'service',
          obtained_via: 'customer_initiated',
        });
      }
    }
  }

  const statuses = value.statuses;
  if (statuses?.length > 0) {
    for (const status of statuses) {
      console.log(`WhatsApp status: ${status.id} -> ${status.status}`);
    }
  }

  return NextResponse.json({ received: true });
}
