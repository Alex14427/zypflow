'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DailyData {
  date: string;
  leads: number;
  bookings: number;
  conversations: number;
}

export default function AnalyticsPage() {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [totals, setTotals] = useState({ leads: 0, bookings: 0, conversations: 0, reviews: 0, followUpsSent: 0 });
  const [sourceBreakdown, setSourceBreakdown] = useState<{ source: string; count: number }[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ status: string; count: number }[]>([]);
  const [roiMetrics, setRoiMetrics] = useState({ estimatedRevenue: 0, costPerLead: 0, avgLeadValue: 0, chatToLeadRate: 0, leadToBookRate: 0 });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase.from('businesses').select('id, plan').eq('email', user.email).maybeSingle();
      if (!biz) return;

      const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString();

      const [leadsRes, apptsRes, convsRes, reviewsRes, allLeadsRes, followUpsRes, bookedLeadsRes] = await Promise.all([
        supabase.from('leads').select('id, created_at, source, status, score, service_interest').eq('business_id', biz.id).gte('created_at', sinceStr),
        supabase.from('appointments').select('id, datetime, service, status').eq('business_id', biz.id).gte('datetime', sinceStr),
        supabase.from('conversations').select('id, created_at, messages').eq('business_id', biz.id).gte('created_at', sinceStr),
        supabase.from('reviews').select('id, rating', { count: 'exact' }).eq('business_id', biz.id),
        supabase.from('leads').select('id, source, status, score').eq('business_id', biz.id),
        supabase.from('follow_ups').select('id', { count: 'exact' }).eq('business_id', biz.id),
        supabase.from('leads').select('id').eq('business_id', biz.id).eq('status', 'booked'),
      ]);

      const leads = leadsRes.data || [];
      const appts = apptsRes.data || [];
      const convs = convsRes.data || [];
      const allLeads = allLeadsRes.data || [];
      const bookedLeads = bookedLeadsRes.data || [];

      setTotals({
        leads: allLeads.length,
        bookings: appts.length,
        conversations: convs.length,
        reviews: reviewsRes.count || 0,
        followUpsSent: followUpsRes.count || 0,
      });

      // ROI Calculations
      const planCosts: Record<string, number> = { starter: 149, growth: 299, enterprise: 499 };
      const monthlyCost = planCosts[biz.plan] || 149;
      const avgServiceValue = 150; // Conservative UK service business average
      const bookedCount = bookedLeads.length;
      const estimatedRevenue = bookedCount * avgServiceValue;
      const costPerLead = allLeads.length > 0 ? Math.round(monthlyCost / allLeads.length) : 0;
      const chatToLeadRate = convs.length > 0 ? Math.round((leads.length / convs.length) * 100) : 0;
      const leadToBookRate = allLeads.length > 0 ? Math.round((bookedCount / allLeads.length) * 100) : 0;

      setRoiMetrics({
        estimatedRevenue,
        costPerLead,
        avgLeadValue: bookedCount > 0 ? Math.round(estimatedRevenue / bookedCount) : avgServiceValue,
        chatToLeadRate,
        leadToBookRate,
      });

      // Build daily data for chart
      const dayMap: Record<string, DailyData> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dayMap[key] = { date: key, leads: 0, bookings: 0, conversations: 0 };
      }

      leads.forEach(l => {
        const key = new Date(l.created_at).toISOString().split('T')[0];
        if (dayMap[key]) dayMap[key].leads++;
      });
      appts.forEach(a => {
        const key = new Date(a.datetime).toISOString().split('T')[0];
        if (dayMap[key]) dayMap[key].bookings++;
      });
      convs.forEach(c => {
        const key = new Date(c.created_at).toISOString().split('T')[0];
        if (dayMap[key]) dayMap[key].conversations++;
      });

      setDailyData(Object.values(dayMap));

      // Source breakdown
      const sources: Record<string, number> = {};
      allLeads.forEach(l => {
        const src = (l as { source?: string }).source || 'unknown';
        sources[src] = (sources[src] || 0) + 1;
      });
      setSourceBreakdown(Object.entries(sources).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count));

      // Status breakdown
      const statuses: Record<string, number> = {};
      allLeads.forEach(l => {
        const st = (l as { status?: string }).status || 'unknown';
        statuses[st] = (statuses[st] || 0) + 1;
      });
      setStatusBreakdown(Object.entries(statuses).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count));

      setLoading(false);
    }
    load();
  }, [dateRange]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" /></div>;
  }

  const maxLeads = Math.max(...dailyData.map(d => d.leads), 1);
  const bookedCount = statusBreakdown.find(s => s.status === 'booked')?.count || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                dateRange === range ? 'bg-white shadow text-brand-purple' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* ROI Metrics — the money row */}
      <div className="bg-gradient-to-r from-brand-purple to-purple-600 rounded-2xl p-6 mb-8 text-white">
        <h2 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wide">Revenue Attribution</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-bold">&pound;{roiMetrics.estimatedRevenue.toLocaleString()}</p>
            <p className="text-sm text-white/70">Estimated Revenue</p>
          </div>
          <div>
            <p className="text-3xl font-bold">&pound;{roiMetrics.costPerLead}</p>
            <p className="text-sm text-white/70">Cost Per Lead</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{roiMetrics.chatToLeadRate}%</p>
            <p className="text-sm text-white/70">Chat &rarr; Lead Rate</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{roiMetrics.leadToBookRate}%</p>
            <p className="text-sm text-white/70">Lead &rarr; Booking Rate</p>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Leads" value={totals.leads} />
        <StatCard label="Bookings" value={totals.bookings} color="text-green-600" />
        <StatCard label="Conversations" value={totals.conversations} color="text-purple-600" />
        <StatCard label="Follow-ups Sent" value={totals.followUpsSent} color="text-yellow-600" />
        <StatCard label="Reviews" value={totals.reviews} color="text-orange-500" />
      </div>

      {/* Leads chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="font-semibold mb-4">Leads — Last {dateRange === '7d' ? '7' : dateRange === '90d' ? '90' : '30'} Days</h2>
        <div className="flex items-end gap-1 h-40">
          {dailyData.map(d => (
            <div key={d.date} className="flex-1 flex flex-col items-center group relative">
              <div className="absolute -top-8 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: {d.leads} lead{d.leads !== 1 ? 's' : ''}, {d.bookings} booking{d.bookings !== 1 ? 's' : ''}
              </div>
              <div
                className="w-full bg-brand-purple/80 rounded-t hover:bg-brand-purple transition-all min-h-[2px]"
                style={{ height: `${(d.leads / maxLeads) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-2">
          <span>{dailyData[0] && new Date(dailyData[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          <span>Today</span>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="font-semibold mb-4">Conversion Funnel</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-4 p-3 bg-brand-purple/5 rounded-lg">
            <span className="text-sm text-gray-600">Lead-to-Booking Conversion Rate:</span>
            <span className="text-2xl font-bold text-brand-purple">
              {totals.leads > 0 ? ((bookedCount / totals.leads) * 100).toFixed(1) : '0'}%
            </span>
          </div>
          {[
            { label: 'Conversations', count: totals.conversations, color: 'bg-purple-500' },
            { label: 'Leads Captured', count: totals.leads, color: 'bg-blue-500' },
            { label: 'Follow-ups Sent', count: totals.followUpsSent, color: 'bg-yellow-500' },
            { label: 'Booked', count: bookedCount, color: 'bg-green-500' },
            { label: 'Reviews Collected', count: totals.reviews, color: 'bg-orange-500' },
          ].map(step => {
            const maxCount = Math.max(totals.conversations, totals.leads, 1);
            return (
              <div key={step.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{step.label}</span>
                  <span className="text-gray-500 font-medium">{step.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`${step.color} h-3 rounded-full transition-all`}
                    style={{ width: `${Math.max((step.count / maxCount) * 100, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns: Source + Status breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold mb-4">Lead Sources</h2>
          {sourceBreakdown.length > 0 ? (
            <div className="space-y-3">
              {sourceBreakdown.map(s => (
                <div key={s.source}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{s.source}</span>
                    <span className="text-gray-500">{s.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-brand-purple h-2 rounded-full"
                      style={{ width: `${(s.count / (sourceBreakdown[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No data yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold mb-4">Lead Status Breakdown</h2>
          {statusBreakdown.length > 0 ? (
            <div className="space-y-3">
              {statusBreakdown.map(s => {
                const colors: Record<string, string> = {
                  new: 'bg-blue-500',
                  contacted: 'bg-yellow-500',
                  booked: 'bg-green-500',
                  cold: 'bg-gray-400',
                  lost: 'bg-red-500',
                };
                return (
                  <div key={s.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{s.status}</span>
                      <span className="text-gray-500">{s.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colors[s.status] || 'bg-gray-400'}`}
                        style={{ width: `${(s.count / (statusBreakdown[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
