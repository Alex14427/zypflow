'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface Lead {
  id: string;
  business_name: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  lead_score: number;
  source: string | null;
  status: string;
  org_id: string;
  created_at: string;
  updated_at: string | null;
  audit_id: string | null;
}

interface OutreachSummary {
  lead_id: string;
  sent_count: number;
  reply_count: number;
  last_sent_at: string | null;
}

type Priority = 'hot' | 'warm' | 'cold';

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  proposal: 'bg-indigo-100 text-indigo-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

function getPriority(score: number): Priority {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

const PRIORITY_CONFIG: Record<Priority, { border: string; badge: string; label: string; section: string }> = {
  hot: {
    border: 'border-l-4 border-l-red-500',
    badge: 'bg-red-100 text-red-700 font-bold',
    label: 'Call NOW',
    section: 'text-red-600',
  },
  warm: {
    border: 'border-l-4 border-l-amber-400',
    badge: 'bg-amber-100 text-amber-700 font-semibold',
    label: 'Call today',
    section: 'text-amber-600',
  },
  cold: {
    border: 'border-l-4 border-l-gray-300',
    badge: 'bg-gray-100 text-gray-500',
    label: 'Nurture',
    section: 'text-gray-500',
  },
};

const SCORE_COLOR = (score: number) => {
  if (score >= 70) return 'bg-red-100 text-red-700';
  if (score >= 40) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-500';
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function displayName(lead: Lead): string {
  return lead.business_name || lead.name || lead.email || 'Unknown';
}

function normaliseWebsite(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith('http') ? url : `https://${url}`;
}

export default function CallPriorityPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [outreach, setOutreach] = useState<Record<string, OutreachSummary>>({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [hotOnly, setHotOnly] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: org } = await supabase
        .from('organisations')
        .select('id')
        .eq('email', user.email)
        .single();
      if (!org) return;

      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('org_id', org.id)
        .order('lead_score', { ascending: false })
        .limit(500);

      const leads = (leadsData as Lead[]) || [];
      setLeads(leads);

      // Fetch outreach data for these leads
      if (leads.length > 0) {
        const leadIds = leads.map(l => l.id);
        const { data: outreachData } = await supabase
          .from('outreach')
          .select('lead_id, sent_at, replied_at')
          .in('lead_id', leadIds);

        if (outreachData) {
          const summaryMap: Record<string, OutreachSummary> = {};
          for (const row of outreachData as Array<{ lead_id: string; sent_at: string | null; replied_at: string | null }>) {
            if (!summaryMap[row.lead_id]) {
              summaryMap[row.lead_id] = { lead_id: row.lead_id, sent_count: 0, reply_count: 0, last_sent_at: null };
            }
            summaryMap[row.lead_id].sent_count += 1;
            if (row.replied_at) summaryMap[row.lead_id].reply_count += 1;
            if (row.sent_at && (!summaryMap[row.lead_id].last_sent_at || row.sent_at > summaryMap[row.lead_id].last_sent_at!)) {
              summaryMap[row.lead_id].last_sent_at = row.sent_at;
            }
          }
          setOutreach(summaryMap);
        }
      }

      setLoading(false);
    }
    load();
  }, []);

  async function updateStatus(leadId: string, newStatus: string) {
    setUpdatingId(leadId);
    await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    setLeads((prev: Lead[]) => prev.map((l: Lead) => l.id === leadId ? { ...l, status: newStatus } : l));
    setUpdatingId(null);
  }

  async function markContacted(leadId: string) {
    await updateStatus(leadId, 'contacted');
  }

  // Stats
  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter((l: Lead) => l.lead_score >= 70).length;
    const contactedToday = leads.filter((l: Lead) => {
      const updated = l.updated_at || l.created_at;
      return l.status === 'contacted' && updated.slice(0, 10) === today;
    }).length;
    const outreachValues: OutreachSummary[] = Object.values(outreach);
    const totalSent = outreachValues.reduce((sum: number, o: OutreachSummary) => sum + o.sent_count, 0);
    const totalReplies = outreachValues.reduce((sum: number, o: OutreachSummary) => sum + o.reply_count, 0);
    const replyRate = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0;
    return { total, hot, contactedToday, replyRate };
  }, [leads, outreach, today]);

  // Unique sources for filter
  const sources = useMemo(() => {
    const s = new Set(leads.map((l: Lead) => l.source).filter(Boolean));
    return Array.from(s) as string[];
  }, [leads]);

  // Filtered leads
  const filtered = useMemo(() => {
    let result: Lead[] = leads;
    if (hotOnly) result = result.filter((l: Lead) => l.lead_score >= 70);
    if (filterStatus !== 'all') result = result.filter((l: Lead) => l.status === filterStatus);
    if (filterSource !== 'all') result = result.filter((l: Lead) => l.source === filterSource);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l: Lead) =>
        (l.business_name || '').toLowerCase().includes(q) ||
        (l.name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q)
      );
    }
    return result;
  }, [leads, hotOnly, filterStatus, filterSource, search]);

  const hotLeads = filtered.filter((l: Lead) => l.lead_score >= 70);
  const warmLeads = filtered.filter((l: Lead) => l.lead_score >= 40 && l.lead_score < 70);
  const coldLeads = filtered.filter((l: Lead) => l.lead_score < 40);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Call Priority</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Leads ranked by score and engagement — call the hottest ones first
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Leads</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-red-500 uppercase tracking-wide font-medium">Hot Leads</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{stats.hot}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Contacted Today</p>
          <p className="text-2xl font-bold mt-1">{stats.contactedToday}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Reply Rate</p>
          <p className="text-2xl font-bold mt-1">{stats.replyRate}%</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-brand-purple"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
        >
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select
          value={filterSource}
          onChange={e => setFilterSource(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
        >
          <option value="all">All sources</option>
          {sources.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setHotOnly(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${hotOnly ? 'bg-red-500' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hotOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-gray-600 font-medium">Hot leads only</span>
        </label>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center text-gray-400">
          No leads match your filters.
        </div>
      )}

      {/* Priority sections */}
      {([['hot', hotLeads], ['warm', warmLeads], ['cold', coldLeads]] as [Priority, Lead[]][]).map(([tier, tierLeads]) => {
        if (tierLeads.length === 0) return null;
        const cfg = PRIORITY_CONFIG[tier];
        return (
          <div key={tier} className="mb-8">
            <h2 className={`text-sm font-bold uppercase tracking-widest mb-3 ${cfg.section}`}>
              {tier === 'hot' ? '🔥 Hot' : tier === 'warm' ? 'Warm' : 'Cold'} &mdash; {tierLeads.length} lead{tierLeads.length !== 1 ? 's' : ''}
            </h2>

            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl border shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Business</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Last Contact</th>
                    <th className="px-4 py-3 font-medium">Outreach</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tierLeads.map(lead => {
                    const o = outreach[lead.id];
                    const website = normaliseWebsite(lead.website);
                    return (
                      <tr key={lead.id} className={`border-t hover:bg-gray-50 ${cfg.border.split(' ').slice(2).join(' ')}`}
                        style={{ borderLeftWidth: '4px', borderLeftColor: tier === 'hot' ? '#ef4444' : tier === 'warm' ? '#fbbf24' : '#d1d5db' }}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{displayName(lead)}</div>
                          {lead.email && <div className="text-xs text-gray-400">{lead.email}</div>}
                          {website && (
                            <a href={website} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-brand-purple hover:underline truncate block max-w-[160px]">
                              {lead.website}
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lead.phone
                            ? <a href={`tel:${lead.phone}`} className="text-brand-purple hover:underline font-medium">{lead.phone}</a>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${SCORE_COLOR(lead.lead_score)}`}>
                            {lead.lead_score}
                          </span>
                          <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize text-gray-500 text-xs">
                          {lead.source ? lead.source.replace(/_/g, ' ') : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {formatDate(lead.updated_at || lead.created_at)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {o ? (
                            <div>
                              <span>{o.sent_count} sent</span>
                              {o.reply_count > 0 && (
                                <span className="ml-1 text-green-600 font-semibold">&middot; {o.reply_count} repl{o.reply_count === 1 ? 'y' : 'ies'}</span>
                              )}
                              {o.last_sent_at && <div className="text-gray-400">{formatDate(o.last_sent_at)}</div>}
                            </div>
                          ) : <span className="text-gray-300">None</span>}
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <select
                            value={lead.status}
                            disabled={updatingId === lead.id}
                            onChange={e => updateStatus(lead.id, e.target.value)}
                            className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-1 focus:ring-brand-purple ${STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {lead.phone && (
                              <a href={`tel:${lead.phone}`}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded-lg font-medium hover:bg-green-700 transition whitespace-nowrap">
                                Call
                              </a>
                            )}
                            {lead.email && (
                              <a href={`mailto:${lead.email}`}
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded-lg font-medium hover:bg-blue-700 transition whitespace-nowrap">
                                Email
                              </a>
                            )}
                            {lead.status !== 'contacted' && (
                              <button
                                onClick={() => markContacted(lead.id)}
                                disabled={updatingId === lead.id}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium hover:bg-gray-200 transition whitespace-nowrap disabled:opacity-50">
                                Mark Contacted
                              </button>
                            )}
                            {lead.source === 'website_audit' && lead.audit_id && (
                              <a href={`/audit/${lead.audit_id}`}
                                className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg font-medium hover:bg-purple-200 transition whitespace-nowrap">
                                View Audit
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {tierLeads.map(lead => {
                const o = outreach[lead.id];
                const website = normaliseWebsite(lead.website);
                return (
                  <div key={lead.id}
                    className="bg-white rounded-xl border shadow-sm p-4"
                    style={{ borderLeftWidth: '4px', borderLeftColor: tier === 'hot' ? '#ef4444' : tier === 'warm' ? '#fbbf24' : '#d1d5db' }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{displayName(lead)}</div>
                        {lead.email && <div className="text-xs text-gray-400 truncate">{lead.email}</div>}
                        {website && (
                          <a href={website} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-brand-purple hover:underline truncate block">
                            {lead.website}
                          </a>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${SCORE_COLOR(lead.lead_score)}`}>
                          {lead.lead_score}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                      <div>
                        <span className="font-medium text-gray-700">Phone: </span>
                        {lead.phone
                          ? <a href={`tel:${lead.phone}`} className="text-brand-purple hover:underline">{lead.phone}</a>
                          : '—'}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Source: </span>
                        <span className="capitalize">{lead.source ? lead.source.replace(/_/g, ' ') : '—'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Last contact: </span>
                        {formatDate(lead.updated_at || lead.created_at)}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Outreach: </span>
                        {o ? `${o.sent_count} sent${o.reply_count > 0 ? `, ${o.reply_count} repl${o.reply_count === 1 ? 'y' : 'ies'}` : ''}` : 'None'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={lead.status}
                        disabled={updatingId === lead.id}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>

                      {lead.phone && (
                        <a href={`tel:${lead.phone}`}
                          className="px-2.5 py-1 bg-green-600 text-white text-xs rounded-lg font-medium hover:bg-green-700 transition">
                          Call
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`}
                          className="px-2.5 py-1 bg-blue-600 text-white text-xs rounded-lg font-medium hover:bg-blue-700 transition">
                          Email
                        </a>
                      )}
                      {lead.status !== 'contacted' && (
                        <button
                          onClick={() => markContacted(lead.id)}
                          disabled={updatingId === lead.id}
                          className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50">
                          Mark Contacted
                        </button>
                      )}
                      {lead.source === 'website_audit' && lead.audit_id && (
                        <a href={`/audit/${lead.audit_id}`}
                          className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg font-medium hover:bg-purple-200 transition">
                          View Audit
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
