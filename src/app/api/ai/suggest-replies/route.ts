import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generates 3 smart reply suggestions for a conversation
// Used in the conversations dashboard when a business owner is replying
export async function POST(req: NextRequest) {
  const { messages, leadName, businessName, service } = await req.json();

  if (!messages?.length) {
    return NextResponse.json({ error: 'Messages required' }, { status: 400 });
  }

  try {
    const lastMessages = messages.slice(-6); // Last 6 messages for context

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a reply suggestion engine for ${businessName || 'a UK service business'}. Generate 3 short, professional SMS/chat reply options for the business owner to send to their customer.

Rules:
- Each reply should be 1-2 sentences max
- One reply should be a booking nudge
- One reply should answer/acknowledge the customer's last message
- One reply should be a friendly check-in or follow-up
- Use British English
- Be warm and professional
- Include the customer's name (${leadName || 'there'}) naturally
- Return ONLY a JSON array of 3 strings, no markdown`,
        },
        {
          role: 'user',
          content: `Conversation so far:\n${lastMessages.map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Customer' : 'Business'}: ${m.content}`).join('\n')}\n\n${service ? `Service of interest: ${service}` : ''}\n\nGenerate 3 reply options for the business owner to send:`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content || '[]';
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const suggestions = JSON.parse(jsonStr);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Reply suggestion error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
