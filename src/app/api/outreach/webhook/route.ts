import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Instantly.ai webhook endpoint.
 * Receives campaign events (reply, bounce, open, click, unsubscribe)
 * and updates prospect status accordingly.
 * Replies auto-convert prospects into leads for follow-up.
 */
export async function POST(req: NextRequest) {
  // Instantly sends a simple JSON payload — no signature verification available,
  // so we validate the webhook secret via query param
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.AUTOMATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = String(body.event_type || body.event || '');
  const email = String(body.email || body.lead_email || '');

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  // Find the prospect by email
  const { data: prospect } = await supabaseAdmin
    .from('prospects')
    .select('id, name, business_name, industry, city, website, status')
    .eq('email', email)
    .single();

  if (!prospect) {
    return NextResponse.json({ skipped: true, reason: 'Prospect not found' });
  }

  // Map Instantly event types to prospect status updates
  switch (eventType) {
    case 'reply':
    case 'replied': {
      // Update prospect status
      await supabaseAdmin
        .from('prospects')
        .update({
          status: 'replied',
          replied_at: new Date().toISOString(),
          next_follow_up_at: null,
        })
        .eq('id', prospect.id);

      // Auto-convert reply into a lead for sales follow-up
      // Check if a lead with this email already exists
      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!existingLead) {
        await supabaseAdmin.from('leads').insert({
          name: prospect.name || prospect.business_name || email,
          email,
          phone: null,
          source: 'cold_outreach',
          service_interest: 'Responded to outreach email',
          status: 'new',
          score: 65, // Warm — they replied to cold email
          last_contact_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({ processed: true, action: 'reply_converted_to_lead' });
    }

    case 'bounce':
    case 'bounced': {
      await supabaseAdmin
        .from('prospects')
        .update({ status: 'bounced', next_follow_up_at: null })
        .eq('id', prospect.id);
      return NextResponse.json({ processed: true, action: 'marked_bounced' });
    }

    case 'unsubscribe':
    case 'unsubscribed': {
      await supabaseAdmin
        .from('prospects')
        .update({ status: 'unsubscribed', next_follow_up_at: null })
        .eq('id', prospect.id);
      return NextResponse.json({ processed: true, action: 'marked_unsubscribed' });
    }

    case 'open':
    case 'opened': {
      // Only update if still in outreach_sent — don't downgrade replied/bounced
      if (prospect.status === 'outreach_sent') {
        await supabaseAdmin
          .from('prospects')
          .update({ status: 'opened' })
          .eq('id', prospect.id);
      }
      return NextResponse.json({ processed: true, action: 'marked_opened' });
    }

    case 'click':
    case 'clicked': {
      if (prospect.status === 'outreach_sent' || prospect.status === 'opened') {
        await supabaseAdmin
          .from('prospects')
          .update({ status: 'clicked' })
          .eq('id', prospect.id);
      }
      return NextResponse.json({ processed: true, action: 'marked_clicked' });
    }

    default:
      return NextResponse.json({ skipped: true, reason: `Unknown event: ${eventType}` });
  }
}
