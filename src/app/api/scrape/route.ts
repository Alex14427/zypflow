import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { supabaseAdmin } from '@/lib/supabase';

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

export async function POST(req: NextRequest) {
  const { industry, city, maxResults = 50 } = await req.json();

  if (!industry || !city) {
    return NextResponse.json({ error: 'industry and city required' }, { status: 400 });
  }

  const searchQuery = `${industry} ${city} UK`;

  // Run Google Maps scraper
  const run = await apify.actor('apify/google-maps-scraper').call({
    searchStringsArray: [searchQuery],
    maxCrawledPlacesPerSearch: maxResults,
    language: 'en',
    countryCode: 'gb',
  });

  // Fetch results
  const { items } = await apify.dataset(run.defaultDatasetId).listItems();

  let inserted = 0;
  for (const item of items as Record<string, unknown>[]) {
    const emails = item.emails as string[] | undefined;
    const phones = item.phones as string[] | undefined;
    const prospect = {
      name: (item.contactName as string) || (item.title as string) || null,
      email: (item.email as string) || emails?.[0] || null,
      phone: (item.phone as string) || phones?.[0] || null,
      business_name: (item.title as string) || '',
      website: (item.website as string) || (item.url as string) || null,
      industry,
      city,
      source: 'apify_google_maps',
      status: 'new',
    };

    // Skip if no email and no phone
    if (!prospect.email && !prospect.phone) continue;

    // Deduplicate by email or phone+business_name
    if (prospect.email) {
      const { data: existing } = await supabaseAdmin
        .from('prospects')
        .select('id')
        .eq('email', prospect.email)
        .limit(1)
        .single();
      if (existing) continue;
    }

    await supabaseAdmin.from('prospects').insert(prospect);
    inserted++;
  }

  return NextResponse.json({
    success: true,
    scraped: items.length,
    inserted,
    duplicatesSkipped: items.length - inserted,
  });
}
