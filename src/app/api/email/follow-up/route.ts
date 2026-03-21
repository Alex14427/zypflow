import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { supabaseAdmin } from '@/lib/supabase';
import { getApiUser } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const user = await getApiUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { leadId, message } = await req.json();
  if (!leadId || !message) {
    return NextResponse.json({ error: 'leadId and message are required' }, { status: 400 });
  }

  // Get lead info
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id, name, email, business_id')
    .eq('id', leadId)
    .single();

  if (!lead || !lead.email) {
    return NextResponse.json({ error: 'Lead not found or no email' }, { status: 404 });
  }

  // Verify user owns this business
  const { data: biz } = await supabaseAdmin
    .from('businesses')
    .select('id, name, email')
    .eq('id', lead.business_id)
    .single();

  if (!biz) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  // Verify the authenticated user actually owns this business
  if (biz.email !== user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Send the follow-up email
  const { error: emailError } = await sendEmail({
    to: lead.email,
    subject: `Following up — ${biz.name}`,
    html: `<h2 style="color:#1f2937">Hi ${lead.name || 'there'},</h2>
      <p style="line-height:1.7;color:#374151">${message.replace(/\n/g, '<br>')}</p>
      <p style="margin-top:20px;color:#6b7280;font-size:14px">Best regards,<br><strong>${biz.name}</strong></p>`,
  });

  if (emailError) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  // Track the follow-up
  await supabaseAdmin.from('follow_ups').insert({
    business_id: lead.business_id,
    lead_id: leadId,
    type: 'manual_email',
    sent_at: new Date().toISOString(),
  });

  // Update lead status
  await supabaseAdmin.from('leads')
    .update({ status: 'contacted', last_contact_at: new Date().toISOString() })
    .eq('id', leadId);

  return NextResponse.json({ success: true });
}
