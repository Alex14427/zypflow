import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Handles email unsubscribe requests (GDPR compliance)
// Linked from List-Unsubscribe header and email footer
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  const token = req.nextUrl.searchParams.get('token');

  if (!email || !token) {
    return new NextResponse(unsubscribePage('Invalid unsubscribe link.', false), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Verify token matches (simple HMAC of email)
  const crypto = await import('crypto');
  const secret = process.env.AUTOMATION_SECRET || 'zypflow-unsubscribe';
  const expected = crypto.createHmac('sha256', secret).update(email).digest('hex').slice(0, 16);

  if (token !== expected) {
    return new NextResponse(unsubscribePage('Invalid unsubscribe link.', false), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Mark lead as unsubscribed
  await supabaseAdmin.from('leads')
    .update({ status: 'unsubscribed' })
    .eq('email', email);

  return new NextResponse(unsubscribePage('You have been unsubscribed from future emails.', true), {
    headers: { 'Content-Type': 'text/html' },
  });
}

// POST handler for List-Unsubscribe-Post header (RFC 8058)
export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const email = params.get('email') || req.nextUrl.searchParams.get('email');

  if (email) {
    await supabaseAdmin.from('leads')
      .update({ status: 'unsubscribed' })
      .eq('email', email);
  }

  return NextResponse.json({ unsubscribed: true });
}

function unsubscribePage(message: string, success: boolean) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribe — Zypflow</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb}
.box{text-align:center;max-width:400px;padding:40px;background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.icon{font-size:48px;margin-bottom:16px}h1{font-size:20px;color:#1f2937;margin:0 0 8px}p{color:#6b7280;font-size:14px;line-height:1.6}</style>
</head><body><div class="box">
<div class="icon">${success ? '&#10003;' : '&#10007;'}</div>
<h1>${success ? 'Unsubscribed' : 'Error'}</h1>
<p>${message}</p>
</div></body></html>`;
}
