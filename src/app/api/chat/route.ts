import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { chatRateLimit } from '@/lib/ratelimit';
import { chatInputSchema } from '@/lib/validators';
import { scoreLead } from '@/lib/scoring';
import { getSystemPrompt } from '@/lib/prompts';
import { fireWebhook } from '@/lib/webhook';
import { sendLeadNotification } from '@/lib/email';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  // 1. Rate limit by IP
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await chatRateLimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many messages. Please wait.' },
      { status: 429, headers: corsHeaders() }
    );
  }

  // 2. Validate input
  const body = await req.json();
  const parsed = chatInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input' },
      { status: 400, headers: corsHeaders() }
    );
  }

  const { businessId, message, conversationId, leadId } = parsed.data;

  // 3. Fetch business details
  const { data: biz } = await supabaseAdmin
    .from('businesses')
    .select('name, industry, services, knowledge_base, ai_personality, system_prompt, booking_url, email')
    .eq('id', businessId)
    .single();

  if (!biz) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
  }

  // 4. Fetch or create conversation
  let messages: { role: string; content: string; timestamp: string }[] = [];
  if (conversationId) {
    const { data: conv } = await supabaseAdmin
      .from('conversations').select('messages').eq('id', conversationId).single();
    if (conv) messages = conv.messages;
  }

  // 5. Build system prompt (uses industry-specific templates from Section 14)
  const systemPrompt = biz.system_prompt || getSystemPrompt(
    biz.name,
    biz.industry || 'general',
    biz.services || [],
    biz.knowledge_base || [],
    biz.booking_url,
    biz.ai_personality || 'friendly and professional',
    biz.email
  );

  messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

  // 6. Call AI — GPT-4o primary, Claude fallback
  let reply = '';
  const chatMessages = messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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
      const claudeResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
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

  // 7. Parse lead data if extracted
  const leadMatch = reply.match(/<!--LEAD:(.*?)-->/s);
  let extractedLead = null;
  if (leadMatch) {
    try { extractedLead = JSON.parse(leadMatch[1]); } catch {}
    reply = reply.replace(/<!--LEAD:.*?-->/s, '').trim();
  }

  // 8. Save conversation
  messages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });

  let convId = conversationId;
  if (!convId) {
    const { data } = await supabaseAdmin.from('conversations')
      .insert({ business_id: businessId, messages, channel: 'chat' })
      .select('id').single();
    convId = data?.id;
  } else {
    await supabaseAdmin.from('conversations')
      .update({ messages, updated_at: new Date().toISOString() }).eq('id', convId);
  }

  // 9. Upsert lead if contact captured
  let currentLeadId = leadId;
  if (extractedLead && (extractedLead.email || extractedLead.phone)) {
    const leadData = {
      business_id: businessId,
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

    // Email notification to business owner
    if (biz.name && biz.email) {
      sendLeadNotification(biz.email, biz.name, {
        name: extractedLead.name,
        email: extractedLead.email,
        phone: extractedLead.phone,
        service_interest: extractedLead.service_interest,
        score: scoreLead(extractedLead),
      }).catch((err) => console.error('Lead notification email failed:', err));
    }

    // Fire Make.com webhook for new lead notification (with retry)
    if (process.env.MAKE_NEW_LEAD_WEBHOOK) {
      fireWebhook(
        process.env.MAKE_NEW_LEAD_WEBHOOK,
        {
          business_id: businessId,
          lead_id: currentLeadId,
          ...extractedLead,
          score: scoreLead(extractedLead),
        },
        'make_new_lead'
      ).catch(() => {}); // fire and forget — retries happen inside fireWebhook
    }
  }

  return NextResponse.json(
    { reply, conversationId: convId, leadId: currentLeadId, leadExtracted: !!extractedLead },
    { headers: corsHeaders() }
  );
}
