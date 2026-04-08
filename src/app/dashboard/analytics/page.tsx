'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveCurrentBusiness } from '@/lib/current-business';
import { formatCompactNumber, formatCurrencyGBP } from '@/lib/formatting';
import {
  PortalEmptyState,
  PortalMetricCard,
  PortalMetricGrid,
  PortalPageHeader,
  PortalPanel,
  PortalSegmentedControl,
  PortalStatusPill,
} from '@/components/dashboard/portal-primitives';

interface DailyData {
  date: string;
  leads: number;
  bookings: number;
  conversations: number;
}

type DateRange = '7d' | '30d' | '90d';

export default function AnalyticsPage() {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [totals, setTotals] = useState({
    leads: 0,
    bookings: 0,
    conversations: 0,
    reviews: 0,
    followUpsSent: 0,
  });
  const [sourceBreakdown, setSourceBreakdown] = useState<{ source: string; count: number }[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ status: string; count: number }[]>([]);
  const [roiMetrics, setRoiMetrics] = useState({
    estimatedRevenue: 0,
    costPerLead: 0,
    avgLeadValue: 0,
    chatToLeadRate: 0,
    leadToBookRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { business } = await resolveCurrentBusiness();
        const orgFilter = `org_id.eq.${business.id},business_id.eq.${business.id}`;

        const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceStr = since.toISOString();

        const [leadsRes, appointmentsRes, conversationsRes, reviewsRes, allLeadsRes, followUpsRes, bookedLeadsRes] =
          await Promise.all([
            supabase.from('leads').select('id, created_at, source, status, score, service_interest').or(orgFilter).gte('created_at', sinceStr),
            supabase.from('appointments').select('id, datetime, service, status').or(orgFilter).gte('datetime', sinceStr),
            supabase.from('conversations').select('id, created_at, messages').or(orgFilter).gte('created_at', sinceStr),
            supabase.from('reviews').select('id, rating', { count: 'exact' }).or(orgFilter),
            supabase.from('leads').select('id, source, status, score').or(orgFilter),
            supabase.from('follow_ups').select('id', { count: 'exact' }).or(orgFilter),
            supabase.from('leads').select('id').or(orgFilter).eq('status', 'booked'),
          ]);

        const leads = leadsRes.data || [];
        const appointments = appointmentsRes.data || [];
        const conversations = conversationsRes.data || [];
        const allLeads = allLeadsRes.data || [];
        const bookedLeads = bookedLeadsRes.data || [];

        setTotals({
          leads: allLeads.length,
          bookings: appointments.length,
          conversations: conversations.length,
          reviews: reviewsRes.count || 0,
          followUpsSent: followUpsRes.count || 0,
        });

        const planCosts: Record<string, number> = {
          trial: 995,
          starter: 995,
          growth: 1250,
          enterprise: 1500,
        };
        const monthlyCost = planCosts[business.plan] || 995;
        // Use average service price from business services, fallback to £150
        const services = (business.services || []) as { price?: number }[];
        const avgServiceValue = services.length
          ? Math.round(services.reduce((sum, s) => sum + (s.price || 0), 0) / services.length) || 150
          : 150;
        const bookedCount = bookedLeads.length;
        const estimatedRevenue = bookedCount * avgServiceValue;
        const costPerLead = allLeads.length > 0 ? Math.round(monthlyCost / allLeads.length) : 0;
        const chatToLeadRate = conversations.length > 0 ? Math.round((leads.length / conversations.length) * 100) : 0;
        const leadToBookRate = allLeads.length > 0 ? Math.round((bookedCount / allLeads.length) * 100) : 0;

        setRoiMetrics({
          estimatedRevenue,
          costPerLead,
          avgLeadValue: bookedCount > 0 ? Math.round(estimatedRevenue / bookedCount) : avgServiceValue,
          chatToLeadRate,
          leadToBookRate,
        });

        const dayMap: Record<string, DailyData> = {};
        for (let index = days - 1; index >= 0; index -= 1) {
          const date = new Date();
          date.setDate(date.getDate() - index);
          const key = date.toISOString().split('T')[0];
          dayMap[key] = { date: key, leads: 0, bookings: 0, conversations: 0 };
        }

        leads.forEach((lead) => {
          const key = new Date(lead.created_at).toISOString().split('T')[0];
          if (dayMap[key]) dayMap[key].leads += 1;
        });
        appointments.forEach((appointment) => {
          const key = new Date(appointment.datetime).toISOString().split('T')[0];
          if (dayMap[key]) dayMap[key].bookings += 1;
        });
        conversations.forEach((conversation) => {
          const key = new Date(conversation.created_at).toISOString().split('T')[0];
          if (dayMap[key]) dayMap[key].conversations += 1;
        });

        const sources: Record<string, number> = {};
        allLeads.forEach((lead) => {
          const source = (lead as { source?: string }).source || 'unknown';
          sources[source] = (sources[source] || 0) + 1;
        });

        const statuses: Record<string, number> = {};
        allLeads.forEach((lead) => {
          const status = (lead as { status?: string }).status || 'unknown';
          statuses[status] = (statuses[status] || 0) + 1;
        });

        setDailyData(Object.values(dayMap));
        setSourceBreakdown(
          Object.entries(sources)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
        );
        setStatusBreakdown(
          Object.entries(statuses)
            .map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count)
        );
        setError(null);
      } catch (loadError) {
        console.error('Failed to load analytics:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load analytics.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [dateRange]);

  const maxLeads = useMemo(() => Math.max(...dailyData.map((day) => day.leads), 1), [dailyData]);
  const bookedCount = useMemo(
    () => statusBreakdown.find((entry) => entry.status === 'booked')?.count || 0,
    [statusBreakdown]
  );

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
        eyebrow="Analytics"
        title="Proof that the automation is producing commercial outcomes."
        description="This page should reassure a buyer quickly: how many leads were captured, how efficiently they converted, what the system recovered, and where the next improvement lives."
        meta={
          <>
            <PortalStatusPill tone="brand">{formatCompactNumber(totals.leads)} leads tracked</PortalStatusPill>
            <PortalStatusPill tone={roiMetrics.leadToBookRate >= 25 ? 'success' : 'warning'}>
              {roiMetrics.leadToBookRate}% lead-to-book rate
            </PortalStatusPill>
          </>
        }
        actions={
          <PortalSegmentedControl
            value={dateRange}
            onChange={setDateRange}
            options={[
              { value: '7d', label: '7 days' },
              { value: '30d', label: '30 days' },
              { value: '90d', label: '90 days' },
            ]}
          />
        }
      />

      {error ? (
        <PortalPanel title="Analytics unavailable" description="The reporting layer could not load the latest activity.">
          <PortalEmptyState title="We couldn't calculate analytics right now." description={error} />
        </PortalPanel>
      ) : (
        <>
          <PortalMetricGrid>
            <PortalMetricCard
              label="Estimated revenue"
              value={formatCurrencyGBP(roiMetrics.estimatedRevenue)}
              description="A conservative model based on booked appointments and average service value."
              tone="brand"
              icon={<CashIcon className="h-5 w-5" />}
            />
            <PortalMetricCard
              label="Cost per lead"
              value={formatCurrencyGBP(roiMetrics.costPerLead)}
              description="Monthly platform cost spread across total tracked leads."
              icon={<TargetIcon className="h-5 w-5" />}
            />
            <PortalMetricCard
              label="Chat to lead"
              value={`${roiMetrics.chatToLeadRate}%`}
              description="How often the conversation layer turns sessions into captured leads."
              icon={<ChatIcon className="h-5 w-5" />}
            />
            <PortalMetricCard
              label="Lead to booking"
              value={`${roiMetrics.leadToBookRate}%`}
              description="A useful health indicator for whether follow-up is converting intent."
              tone={roiMetrics.leadToBookRate >= 25 ? 'success' : 'default'}
              icon={<FunnelIcon className="h-5 w-5" />}
            />
          </PortalMetricGrid>

          <div className="mb-6 grid gap-4 xl:grid-cols-5">
            <MiniMetric label="Total leads" value={totals.leads} />
            <MiniMetric label="Bookings" value={totals.bookings} tone="success" />
            <MiniMetric label="Conversations" value={totals.conversations} tone="brand" />
            <MiniMetric label="Follow-ups sent" value={totals.followUpsSent} tone="warning" />
            <MiniMetric label="Reviews" value={totals.reviews} tone="default" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <PortalPanel
              title={`Lead volume over the last ${dateRange === '7d' ? '7' : dateRange === '90d' ? '90' : '30'} days`}
              description="A quick visual read of lead capture and booking flow over time."
            >
              {dailyData.length === 0 ? (
                <PortalEmptyState
                  title="No trend data yet."
                  description="Once traffic and follow-up are live, this chart becomes one of the fastest ways to prove momentum to a clinic owner."
                />
              ) : (
                <div className="px-5 py-6">
                  <div className="flex h-56 items-end gap-2">
                    {dailyData.map((day) => (
                      <div key={day.date} className="group flex flex-1 flex-col items-center">
                        <div className="mb-2 rounded-full bg-[var(--app-surface-strong)] px-2 py-1 text-[10px] font-medium text-[var(--app-text-soft)] opacity-0 shadow-sm transition group-hover:opacity-100">
                          {day.leads} leads · {day.bookings} bookings
                        </div>
                        <div className="relative flex w-full flex-col items-center justify-end gap-1 rounded-[20px] bg-[var(--app-muted)] px-1 pb-1 pt-4">
                          <div
                            className="w-full rounded-[14px] bg-brand-purple/25"
                            style={{ height: `${Math.max((day.conversations / maxLeads) * 120, day.conversations ? 12 : 2)}px` }}
                          />
                          <div
                            className="w-full rounded-[14px] bg-brand-purple"
                            style={{ height: `${Math.max((day.leads / maxLeads) * 120, day.leads ? 12 : 2)}px` }}
                          />
                        </div>
                        <span className="mt-2 text-[10px] text-[var(--app-text-soft)]">
                          {new Date(day.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--app-text-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-purple" />
                      Leads captured
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-purple/25" />
                      Conversations started
                    </span>
                  </div>
                </div>
              )}
            </PortalPanel>

            <PortalPanel
              title="Conversion funnel"
              description="Where the workflow creates value and where it still leaks."
            >
              <div className="space-y-4 px-5 py-6">
                <div className="rounded-[24px] bg-[var(--app-muted)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
                    Current lead-to-book conversion
                  </p>
                  <p className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[var(--app-text)]">
                    {totals.leads > 0 ? ((bookedCount / totals.leads) * 100).toFixed(1) : '0'}%
                  </p>
                </div>

                {[
                  { label: 'Conversations', count: totals.conversations, color: 'bg-slate-400' },
                  { label: 'Leads captured', count: totals.leads, color: 'bg-brand-purple' },
                  { label: 'Follow-ups sent', count: totals.followUpsSent, color: 'bg-amber-500' },
                  { label: 'Booked', count: bookedCount, color: 'bg-emerald-500' },
                  { label: 'Reviews collected', count: totals.reviews, color: 'bg-sky-500' },
                ].map((step) => {
                  const maxCount = Math.max(totals.conversations, totals.leads, 1);
                  return (
                    <div key={step.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-[var(--app-text)]">{step.label}</span>
                        <span className="font-medium text-[var(--app-text-muted)]">{step.count}</span>
                      </div>
                      <div className="h-3 rounded-full bg-[var(--app-muted)]">
                        <div
                          className={`h-3 rounded-full ${step.color}`}
                          style={{ width: `${Math.max((step.count / maxCount) * 100, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </PortalPanel>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <PortalPanel title="Lead sources" description="Which channels are creating captured demand.">
              <BreakdownList
                items={sourceBreakdown}
                emptyTitle="No source data yet."
                emptyDescription="As soon as leads come in from your widget, audit funnel, or manual sources, they will be grouped here."
              />
            </PortalPanel>

            <PortalPanel title="Lead status mix" description="A quick read on pipeline quality and follow-up health.">
              <BreakdownList
                items={statusBreakdown}
                emptyTitle="No status data yet."
                emptyDescription="Once leads are captured and moved through the workflow, the status distribution will appear here."
              />
            </PortalPanel>
          </div>
        </>
      )}
    </div>
  );
}

function BreakdownList({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: { source?: string; status?: string; count: number }[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return <PortalEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const maxCount = items[0]?.count || 1;

  return (
    <div className="space-y-4 px-5 py-6">
      {items.map((item, index) => {
        const label = item.source || item.status || 'unknown';
        return (
          <div key={`${label}-${index}`}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="capitalize text-[var(--app-text)]">{label.replace(/_/g, ' ')}</span>
              <span className="font-medium text-[var(--app-text-muted)]">{item.count}</span>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--app-muted)]">
              <div
                className="h-2.5 rounded-full bg-brand-purple"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'brand' | 'success' | 'warning';
}) {
  const toneMap: Record<typeof tone, string> = {
    default: 'text-[var(--app-text)]',
    brand: 'text-brand-purple',
    success: 'text-emerald-600 dark:text-emerald-300',
    warning: 'text-amber-600 dark:text-amber-300',
  };

  return (
    <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-[-0.03em] ${toneMap[tone]}`}>{value}</p>
    </div>
  );
}

function CashIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a4 4 0 10-8 0v2m-3 0h14a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2v-7a2 2 0 012-2h14z" /></svg>;
}

function TargetIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15l6-6m0 0h-4m4 0v4m-6 6a9 9 0 110-18 9 9 0 010 18z" /></svg>;
}

function ChatIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}

function FunnelIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5h16l-6 7v5l-4 2v-7L4 5z" /></svg>;
}
