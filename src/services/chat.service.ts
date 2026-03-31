import { getAnthropic, getOpenAI, MODELS } from '@/lib/ai-client';
import { sendLeadNotification } from '@/lib/email';
import { getSystemPrompt } from '@/lib/prompts';
import { scoreLead } from '@/lib/scoring';
import { supabaseAdmin } from '@/lib/supabase';
import { fireWebhook } from '@/lib/webhook';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  role: ChatRole;
  content: string;
  timestamp: string;
};

type ProcessChatInput = {
  orgId: string;
  message: string;
  conversationId?: string | null;
  leadId?: string | null;
};

type ProcessChatResult = {
  reply: string;
  conversationId?: string;
  leadId?: string | null;
  leadExtracted: boolean;
};

type ExtractedLead = {
  name?: string;
  email?: string;
  phone?: string;
  service_interest?: string;
  urgency?: string;
};

type BusinessRecord = {
  name: string;
  industry: string | null;
  services: string[] | null;
  knowledge_base: string[] | null;
  ai_personality: string | null;
  system_prompt: string | null;
  booking_url: string | null;
  email: string | null;
};

export class ChatServiceError extends Error {
  statusCode: number;
  publicMessage: string;

  constructor(publicMessage: string, statusCode = 500) {
    super(publicMessage);
    this.publicMessage = publicMessage;
    this.statusCode = statusCode;
  }
}

export async function processChatMessage(input: ProcessChatInput): Promise<ProcessChatResult> {
  const business = await fetchBusiness(input.orgId);
  let messages = await fetchConversationMessages(input.conversationId);

  messages.push({ role: 'user', content: input.message, timestamp: new Date().toISOString() });

  const systemPrompt = business.system_prompt || getSystemPrompt(
    business.name,
    business.industry || 'general',
    business.services || [],
    business.knowledge_base || [],
    business.booking_url,
    business.ai_personality || 'friendly and professional',
    business.email
  );

  const aiReply = await generateAiReply(systemPrompt, messages);
  const { reply, extractedLead } = parseLeadFromReply(aiReply);

  messages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });
  const conversationId = await upsertConversation(input.orgId, input.conversationId, messages);

  const leadId = await upsertLead({
    orgId: input.orgId,
    existingLeadId: input.leadId,
    conversationId,
    extractedLead,
    business,
  });

  return {
    reply,
    conversationId,
    leadId,
    leadExtracted: Boolean(extractedLead),
  };
}

async function fetchBusiness(orgId: string): Promise<BusinessRecord> {
  const { data: business } = await supabaseAdmin
    .from('organisations')
    .select('name, industry, services, knowledge_base, ai_personality, system_prompt, booking_url, email')
    .eq('id', orgId)
    .single();

  if (!business) {
    throw new ChatServiceError('Business not found.', 404);
  }

  return business as BusinessRecord;
}

async function fetchConversationMessages(conversationId?: string | null): Promise<ChatMessage[]> {
  if (!conversationId) {
    return [];
  }

  const { data: conversation } = await supabaseAdmin
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single();

  return Array.isArray(conversation?.messages) ? (conversation.messages as ChatMessage[]) : [];
}

async function generateAiReply(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const recentMessages = messages.slice(-20);
  const chatMessages = recentMessages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: MODELS.chat,
      messages: [{ role: 'system', content: systemPrompt }, ...chatMessages],
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (openAIError) {
    console.error('Primary AI provider failed:', openAIError);
  }

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: MODELS.chatFallback,
      max_tokens: 500,
      system: systemPrompt,
      messages: chatMessages,
    });
    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock?.text || '';
  } catch (anthropicError) {
    console.error('Fallback AI provider failed:', anthropicError);
    return "I'm sorry, I'm having trouble right now. Please try again in a moment.";
  }
}

function parseLeadFromReply(reply: string): { reply: string; extractedLead: ExtractedLead | null } {
  const leadMatch = reply.match(/<!--LEAD:(.*?)-->/s);
  if (!leadMatch) {
    return { reply, extractedLead: null };
  }

  let extractedLead: ExtractedLead | null = null;
  try {
    extractedLead = JSON.parse(leadMatch[1]) as ExtractedLead;
  } catch {
    extractedLead = null;
  }

  return {
    reply: reply.replace(/<!--LEAD:.*?-->/s, '').trim(),
    extractedLead,
  };
}

async function upsertConversation(
  orgId: string,
  conversationId: string | null | undefined,
  messages: ChatMessage[]
): Promise<string | undefined> {
  if (!conversationId) {
    const { data } = await supabaseAdmin
      .from('conversations')
      .insert({ org_id: orgId, messages, channel: 'chat' })
      .select('id')
      .single();

    return data?.id;
  }

  await supabaseAdmin
    .from('conversations')
    .update({ messages, updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return conversationId;
}

async function upsertLead(params: {
  orgId: string;
  existingLeadId?: string | null;
  conversationId?: string;
  extractedLead: ExtractedLead | null;
  business: BusinessRecord;
}): Promise<string | null | undefined> {
  const { extractedLead, existingLeadId, orgId, conversationId, business } = params;
  if (!extractedLead || (!extractedLead.email && !extractedLead.phone)) {
    return existingLeadId;
  }

  const leadScore = scoreLead(extractedLead);
  const leadData = {
    org_id: orgId,
    name: extractedLead.name,
    email: extractedLead.email,
    phone: extractedLead.phone,
    source: 'chat',
    service_interest: extractedLead.service_interest,
    urgency: extractedLead.urgency || 'medium',
    status: 'new',
    score: leadScore,
    last_contact_at: new Date().toISOString(),
  };

  let currentLeadId = existingLeadId;
  if (currentLeadId) {
    await supabaseAdmin.from('leads').update(leadData).eq('id', currentLeadId);
  } else {
    const { data } = await supabaseAdmin.from('leads').insert(leadData).select('id').single();
    currentLeadId = data?.id;
  }

  if (conversationId && currentLeadId) {
    await supabaseAdmin.from('conversations').update({ lead_id: currentLeadId }).eq('id', conversationId);
  }

  if (business.name && business.email) {
    sendLeadNotification(business.email, business.name, {
      name: extractedLead.name,
      email: extractedLead.email,
      phone: extractedLead.phone,
      service_interest: extractedLead.service_interest,
      score: leadScore,
    }).catch((emailError) => console.error('Lead email notification failed:', emailError));
  }

  if (process.env.MAKE_NEW_LEAD_WEBHOOK) {
    fireWebhook(
      process.env.MAKE_NEW_LEAD_WEBHOOK,
      {
        org_id: orgId,
        lead_id: currentLeadId,
        ...extractedLead,
        score: leadScore,
      },
      'make_new_lead'
    ).catch(() => {});
  }

  return currentLeadId;
}
