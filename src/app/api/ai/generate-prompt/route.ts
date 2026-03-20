import { NextRequest, NextResponse } from 'next/server';
import { getAnthropic, MODELS } from '@/lib/ai-client';

// Generates a custom AI system prompt based on business details
// Uses Claude Haiku — following clear structured instructions, 50x cheaper than GPT-4o
export async function POST(req: NextRequest) {
  // Rate limit
  const { aiRouteRateLimit } = await import('@/lib/ratelimit');
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await aiRouteRateLimit.limit(`ai-prompt:${ip}`);
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
  }

  const { name, industry, services, faqs, personality, extraNotes, bookingUrl } = await req.json();

  if (!name) {
    return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
  }

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: MODELS.cheap,
      max_tokens: 1500,
      system: `You are an expert at writing AI assistant system prompts for UK service businesses. Create prompts that are natural, effective at lead capture, and feel human. The prompt should be comprehensive but concise.`,
      messages: [{
        role: 'user',
        content: `Write a system prompt for an AI chat assistant with these details:

Business Name: ${name}
Industry: ${industry}
Personality: ${personality}
Services: ${JSON.stringify(services || [])}
FAQs/Knowledge Base: ${JSON.stringify(faqs || [])}
Booking URL: ${bookingUrl || 'Not set'}
Additional Notes: ${extraNotes || 'None'}

The system prompt should:
1. Define the AI's role and personality clearly
2. Include all services and pricing info
3. Include FAQ answers as knowledge
4. Have clear lead capture instructions (name, email, phone)
5. Include booking link CTA when appropriate
6. Set boundaries (never diagnose, never give legal advice, etc. based on industry)
7. Keep responses under 3 sentences
8. Be honest about being an AI if asked
9. Include the lead extraction format at the end

End the prompt with exactly this lead extraction instruction:
"When you detect contact info (name, email, or phone), append at the END of your response:
<!--LEAD:{"name":"...","email":"...","phone":"...","service_interest":"...","urgency":"low|medium|high"}-->"

Write ONLY the system prompt text, no explanations or markdown formatting.`,
      }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const prompt = textBlock ? textBlock.text : '';

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Prompt generation error:', error);
    return NextResponse.json({ error: 'Failed to generate prompt' }, { status: 500 });
  }
}
