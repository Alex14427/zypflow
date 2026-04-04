import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI, MODELS } from '@/lib/ai-client';
import { canUseOpenAI, isLocalSmokeMode } from '@/lib/local-mode';

// AI-powered business data extraction from website URL
// Uses GPT-4o — complex HTML parsing needs capability (can't downgrade this one)
export async function POST(req: NextRequest) {
  // Rate limit
  const { aiRouteRateLimit } = await import('@/lib/ratelimit');
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await aiRouteRateLimit.limit(`ai-extract:${ip}`);
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
  }

  const { url } = await req.json();

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Fetch the website HTML
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Zypflow/1.0; +https://zypflow.co.uk)',
        'Accept': 'text/html',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ error: 'Could not fetch website' }, { status: 422 });
    }

    const html = await response.text();

    // Strip scripts, styles, and extract meaningful text
    const cleanText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-zA-Z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);

    if (isLocalSmokeMode() || !canUseOpenAI()) {
      const host = new URL(url).hostname.replace(/^www\./, '');
      const businessName = host.split('.')[0].replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
      const industry = /dental|dentist/.test(cleanText.toLowerCase())
        ? 'Dental'
        : /aesthetic|skin|beauty|laser|cosmetic/.test(cleanText.toLowerCase())
          ? 'Aesthetics'
          : /physio|physiotherapy/.test(cleanText.toLowerCase())
            ? 'Physiotherapy'
            : /legal|solicitor|law/.test(cleanText.toLowerCase())
              ? 'Legal'
              : /plumb|electric|clean|landscap/.test(cleanText.toLowerCase())
                ? 'Home Services'
                : 'Other';

      return NextResponse.json({
        success: true,
        mode: 'local_smoke',
        data: {
          name: businessName || 'Local Test Business',
          industry,
          phone: '',
          services: [
            { name: 'Initial consultation', price: '', duration_minutes: '30' },
            { name: 'Follow-up appointment', price: '', duration_minutes: '30' },
            { name: 'Signature treatment', price: '', duration_minutes: '45' },
          ],
          faqs: [
            { question: 'Do you offer consultations?', answer: 'Yes, the clinic can usually arrange an initial consultation before treatment.' },
            { question: 'How do I book?', answer: 'Use the clinic booking link or contact the team directly.' },
            { question: 'Where are you based?', answer: 'Please confirm the exact location from the clinic website or contact details.' },
            { question: 'What should I expect on the first visit?', answer: 'Most first visits cover your goals, suitability, and next steps.' },
            { question: 'Can I ask questions before booking?', answer: 'Yes, the clinic can answer common questions before you commit.' },
          ],
          description: `${businessName || 'This business'} appears to offer ${industry.toLowerCase()} services in the UK.`,
          personality: 'professional and formal',
          openingHours: '',
          address: '',
        },
      });
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: MODELS.extraction,
      messages: [
        {
          role: 'system',
          content: `You are a business data extraction expert. Analyze website content and extract structured business information. Return ONLY valid JSON with no markdown wrapping.`,
        },
        {
          role: 'user',
          content: `Extract business information from this website content. Return JSON with these exact fields:

{
  "name": "Business name",
  "industry": "One of: Dental, Aesthetics, Physiotherapy, Legal, Home Services, Other",
  "phone": "Phone number if found, or empty string",
  "services": [
    {"name": "Service name", "price": "Price if found or empty", "duration_minutes": "Duration if found or empty"}
  ],
  "faqs": [
    {"question": "Common customer question inferred from content", "answer": "Answer based on website content"}
  ],
  "description": "One-sentence business description",
  "personality": "One of: warm and friendly, professional and formal, casual and approachable, luxury and sophisticated",
  "openingHours": "Opening hours if found, or empty string",
  "address": "Physical address if found, or empty string"
}

Rules:
- Extract 3-8 services if you can identify them
- Generate 5-8 FAQs that customers would commonly ask, based on what the website offers
- Infer the industry from the services and content
- Choose personality based on the website's tone and language
- If a field isn't found, use empty string (never null)

Website content:
${cleanText}`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const rawResponse = completion.choices[0].message.content || '{}';
    const jsonStr = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const extracted = JSON.parse(jsonStr);

    return NextResponse.json({ success: true, data: extracted });
  } catch (error) {
    console.error('Business extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website. You can fill in details manually.' },
      { status: 500 }
    );
  }
}
