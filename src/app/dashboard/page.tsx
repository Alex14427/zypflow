'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Stats {
  totalLeads: number;
  hotLeads: number;
  booked: number;
  newToday: number;
  totalConversations: number;
  upcomingAppointments: number;
  reviewsSent: number;
  conversionRate: number;
}

interface RecentLead {
  id: string;
  name: string;
  email: string;
  score: number;
  status: string;
  created_at: string;
}

interface UpcomingAppt {
  id: string;
  service: string;
  datetime: string;
  status: string;
  leads: { name: string } | null;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingAppt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: biz } = await supabase
        .from('businesses')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      if (!biz) return;

      const now = new Date().toISOString();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [leadsRes, convRes, apptRes, apptUpRes, reviewsRes, todayLeadsRes] = await Promise.all([
        supabase.from('leads').select('id, name, email, score, status, created_at').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('conversations').select('id', { count: 'exact' }).eq('business_id', biz.id),
        supabase.from('appointments').select('id', { count: 'exact' }).eq('business_id', biz.id).eq('status', 'confirmed').gte('datetime', now),
        supabase.from('appointments').select('id, service, datetime, status, leads(name)').eq('business_id', biz.id).gte('datetime', now).order('datetime', { ascending: true }).limit(5),
        supabase.from('reviews').select('id', { count: 'exact' }).eq('business_id', biz.id),
        supabase.from('leads').select('id', { count: 'exact' }).eq('business_id', biz.id).gte('created_at', todayStart.toISOString()),
      ]);

      const leads = (leadsRes.data || []) as RecentLead[];
      const totalLeads = leads.length;
      const hotLeads = leads.filter(l => l.score >= 70).length;
      const booked = leads.filter(l => l.status === 'booked').length;

      setStats({
        totalLeads,
        hotLeads,
        booked,
        newToday: todayLeadsRes.count || 0,
        totalConversations: convRes.count || 0,
        upcomingAppointments: apptRes.count || 0,
        reviewsSent: reviewsRes.count || 0,
        conversionRate: totalLeads > 0 ? Math.round((booked / totalLeads) * 100) : 0,
      });

      setRecentLeads(leads.slice(0, 5));
      setUpcoming((apptUpRes.data as unknown as UpcomingAppt[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Leads" value={stats?.totalLeads || 0} />
        <StatCard label="New Today" value={stats?.newToday || 0} color="text-blue-600" />
        <StatCard label="Hot Leads" value={stats?.hotLeads || 0} color="text-orange-500" sub="Score 70+" />
        <StatCard label="Booked" value={stats?.booked || 0} color="text-green-600" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Conversations" value={stats?.totalConversations || 0} />
        <StatCard label="Upcoming Appts" value={stats?.upcomingAppointments || 0} color="text-purple-600" />
        <StatCard label="Reviews Sent" value={stats?.reviewsSent || 0} />
        <StatCard label="Conversion Rate" value={`${stats?.conversionRate || 0}%`} color="text-green-600" />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent leads */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Recent Leads</h2>
            <Link href="/dashboard/leads" className="text-sm text-brand-purple hover:underline">View all</Link>
          </div>
          <div className="divide-y">
            {recentLeads.map(lead => (
              <div key={lead.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{lead.name || 'Anonymous'}</p>
                  <p className="text-xs text-gray-400">{lead.email || 'No email'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${lead.score >= 70 ? 'text-orange-500' : lead.score >= 40 ? 'text-yellow-500' : 'text-gray-400'}`}>
                    {lead.score}
                  </span>
                  <StatusBadge status={lead.status} />
                </div>
              </div>
            ))}
            {recentLeads.length === 0 && (
              <p className="p-4 text-sm text-gray-400 text-center">No leads yet. Install your chat widget to start capturing leads.</p>
            )}
          </div>
        </div>

        {/* Upcoming appointments */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Upcoming Bookings</h2>
            <Link href="/dashboard/bookings" className="text-sm text-brand-purple hover:underline">View all</Link>
          </div>
          <div className="divide-y">
            {upcoming.map(appt => (
              <div key={appt.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{appt.leads?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-400">{appt.service}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{new Date(appt.datetime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-xs text-gray-400">{new Date(appt.datetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="p-4 text-sm text-gray-400 text-center">No upcoming appointments.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, sub }: { label: string; value: number | string; color?: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    booked: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
    cold: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
