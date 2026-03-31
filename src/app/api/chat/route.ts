import { NextRequest, NextResponse } from 'next/server';
import { chatRateLimit } from '@/lib/ratelimit';
import { chatInputSchema } from '@/lib/validators';
import { ChatServiceError, processChatMessage } from '@/services/chat.service';

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
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const { success } = await chatRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many messages. Please wait.' },
        { status: 429, headers: corsHeaders() }
      );
    }

    const body = await req.json();
    const parsed = chatInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400, headers: corsHeaders() });
    }

    const result = await processChatMessage(parsed.data);
    return NextResponse.json(result, { headers: corsHeaders() });
  } catch (error) {
    if (error instanceof ChatServiceError) {
      return NextResponse.json(
        { error: error.publicMessage },
        { status: error.statusCode, headers: corsHeaders() }
      );
    }

    console.error('Chat route failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
