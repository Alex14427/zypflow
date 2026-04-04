import { NextRequest, NextResponse } from 'next/server';
import { verifyAutomationAuth } from '@/lib/auth-automation';

const TARGET_SEARCHES = [
  { industry: 'aesthetic clinics', city: 'London' },
  { industry: 'skin clinics', city: 'London' },
  { industry: 'cosmetic clinics', city: 'London' },
  { industry: 'medical aesthetics clinics', city: 'London' },
  { industry: 'private dental clinics', city: 'London' },
];

export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com';
  const results = [];
  const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const target = TARGET_SEARCHES[day % TARGET_SEARCHES.length];

  try {
    const res = await fetch(`${appUrl}/api/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET || ''}`,
      },
      body: JSON.stringify({ industry: target.industry, city: target.city, maxResults: 50 }),
    });

    const data = await res.json();
    results.push({ ...target, ...data });
  } catch (error) {
    results.push({ ...target, error: String(error) });
  }

  return NextResponse.json({ results });
}
