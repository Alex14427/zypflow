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
  const [totals, setTotals] = useState({ leads: 0, bookings: 0, conversations: 0, reviews: 0 });
  const [sourceBreakdown, setSourceBreakdown] = useState<{ source: string; count: number }[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ status: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase.from('businesses').select('id').eq('email', user.email).maybeSingle();
      if (!biz) return;

      // Get all data for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const since = thirtyDaysAgo.toISOString();

      const [leadsRes, apptsRes, convsRes, reviewsRes, allLeadsRes] = await Promise.all([
        supabase.from('leads').select('id, created_at, source, status').eq('business_id', biz.id).gte('created_at', since),
        supabase.from('appointments').select('id, datetime').eq('business_id', biz.id).gte('datetime', since),
        supabase.from('conversations').select('id, created_at').eq('business_id', biz.id).gte('created_at', since),
        supabase.from('reviews').select('id', { count: 'exact' }).eq('business_id', biz.id),
        supabase.from('leads').select('id, source, status').eq('business_id', biz.id),
      ]);

      const leads = leadsRes.data || [];
      const appts = apptsRes.data || [];
      const convs = convsRes.data || [];
      const allLeads = allLeadsRes.data || [];

      setTotals({
        leads: allLeads.length,
        bookings: appts.length,
        conversations: convs.length,
        reviews: reviewsRes.count || 0,
      });

      // Build daily data for chart
      const days: Record<string, DailyData> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        days[key] = { date: key, leads: 0, bookings: 0, conversations: 0 };
      }

      leads.forEach(l => {
        const key = new Date(l.created_at).toISOString().split('T')[0];
        if (days[key]) days[key].leads++;
      });
      appts.forEach(a => {
        const key = new Date(a.datetime).toISOString().split('T')[0];
        if (days[key]) days[key].bookings++;
      });
      convs.forEach(c => {
        const key = new Date(c.created_at).toISOString().split('T')[0];
        if (days[key]) days[key].conversations++;
      });

      setDailyData(Object.values(days));

      // Source breakdown
      const sources: Record<string, number> = {};
      allLeads.forEach(l => {
        const src = l.source || 'unknown';
        sources[src] = (sources[src] || 0) + 1;
      });
      setSourceBreakdown(Object.entries(sources).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count));

      // Status breakdown
      const statuses: Record<string, number> = {};
      allLeads.forEach(l => {
        const st = l.status || 'unknown';
        statuses[st] = (statuses[st] || 0) + 1;
      });
      setStatusBreakdown(Object.entries(statuses).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count));

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" /></div>;
  }

  const maxLeads = Math.max(...dailyData.map(d => d.leads), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">All-Time Leads</p>
          <p className="text-3xl font-bold mt-1">{totals.leads}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Total Bookings</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{totals.bookings}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Conversations</p>
          <p className="text-3xl font-bold mt-1 text-purple-600">{totals.conversations}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Reviews</p>
          <p className="text-3xl font-bold mt-1 text-yellow-500">{totals.reviews}</p>
        </div>
      </div>

      {/* Leads chart (last 30 days) */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="font-semibold mb-4">Leads — Last 30 Days</h2>
        <div className="flex items-end gap-1 h-40">
          {dailyData.map(d => (
            <div key={d.date} className="flex-1 flex flex-col items-center group relative">
              <div className="absolute -top-8 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: {d.leads} lead{d.leads !== 1 ? 's' : ''}
              </div>
              <div
                className="w-full bg-brand-purple/80 rounded-t hover:bg-brand-purple transition-all min-h-[2px]"
                style={{ height: `${(d.leads / maxLeads) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-2">
          <span>{new Date(dailyData[0]?.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          <span>Today</span>
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
