import { NextRequest, NextResponse } from 'next/server';
import { getAnthropic, MODELS } from '@/lib/ai-client';
import { canUseAnthropic, isLocalSmokeMode } from '@/lib/local-mode';

// Generates 3 smart reply suggestions for a conversation
// Uses Claude Haiku — simple structured output, 50x cheaper than GPT-4o
export async function POST(req: NextRequest) {
  // Rate limit — AI calls cost money even with Haiku
  const { aiRouteRateLimit } = await import('@/lib/ratelimit');
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await aiRouteRateLimit.limit(`ai-suggest:${ip}`);
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
  }

  const { messages, leadName, businessName, service } = await req.json();

  if (!messages?.length) {
    return NextResponse.json({ error: 'Messages required' }, { status: 400 });
  }

  if (isLocalSmokeMode() || !canUseAnthropic()) {
    const customerName = leadName || 'there';
    const biz = businessName || 'the clinic';
    const replies = [
      `Hi ${customerName}, thanks for reaching out to ${biz}. I can help you with the next step and make sure the team sees this quickly.`,
      `Hi ${customerName}, if you would like, I can send over the best booking link for ${service || 'the consultation'} so you can pick a suitable time.`,
      `Hi ${customerName}, just checking in - if you still want help with ${service || 'this enquiry'}, we can get you booked in or answer any remaining questions.`,
    ];

    return NextResponse.json({ suggestions: replies, mode: 'local_smoke' });
  }

  try {
    const lastMessages = messages.slice(-6);
    const conversationText = lastMessages
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Customer' : 'Business'}: ${m.content}`)
      .join('\n');

    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: MODELS.cheap,
      max_tokens: 300,
      system: `You are a reply suggestion engine for ${businessName || 'a UK service business'}. Generate 3 short, professional SMS/chat reply options for the business owner to send to their customer.

Rules:
- Each reply should be 1-2 sentences max
- One reply should be a booking nudge
- One reply should answer/acknowledge the customer's last message
- One reply should be a friendly check-in or follow-up
- Use British English
- Be warm and professional
- Include the customer's name (${leadName || 'there'}) naturally
- Return ONLY a JSON array of 3 strings, no markdown`,
      messages: [{
        role: 'user',
        content: `Conversation so far:\n${conversationText}\n\n${service ? `Service of interest: ${service}` : ''}\n\nGenerate 3 reply options for the business owner to send:`,
      }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const raw = textBlock ? textBlock.text : '[]';
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const suggestions = JSON.parse(jsonStr);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Reply suggestion error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
