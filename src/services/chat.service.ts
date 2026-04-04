import { getOpenAI, getAnthropic, MODELS } from '@/lib/ai-client';
import { supabaseAdmin } from '@/lib/supabase';
import { scoreLead } from '@/lib/scoring';
import { getSystemPrompt } from '@/lib/prompts';
import { fireWebhook } from '@/lib/webhook';
import { sendLeadNotification } from '@/lib/email';

export type ChatServiceInput = {
  orgId: string;
  message: string;
  conversationId?: string;
  leadId?: string;
};

export type ChatServiceResult = {
  reply: string;
  conversationId: string | null | undefined;
  leadId: string | null | undefined;
  leadExtracted: boolean;
};

export async function processChatMessage({ orgId, message, conversationId, leadId }: ChatServiceInput): Promise<ChatServiceResult> {
  // 1. Fetch business details
  const { data: biz } = await supabaseAdmin
    .from('businesses')
    .select('name, industry, services, knowledge_base, ai_personality, system_prompt, booking_url, email')
    .eq('id', orgId)
    .single();

  if (!biz) {
    throw new Error('ORG_NOT_FOUND');
  }

  // 2. Fetch or create conversation
  let messages: { role: string; content: string; timestamp: string }[] = [];
  if (conversationId) {
    const { data: conv } = await supabaseAdmin
      .from('conversations').select('messages').eq('id', conversationId).single();
    if (conv) messages = conv.messages;
  }

  // 3. Build system prompt
  const systemPrompt = biz.system_prompt || getSystemPrompt(
    biz.name,
    biz.industry || 'general',
    biz.services || [],
    biz.knowledge_base || [],
    biz.booking_url,
    biz.ai_personality || 'friendly and professional',
    biz.email ?? undefined
  );

  messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

  // 4. Call AI — GPT-4o primary, Claude Sonnet fallback
  const recentMessages = messages.slice(-20);
  let reply = '';
  const chatMessages = recentMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: MODELS.chat,
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatMessages,
      ],
      max_tokens: 500,
      temperature: 0.7,
    });
    reply = completion.choices[0].message.content || '';
  } catch (openaiError) {
    console.error('OpenAI failed, falling back to Claude:', openaiError);
    try {
      const anthropic = getAnthropic();
      const claudeResponse = await anthropic.messages.create({
        model: MODELS.chatFallback,
        max_tokens: 500,
        system: systemPrompt,
        messages: chatMessages,
      });
      const textBlock = claudeResponse.content.find((b) => b.type === 'text');
      reply = textBlock ? textBlock.text : '';
    } catch (claudeError) {
      console.error('Claude also failed:', claudeError);
      reply = "I'm sorry, I'm having trouble right now. Please try again in a moment.";
    }
  }

  // 5. Parse lead data if extracted
  const leadMatch = reply.match(/<!--LEAD:(.*?)-->/s);
  let extractedLead = null;
  if (leadMatch) {
    try { extractedLead = JSON.parse(leadMatch[1]); } catch {}
    reply = reply.replace(/<!--LEAD:.*?-->/s, '').trim();
  }

  // 6. Save conversation
  messages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });

  let convId = conversationId;
  if (!convId) {
    const { data } = await supabaseAdmin.from('conversations')
      .insert({ org_id: orgId, messages, channel: 'chat' })
      .select('id').single();
    convId = data?.id;
  } else {
    await supabaseAdmin.from('conversations')
      .update({ messages, updated_at: new Date().toISOString() }).eq('id', convId);
  }

  // 7. Upsert lead if contact captured
  let currentLeadId = leadId;
  if (extractedLead && (extractedLead.email || extractedLead.phone)) {
    const leadData = {
      org_id: orgId,
      name: extractedLead.name,
      email: extractedLead.email,
      phone: extractedLead.phone,
      source: 'chat',
      service_interest: extractedLead.service_interest,
      urgency: extractedLead.urgency || 'medium',
      status: 'new',
      score: scoreLead(extractedLead),
      last_contact_at: new Date().toISOString(),
    };

    if (currentLeadId) {
      await supabaseAdmin.from('leads').update(leadData).eq('id', currentLeadId);
    } else {
      const { data } = await supabaseAdmin.from('leads')
        .insert(leadData).select('id').single();
      currentLeadId = data?.id;
    }

    if (convId && currentLeadId) {
      await supabaseAdmin.from('conversations')
        .update({ lead_id: currentLeadId }).eq('id', convId);
    }

    if (biz.name && biz.email) {
      sendLeadNotification(biz.email, biz.name, {
        name: extractedLead.name,
        email: extractedLead.email,
        phone: extractedLead.phone,
        service_interest: extractedLead.service_interest,
        score: scoreLead(extractedLead),
      }).catch((err) => console.error('Lead notification email failed:', err));
    }

    if (process.env.MAKE_NEW_LEAD_WEBHOOK) {
      fireWebhook(
        process.env.MAKE_NEW_LEAD_WEBHOOK,
        {
          org_id: orgId,
          lead_id: currentLeadId,
          ...extractedLead,
          score: scoreLead(extractedLead),
        },
        'make_new_lead'
      ).catch(() => {});
    }
  }

  return { reply, conversationId: convId, leadId: currentLeadId, leadExtracted: !!extractedLead };
}
