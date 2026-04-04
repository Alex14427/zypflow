import twilio from 'twilio';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

const { validateRequest } = twilio;

const incomingSmsSchema = z.object({
  From: z.string().regex(/^\+[1-9]\d{6,14}$/),
  Body: z.string().trim().min(1).max(1600),
  To: z.string().regex(/^\+[1-9]\d{6,14}$/).optional(),
  MessageSid: z.string().optional(),
  AccountSid: z.string().optional(),
});

type IncomingSmsPayload = z.infer<typeof incomingSmsSchema>;

const optOutKeywords = new Set(['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);

function buildIncomingMessage(payload: IncomingSmsPayload) {
  return {
    role: 'user',
    content: payload.Body,
    timestamp: new Date().toISOString(),
    channel: 'sms',
    provider: 'twilio',
    message_sid: payload.MessageSid ?? null,
  };
}

export function parseTwilioFormData(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};

  formData.forEach((value, key) => {
    if (typeof value === 'string') {
      params[key] = value;
    }
  });

  return params;
}

export function validateIncomingSmsPayload(payload: Record<string, string>): IncomingSmsPayload {
  return incomingSmsSchema.parse(payload);
}

export function isValidTwilioWebhookSignature(input: {
  twilioSignature: string;
  url: string;
  params: Record<string, string>;
}): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    return false;
  }

  return validateRequest(authToken, input.twilioSignature, input.url, input.params);
}

export async function persistIncomingSms(payload: IncomingSmsPayload): Promise<{ saved: boolean }> {
  const { data: lead, error: leadError } = await supabaseAdmin
    .from('leads')
    .select('id, org_id')
    .eq('phone', payload.From)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (leadError) {
    throw new Error(`Failed to find lead for incoming SMS: ${leadError.message}`);
  }

  if (!lead) {
    return { saved: false };
  }

  const message = buildIncomingMessage(payload);

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from('conversations')
    .select('id, messages')
    .eq('lead_id', lead.id)
    .eq('channel', 'sms')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (conversationError) {
    throw new Error(`Failed to fetch SMS conversation: ${conversationError.message}`);
  }

  if (conversation) {
    const existingMessages = Array.isArray(conversation.messages) ? conversation.messages : [];

    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({ messages: [...existingMessages, message], updated_at: new Date().toISOString() })
      .eq('id', conversation.id);

    if (updateError) {
      throw new Error(`Failed to update SMS conversation: ${updateError.message}`);
    }
  } else {
    const { error: insertError } = await supabaseAdmin.from('conversations').insert({
      lead_id: lead.id,
      org_id: lead.org_id,
      channel: 'sms',
      messages: [message],
    });

    if (insertError) {
      throw new Error(`Failed to create SMS conversation: ${insertError.message}`);
    }
  }

  const normalizedBody = payload.Body.toUpperCase().trim();
  if (optOutKeywords.has(normalizedBody)) {
    const { error: optOutError } = await supabaseAdmin
      .from('leads')
      .update({ status: 'lost', sms_opted_out: true })
      .eq('id', lead.id);

    if (optOutError) {
      throw new Error(`Failed to update opt-out status: ${optOutError.message}`);
    }
  }

  return { saved: true };
}
