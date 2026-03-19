import { NextResponse } from 'next/server';

const INDUSTRIES = ['dental practices', 'aesthetic clinics', 'physiotherapy clinics', 'law firms', 'plumbing services'];
const CITIES = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Edinburgh', 'Glasgow', 'Liverpool', 'Sheffield', 'Cardiff'];

export async function GET() {
  const results = [];

  // Run one industry-city combo per cron invocation (rotate weekly)
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const comboIndex = week % (INDUSTRIES.length * CITIES.length);
  const industry = INDUSTRIES[Math.floor(comboIndex / CITIES.length)];
  const city = CITIES[comboIndex % CITIES.length];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry, city, maxResults: 50 }),
    });
    const data = await res.json();
    results.push({ industry, city, ...data });
  } catch (error) {
    results.push({ industry, city, error: String(error) });
  }

  return NextResponse.json({ results });
}
