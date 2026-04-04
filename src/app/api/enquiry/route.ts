import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fireWebhook } from '@/lib/webhook';
import { websiteEnquirySchema } from '@/lib/validators';

/**
 * Public endpoint for landing page lead capture form.
 * No auth required — accepts name, email, business, phone from the website.
 * Stores in website_enquiries table (separate from customer leads).
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = websiteEnquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' },
      { status: 400 }
    );
  }

  const { name, email, business, phone, source } = parsed.data;

  // Store the enquiry
  const { error } = await supabaseAdmin.from('website_enquiries').insert({
    name,
    email,
    business_name: business,
    phone,
    source,
  });

  if (error) {
    console.error('Website enquiry insert error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  // Fire Make.com webhook for sales team notification
  if (process.env.MAKE_WEBHOOK_URL) {
    fireWebhook(
      process.env.MAKE_WEBHOOK_URL,
      { name, email, business, phone, source, type: 'website_enquiry' },
      'make_website_enquiry'
    ).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
