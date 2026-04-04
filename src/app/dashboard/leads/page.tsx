'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveCurrentBusiness } from '@/lib/current-business';
import { formatCompactNumber } from '@/lib/formatting';
import {
  PortalEmptyState,
  PortalMetricCard,
  PortalMetricGrid,
  PortalPageHeader,
  PortalPanel,
  PortalSegmentedControl,
  PortalStatusPill,
} from '@/components/dashboard/portal-primitives';
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

const STATUSES = ['all', 'new', 'contacted', 'booked', 'cold', 'lost'] as const;

function exportCSV(leads: Lead[]) {
  if (leads.length === 0) return;

  const headers = ['Name', 'Email', 'Phone', 'Score', 'Status', 'Source', 'Interest', 'Date'];
  const rows = leads.map((lead) => [
    lead.name || '',
    lead.email || '',
    lead.phone || '',
    String(lead.score),
    lead.status,
    lead.source || '',
    lead.service_interest || '',
    new Date(lead.created_at).toLocaleDateString('en-GB'),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function statusTone(status: string) {
  if (status === 'booked') return 'success' as const;
  if (status === 'new') return 'brand' as const;
  if (status === 'contacted') return 'warning' as const;
  if (status === 'lost') return 'danger' as const;
  return 'default' as const;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { business } = await resolveCurrentBusiness();
        const orgFilter = `org_id.eq.${business.id},business_id.eq.${business.id}`;
        const { data, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .or(orgFilter)
          .order('created_at', { ascending: false })
          .limit(500);

        if (leadsError) throw leadsError;
        setLeads((data as Lead[]) || []);
        setError(null);
      } catch (loadError) {
        console.error('Failed to load leads:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load leads right now.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    let result = leads;

    if (filter !== 'all') {
      result = result.filter((lead) => lead.status === filter);
    }

    if (search) {
      const query = search.toLowerCase();
      result = result.filter((lead) =>
        [lead.name, lead.email, lead.phone, lead.service_interest, lead.source]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      );
    }

    if (sortBy === 'score') {
      return [...result].sort((a, b) => b.score - a.score);
    }

    return [...result].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filter, leads, search, sortBy]);

  const hotLeads = useMemo(() => leads.filter((lead) => lead.score >= 70 && lead.status !== 'booked'), [leads]);
  const bookedLeads = useMemo(() => leads.filter((lead) => lead.status === 'booked'), [leads]);
  const newLeads = useMemo(() => leads.filter((lead) => lead.status === 'new'), [leads]);

  async function updateStatus(leadId: string, newStatus: string) {
    await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, status: newStatus } : lead)));
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <PortalPageHeader
        eyebrow="Lead pipeline"
        title="Every enquiry, ranked and ready for follow-up."
        description="This is your conversion queue: who is hot, who needs a human touch, and who already booked. Keep it tight and you keep the revenue engine moving."
        meta={
          <>
            <PortalStatusPill tone="brand">{formatCompactNumber(leads.length)} total leads tracked</PortalStatusPill>
            <PortalStatusPill tone={hotLeads.length > 0 ? 'warning' : 'success'}>
              {hotLeads.length > 0 ? `${hotLeads.length} hot leads need attention` : 'No urgent lead backlog'}
            </PortalStatusPill>
          </>
        }
        actions={
          <>
            <label className="flex min-w-[220px] items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm text-[var(--app-text-muted)]">
              <SearchIcon className="h-4 w-4" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, source, phone..."
                className="w-full bg-transparent text-[var(--app-text)] outline-none placeholder:text-[var(--app-text-soft)]"
              />
            </label>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as 'date' | 'score')}
              className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm text-[var(--app-text)] outline-none"
            >
              <option value="date">Newest first</option>
              <option value="score">Highest score</option>
            </select>
            <button
              onClick={() => exportCSV(filtered)}
              className="rounded-full bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-purple-dark"
            >
              Export pipeline
            </button>
          </>
        }
      />

      <PortalMetricGrid>
        <PortalMetricCard
          label="New this cycle"
          value={newLeads.length}
          description="Fresh leads that have not been actively worked yet."
          icon={<SparkIcon className="h-5 w-5" />}
        />
        <PortalMetricCard
          label="Hot leads"
          value={hotLeads.length}
          description="High-intent leads that deserve same-day attention."
          tone={hotLeads.length > 0 ? 'warning' : 'default'}
          icon={<FlameIcon className="h-5 w-5" />}
        />
        <PortalMetricCard
          label="Booked"
          value={bookedLeads.length}
          description="Leads already converted into appointments."
          tone="success"
          icon={<CalendarIcon className="h-5 w-5" />}
        />
        <PortalMetricCard
          label="Search results"
          value={filtered.length}
          description={search || filter !== 'all' ? 'Current filtered view of the pipeline.' : 'Visible rows in your live pipeline.'}
          icon={<StackIcon className="h-5 w-5" />}
        />
      </PortalMetricGrid>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PortalSegmentedControl
          value={filter}
          onChange={setFilter}
          options={STATUSES.map((status) => ({
            value: status,
            label: status === 'all' ? 'All leads' : status,
            count: status === 'all' ? leads.length : leads.filter((lead) => lead.status === status).length,
          }))}
        />
        <div className="text-sm text-[var(--app-text-muted)]">
          Tip: click any row to open the full lead timeline, conversations, and manual follow-up tools.
        </div>
      </div>

      {error ? (
        <PortalPanel title="Lead pipeline unavailable" description="The live lead feed could not be loaded.">
          <PortalEmptyState
            title="We couldn't load the lead queue."
            description={error}
            action={
              <button
                onClick={() => window.location.reload()}
                className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple-dark"
              >
                Try again
              </button>
            }
          />
        </PortalPanel>
      ) : (
        <PortalPanel
          title="Live lead queue"
          description="This table is optimized for speed: score, status, source, and the service the patient asked about."
          action={
            hotLeads.length > 0 ? (
              <PortalStatusPill tone="warning">{hotLeads.length} waiting for a human follow-up</PortalStatusPill>
            ) : (
              <PortalStatusPill tone="success">Automation is keeping up</PortalStatusPill>
            )
          }
        >
          {filtered.length === 0 ? (
            <PortalEmptyState
              title={search || filter !== 'all' ? 'No leads match this view.' : 'No leads have been captured yet.'}
              description={
                search || filter !== 'all'
                  ? 'Try widening the filters or clearing the search to see the full queue again.'
                  : 'Once your widget and follow-up pack are live, captured enquiries will appear here with scores, statuses, and service intent.'
              }
              action={
                search || filter !== 'all' ? (
                  <button
                    onClick={() => {
                      setSearch('');
                      setFilter('all');
                    }}
                    className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-muted)]"
                  >
                    Reset filters
                  </button>
                ) : (
                  <Link
                    href="/dashboard/templates"
                    className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple-dark"
                  >
                    Finish launch checklist
                  </Link>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--app-muted)] text-left text-[var(--app-text-soft)]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Lead</th>
                    <th className="px-5 py-4 font-semibold">Intent</th>
                    <th className="px-5 py-4 font-semibold">Source</th>
                    <th className="px-5 py-4 font-semibold">Score</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Captured</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className="cursor-pointer border-t border-[var(--app-border)] transition hover:bg-[var(--app-muted)]/70"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-[var(--app-text)]">{lead.name || 'Anonymous lead'}</p>
                          <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                            {lead.email || 'No email captured'} {lead.phone ? `· ${lead.phone}` : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[var(--app-text-muted)]">{lead.service_interest || 'General enquiry'}</td>
                      <td className="px-5 py-4">
                        <PortalStatusPill>{lead.source || 'widget'}</PortalStatusPill>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            lead.score >= 70
                              ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
                              : lead.score >= 40
                                ? 'bg-sky-500/12 text-sky-700 dark:text-sky-300'
                                : 'bg-[var(--app-muted)] text-[var(--app-text-muted)]'
                          }`}
                        >
                          {lead.score}
                        </span>
                      </td>
                      <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={(event) => updateStatus(lead.id, event.target.value)}
                          aria-label={`Update status for ${lead.name || 'lead'}`}
                          className={`rounded-full border-0 px-3 py-2 text-xs font-semibold outline-none ${selectToneClass(lead.status)}`}
                        >
                          {STATUSES.filter((status) => status !== 'all').map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-[var(--app-text-muted)]">
                        {new Date(lead.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PortalPanel>
      )}

      {selectedLeadId ? <LeadDrawer leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} /> : null}
    </div>
  );
}

function selectToneClass(status: string) {
  if (status === 'booked') return 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300';
  if (status === 'new') return 'bg-brand-purple/12 text-brand-purple';
  if (status === 'contacted') return 'bg-amber-500/12 text-amber-700 dark:text-amber-300';
  if (status === 'lost') return 'bg-rose-500/12 text-rose-700 dark:text-rose-300';
  return 'bg-[var(--app-muted)] text-[var(--app-text-muted)]';
}

function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35m1.85-4.4a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z" /></svg>;
}

function SparkIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
}

function FlameIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3c1.2 3.4 4 4.8 4 8 0 2.5-1.3 4.1-3.1 5.4.1-1.3-.4-2.3-1.6-3.2-1.5 1.1-2.3 2.5-2.3 4.5-2.1-1.1-4-3.3-4-6.2 0-3.8 2.6-6.6 7-8.5z" /></svg>;
}

function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}

function StackIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4l8 4-8 4-8-4 8-4zm8 8-8 4-8-4m16 4-8 4-8-4" /></svg>;
}
