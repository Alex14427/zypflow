'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveCurrentBusiness } from '@/lib/current-business';

interface Prospect {
  id: string;
  business_name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  google_rating: number | null;
  review_count: number | null;
  city: string | null;
  scraped_at: string;
  audited: boolean | null;
}

const INDUSTRIES = [
  { value: 'dental', label: 'Dental' },
  { value: 'aesthetics', label: 'Aesthetics' },
  { value: 'legal', label: 'Legal' },
  { value: 'home_services', label: 'Home Services' },
  { value: 'physiotherapy', label: 'Physiotherapy' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'barber', label: 'Barber' },
  { value: 'other', label: 'Other' },
];

const PAGE_SIZE = 25;

// --- Icons ---
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

export default function ScraperPage() {
  // Org state
  const [orgId, setOrgId] = useState<string | null>(null);
  const [scrapingCredits, setScrapingCredits] = useState<number | null>(null);

  // Form state
  const [industry, setIndustry] = useState('dental');
  const [city, setCity] = useState('');
  const [maxResults, setMaxResults] = useState(50);

  // Scrape run state
  const [scraping, setScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState('');
  const [scrapeError, setScrapeError] = useState('');
  const [scrapeSuccess, setScrapeSuccess] = useState<number | null>(null);

  // Prospects state
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [prospectsLoading, setProspectsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Audit state — track which prospect IDs are currently being audited
  const [auditingIds, setAuditingIds] = useState<Set<string>>(new Set());
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

  // Load org on mount
  useEffect(() => {
    async function loadOrg() {
      try {
        const { business } = await resolveCurrentBusiness();
        setOrgId(business.id);
        // scraping_credits is on the businesses table but not in CurrentBusiness type,
        // so fetch it separately
        const { data: biz } = await supabase
          .from('businesses')
          .select('scraping_credits')
          .eq('id', business.id)
          .single();
        if (biz) setScrapingCredits((biz as { scraping_credits: number | null }).scraping_credits ?? null);
      } catch {
        // not authenticated
      }
    }
    loadOrg();
  }, []);

  // Load prospects when orgId is available
  useEffect(() => {
    if (!orgId) return;
    loadProspects(orgId);
  }, [orgId]);

  async function loadProspects(id: string) {
    setProspectsLoading(true);
    const { data } = await supabase
      .from('prospects')
      .select('id, business_name, website, phone, email, google_rating, review_count, city, scraped_at, audited')
      .eq('org_id', id)
      .order('scraped_at', { ascending: false })
      .limit(1000);
    setProspects((data as Prospect[]) || []);
    setProspectsLoading(false);
  }

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setScraping(true);
    setScrapeError('');
    setScrapeSuccess(null);
    setScrapeMessage('Connecting to scraper...');

    try {
      setScrapeMessage('Searching Google Maps for businesses...');
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, city, maxResults, orgId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const count: number = data.count ?? data.results ?? 0;
      setScrapeSuccess(count);
      setScrapeMessage('');

      // Refresh credits and prospects
      if (typeof data.creditsRemaining === 'number') {
        setScrapingCredits(data.creditsRemaining);
      } else {
        const { data: biz } = await supabase
          .from('businesses')
          .select('scraping_credits')
          .eq('id', orgId)
          .maybeSingle();
        if (biz) setScrapingCredits((biz as { scraping_credits: number | null }).scraping_credits ?? null);
      }
      loadProspects(orgId);
    } catch (err: unknown) {
      setScrapeError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setScrapeMessage('');
    } finally {
      setScraping(false);
    }
  }

  async function handleAudit(prospect: Prospect) {
    if (!prospect.website) return;
    setAuditingIds(prev => new Set(prev).add(prospect.id));
    try {
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: prospect.website }),
      });
      // Mark audited in local state
      setProspects(prev => prev.map(p => p.id === prospect.id ? { ...p, audited: true } : p));
    } finally {
      setAuditingIds(prev => { const s = new Set(prev); s.delete(prospect.id); return s; });
    }
  }

  async function handleAddToPipeline(prospect: Prospect) {
    if (!orgId) return;
    setAddingIds(prev => new Set(prev).add(prospect.id));
    try {
      await supabase.from('leads').insert({
        org_id: orgId,
        name: prospect.business_name,
        email: prospect.email ?? null,
        phone: prospect.phone ?? null,
        source: 'scraper',
        status: 'new',
        score: 0,
      });
    } finally {
      setAddingIds(prev => { const s = new Set(prev); s.delete(prospect.id); return s; });
    }
  }

  // Filtered + paginated prospects
  const filtered = prospects.filter(p =>
    !search || p.business_name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const scrapedThisMonth = prospects.filter(p => p.scraped_at >= thisMonthStart).length;
  const auditedCount = prospects.filter(p => p.audited).length;
  const ratingsWithValue = prospects.filter(p => p.google_rating !== null && p.google_rating !== undefined);
  const avgRating = ratingsWithValue.length
    ? (ratingsWithValue.reduce((sum, p) => sum + (p.google_rating ?? 0), 0) / ratingsWithValue.length).toFixed(1)
    : '—';

  const lowCredits = scrapingCredits !== null && scrapingCredits < 10;

  return (
    <div>
      {/* Page header + credits */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Lead Scraper</h1>
          <p className="text-sm text-gray-500 mt-0.5">Find potential clients from Google Maps</p>
        </div>

        {/* Credits badge */}
        {scrapingCredits !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${
            lowCredits
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-purple-50 border-purple-200 text-purple-700'
          }`}>
            <ZapIcon className="w-4 h-4" />
            Scraping Credits: {scrapingCredits} remaining
            {lowCredits && <span className="ml-1 text-xs font-normal">(low!)</span>}
          </div>
        )}
      </div>

      {/* Configuration form */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold mb-4">Configure Scrape</h2>
        <form onSubmit={handleScrape} className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <label className="text-xs font-medium text-gray-600">Industry</label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              disabled={scraping}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple disabled:opacity-50"
            >
              {INDUSTRIES.map(ind => (
                <option key={ind.value} value={ind.value}>{ind.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-gray-600">City / Location</label>
            <input
              type="text"
              placeholder="e.g. London, Manchester"
              value={city}
              onChange={e => setCity(e.target.value)}
              disabled={scraping}
              required
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-32">
            <label className="text-xs font-medium text-gray-600">Max Results</label>
            <input
              type="number"
              min={1}
              max={200}
              value={maxResults}
              onChange={e => setMaxResults(Math.min(200, Math.max(1, Number(e.target.value))))}
              disabled={scraping}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={scraping || !city.trim()}
            className="flex items-center gap-2 bg-brand-purple text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-purple/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scraping ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Scraping...
              </>
            ) : (
              <>
                <SearchIcon className="w-4 h-4" />
                Start Scraping
              </>
            )}
          </button>
        </form>

        {/* Status messages */}
        {scraping && scrapeMessage && (
          <div className="mt-4 flex items-center gap-2 text-sm text-brand-purple">
            <span className="animate-spin w-4 h-4 border-2 border-brand-purple border-t-transparent rounded-full" />
            {scrapeMessage}
          </div>
        )}
        {scrapeSuccess !== null && !scraping && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Successfully scraped <strong>{scrapeSuccess}</strong> business{scrapeSuccess !== 1 ? 'es' : ''}. Results shown below.
          </div>
        )}
        {scrapeError && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {scrapeError}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Prospects', value: prospects.length },
          { label: 'Scraped This Month', value: scrapedThisMonth },
          { label: 'Audited', value: auditedCount },
          { label: 'Avg Google Rating', value: avgRating },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border shadow-sm px-5 py-4">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{prospectsLoading ? '—' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Results table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Table toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b">
          <h2 className="text-base font-semibold">Prospects</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by business name..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="border rounded-lg pl-9 pr-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <button
              className="flex items-center gap-1.5 border rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
              title="Export CSV (placeholder)"
            >
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Website</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Reviews</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Scraped</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prospectsLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <span className="animate-spin w-5 h-5 border-2 border-brand-purple border-t-transparent rounded-full" />
                      Loading prospects...
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    {search
                      ? 'No prospects match your search.'
                      : 'No prospects yet. Run a scrape above to find potential clients.'}
                  </td>
                </tr>
              ) : (
                paginated.map(prospect => (
                  <tr key={prospect.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">
                      {prospect.business_name || '—'}
                      {prospect.audited && (
                        <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 rounded-full px-1.5 py-0.5 font-semibold">Audited</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">
                      {prospect.website ? (
                        <a
                          href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-purple hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          {prospect.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{prospect.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{prospect.email || '—'}</td>
                    <td className="px-4 py-3">
                      {prospect.google_rating !== null && prospect.google_rating !== undefined ? (
                        <span className={`font-semibold ${
                          prospect.google_rating >= 4.5 ? 'text-green-600' :
                          prospect.google_rating >= 4.0 ? 'text-yellow-600' :
                          'text-red-500'
                        }`}>
                          {prospect.google_rating.toFixed(1)} ★
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{prospect.review_count ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{prospect.city || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(prospect.scraped_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAudit(prospect)}
                          disabled={!prospect.website || auditingIds.has(prospect.id)}
                          title={prospect.website ? 'Run AI audit on this website' : 'No website available'}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {auditingIds.has(prospect.id) ? (
                            <span className="animate-spin w-3 h-3 border border-purple-700 border-t-transparent rounded-full" />
                          ) : (
                            <ZapIcon className="w-3 h-3" />
                          )}
                          Audit
                        </button>
                        <button
                          onClick={() => handleAddToPipeline(prospect)}
                          disabled={addingIds.has(prospect.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {addingIds.has(prospect.id) ? (
                            <span className="animate-spin w-3 h-3 border border-gray-600 border-t-transparent rounded-full" />
                          ) : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                          Add to Pipeline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!prospectsLoading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50 text-sm text-gray-500">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = totalPages <= 5
                  ? i + 1
                  : page <= 3
                    ? i + 1
                    : page >= totalPages - 2
                      ? totalPages - 4 + i
                      : page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg border text-xs font-medium transition ${
                      page === pageNum
                        ? 'bg-brand-purple text-white border-brand-purple'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
