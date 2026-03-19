import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { OUTREACH_SEQUENCES } from '@/lib/outreach-templates';

const INSTANTLY_API = 'https://api.instantly.ai/api/v1';

// Push new prospects to Instantly.ai email campaigns
// Called by Make.com or manually from dashboard
export async function POST(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  const { industry, campaignId, limit: maxLeads = 50 } = await req.json().catch(() => ({
    industry: null,
    campaignId: null,
    limit: 50,
  }));

  const apiKey = process.env.INSTANTLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'INSTANTLY_API_KEY not configured' }, { status: 500 });
  }

  // Get prospects that haven't been pushed yet
  let query = supabaseAdmin
    .from('prospects')
    .select('id, name, email, business_name, website, industry, city')
    .eq('status', 'new')
    .not('email', 'is', null);

  if (industry) {
    query = query.ilike('industry', `%${industry}%`);
  }

  const { data: prospects } = await query.limit(maxLeads);
  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ pushed: 0, message: 'No new prospects to push' });
  }

  // Get or determine the campaign ID
  let targetCampaignId = campaignId;
  if (!targetCampaignId) {
    // Try to find an existing campaign for this industry
    const campaigns = await listCampaigns(apiKey);
    const industryKey = industry || 'general';
    const existing = campaigns.find((c: { name: string }) =>
      c.name.toLowerCase().includes(industryKey.toLowerCase())
    );
    targetCampaignId = existing?.id || null;
  }

  let pushed = 0;
  const errors: string[] = [];

  for (const prospect of prospects) {
    if (!prospect.email) continue;

    try {
      // Determine which sequence to use
      const industryKey = mapIndustry(prospect.industry);
      const sequence = OUTREACH_SEQUENCES[industryKey as keyof typeof OUTREACH_SEQUENCES] || OUTREACH_SEQUENCES.general;

      // Personalise variables
      const firstName = extractFirstName(prospect.name || prospect.business_name || '');
      const variables = {
        firstName: firstName || 'there',
        companyName: prospect.business_name || 'your business',
        city: prospect.city || '',
        website: prospect.website || '',
      };

      // Add lead to Instantly
      const addRes = await fetch(`${INSTANTLY_API}/lead/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          campaign_id: targetCampaignId,
          skip_if_in_workspace: true,
          leads: [{
            email: prospect.email,
            first_name: variables.firstName,
            company_name: variables.companyName,
            custom_variables: variables,
          }],
        }),
      });

      if (addRes.ok) {
        // Mark prospect as pushed
        await supabaseAdmin.from('prospects')
          .update({
            status: 'outreach_sent',
            instantly_campaign_id: targetCampaignId,
          })
          .eq('id', prospect.id);
        pushed++;
      } else {
        const err = await addRes.text();
        errors.push(`${prospect.email}: ${err}`);
      }
    } catch (err) {
      errors.push(`${prospect.email}: ${String(err)}`);
    }
  }

  return NextResponse.json({
    pushed,
    total: prospects.length,
    campaignId: targetCampaignId,
    errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
  });
}

async function listCampaigns(apiKey: string) {
  try {
    const res = await fetch(`${INSTANTLY_API}/campaign/list?api_key=${apiKey}`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

function mapIndustry(industry: string | null): string {
  if (!industry) return 'general';
  const lower = industry.toLowerCase();
  if (lower.includes('dental')) return 'dental';
  if (lower.includes('aestheti') || lower.includes('beauty') || lower.includes('skin')) return 'aesthetics';
  return 'general';
}

function extractFirstName(name: string): string {
  if (!name) return '';
  return name.split(/\s+/)[0].replace(/[^a-zA-Z'-]/g, '');
}
