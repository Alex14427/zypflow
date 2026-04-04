import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Handle CORS preflight for cross-origin widget embedding
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Public endpoint — returns minimal business info for widget branding
// No auth required since this is embedded on client websites
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId');

  if (!orgId) {
    return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from('businesses')
    .select('name, industry, ai_personality, services, booking_url, widget_color, settings')
    .eq('id', orgId)
    .single();

  if (!data) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  return NextResponse.json({
    name: data.name,
    industry: data.industry,
    ai_personality: data.ai_personality,
    logoUrl:
      typeof (data.settings as Record<string, unknown> | null)?.logo_url === 'string'
        ? ((data.settings as Record<string, unknown>).logo_url as string)
        : null,
    brandColor:
      (typeof (data.settings as Record<string, unknown> | null)?.brand_color === 'string'
        ? ((data.settings as Record<string, unknown>).brand_color as string)
        : data.widget_color) || '#d26645',
    bookingUrl: data.booking_url || null,
    services: (data.services as { name: string }[])?.slice(0, 5) || [],
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300', // Cache 5 minutes
    },
  });
}
