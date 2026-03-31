'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LeadDrawer } from '@/components/lead-drawer';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  status: string;
  source: string;
  service_interest: string;
  created_at: string;
}

const STATUSES = ['all', 'new', 'contacted', 'booked', 'cold', 'lost'];

function exportCSV(leads: Lead[]) {
  if (leads.length === 0) return;
  const headers = ['Name', 'Email', 'Phone', 'Score', 'Status', 'Source', 'Interest', 'Date'];
  const rows = leads.map(l => [
    l.name || '',
    l.email || '',
    l.phone || '',
    String(l.score),
    l.status,
    l.source || '',
    l.service_interest || '',
    new Date(l.created_at).toLocaleDateString('en-GB'),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase.from('businesses').select('id').eq('email', user.email).maybeSingle();
      if (!biz) return;

      const { data } = await supabase.from('leads')
        .select('*')
        .eq('business_id', biz.id)
        .order('created_at', { ascending: false })
        .limit(500);
      setLeads((data as Lead[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let result = leads;
    if (filter !== 'all') result = result.filter(l => l.status === filter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        (l.name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.service_interest || '').toLowerCase().includes(q)
      );
    }
    // Sort
    if (sortBy === 'score') {
      result = [...result].sort((a, b) => b.score - a.score);
    }
    setFiltered(result);
  }, [leads, filter, search, sortBy]);

  async function updateStatus(leadId: string, newStatus: string) {
    await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} total &middot; {leads.filter(l => l.status === 'new').length} new</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'score')}
            className="border rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          >
            <option value="date">Sort by Date</option>
            <option value="score">Sort by Score</option>
          </select>
          <button
            onClick={() => exportCSV(filtered)}
            className="bg-brand-purple text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-purple-dark transition"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition ${
              filter === s ? 'bg-white shadow text-brand-purple' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s} {s === 'all' ? `(${leads.length})` : `(${leads.filter(l => l.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Interest</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(lead => (
              <tr
                key={lead.id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedLeadId(lead.id)}
              >
                <td className="px-4 py-3 font-medium text-brand-purple hover:underline">{lead.name || '\u2014'}</td>
                <td className="px-4 py-3 text-gray-600">{lead.email || '\u2014'}</td>
                <td className="px-4 py-3 text-gray-600">{lead.phone || '\u2014'}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${lead.score >= 70 ? 'text-orange-500' : lead.score >= 40 ? 'text-yellow-500' : 'text-gray-400'}`}>
                    {lead.score}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <select
                    value={lead.status}
                    onChange={e => updateStatus(lead.id, e.target.value)}
                    className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${
                      lead.status === 'booked' ? 'bg-green-100 text-green-700' :
                      lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                      lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' :
                      lead.status === 'lost' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {['new', 'contacted', 'booked', 'cold', 'lost'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500 capitalize">{lead.source || '\u2014'}</td>
                <td className="px-4 py-3 text-gray-500">{lead.service_interest || '\u2014'}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(lead.created_at).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                {search || filter !== 'all' ? 'No leads match your filters.' : 'No leads yet. Install your chat widget to start capturing leads.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Lead detail drawer */}
      {selectedLeadId && (
        <LeadDrawer leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
      )}
    </div>
  );
}
