import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fireWebhook } from '@/lib/webhook';

/**
 * Public endpoint for landing page lead capture form.
 * No auth required — accepts name, email, business, phone from the website.
 * Stores in website_enquiries table (separate from customer leads).
 */
export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, business, phone, source } = body;

  if (!email || !name) {
    return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  // Store the enquiry
  const { error } = await supabaseAdmin.from('website_enquiries').insert({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    business_name: (business || '').trim(),
    phone: (phone || '').trim(),
    source: source || 'website_audit_form',
  });

  if (error) {
    console.error('Website enquiry insert error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  // Fire Make.com webhook for sales team notification
  if (process.env.MAKE_WEBHOOK_URL) {
    fireWebhook(
      process.env.MAKE_WEBHOOK_URL,
      { name, email, business, phone, source: 'website_audit_form', type: 'website_enquiry' },
      'make_website_enquiry'
    ).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
