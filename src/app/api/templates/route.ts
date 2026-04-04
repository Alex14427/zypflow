import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Public endpoint — returns workflow templates, optionally filtered by industry
export async function GET(req: NextRequest) {
  const industry = req.nextUrl.searchParams.get('industry');

  let query = supabaseAdmin
    .from('workflow_templates')
    .select('id, name, industry, description, trigger_type, featured, setup_minutes, icon, minutes_saved_per_run')
    .order('featured', { ascending: false })
    .order('setup_minutes', { ascending: true });

  if (industry && industry !== 'all') {
    // Show templates for this industry + universal templates
    query = query.or(`industry.eq.${industry},industry.eq.general`);
  }

  const { data: templates } = await query;

  return NextResponse.json({ templates: templates || [] });
}
