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
  avgScore: number;
}

interface RecentLead {
  id: string;
  name: string;
  email: string;
  score: number;
  status: string;
  source: string;
  created_at: string;
}

interface UpcomingAppt {
  id: string;
  service: string;
  datetime: string;
  status: string;
  leads: { name: string } | null;
}

interface SetupStatus {
  hasServices: boolean;
  hasFaqs: boolean;
  hasBookingUrl: boolean;
  hasReviewLink: boolean;
  hasWidget: boolean; // we can't really check this, so default true after onboarding
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingAppt[]>([]);
  const [setup, setSetup] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: biz } = await supabase
        .from('businesses')
        .select('id, name, services, knowledge_base, booking_url, google_review_link')
        .eq('email', user.email)
        .maybeSingle();
      if (!biz) return;
      setBusinessName(biz.name || '');

      // Check setup completion
      const services = biz.services as unknown[] | null;
      const faqs = biz.knowledge_base as unknown[] | null;
      setSetup({
        hasServices: Array.isArray(services) && services.length > 0,
        hasFaqs: Array.isArray(faqs) && faqs.length > 0,
        hasBookingUrl: !!biz.booking_url,
        hasReviewLink: !!biz.google_review_link,
        hasWidget: true,
      });

      const now = new Date().toISOString();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [leadsRes, convRes, apptRes, apptUpRes, reviewsRes, todayLeadsRes] = await Promise.all([
        supabase.from('leads').select('id, name, email, score, status, source, created_at').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(50),
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
      const avgScore = totalLeads > 0 ? Math.round(leads.reduce((s, l) => s + l.score, 0) / totalLeads) : 0;

      setStats({
        totalLeads,
        hotLeads,
        booked,
        newToday: todayLeadsRes.count || 0,
        totalConversations: convRes.count || 0,
        upcomingAppointments: apptRes.count || 0,
        reviewsSent: reviewsRes.count || 0,
        conversionRate: totalLeads > 0 ? Math.round((booked / totalLeads) * 100) : 0,
        avgScore,
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

  const setupComplete = setup && setup.hasServices && setup.hasFaqs && setup.hasBookingUrl && setup.hasReviewLink;
  const setupSteps = setup ? [
    { done: setup.hasServices, label: 'Add your services', link: '/onboarding' },
    { done: setup.hasFaqs, label: 'Add FAQs for AI', link: '/onboarding' },
    { done: setup.hasBookingUrl, label: 'Connect booking link', link: '/dashboard/settings' },
    { done: setup.hasReviewLink, label: 'Add Google review link', link: '/dashboard/settings' },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back{businessName ? `, ${businessName}` : ''}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
      </div>

      {/* Setup checklist (only if incomplete) */}
      {setup && !setupComplete && (
        <div className="bg-gradient-to-r from-brand-purple to-purple-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Complete your setup</h2>
              <p className="text-white/70 text-sm mt-0.5">Finish these steps to get the most out of Zypflow.</p>
            </div>
            <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
              {setupSteps.filter(s => s.done).length}/{setupSteps.length}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {setupSteps.map((step, i) => (
              <Link
                key={i}
                href={step.link}
                className={`flex items-center gap-3 p-3 rounded-xl transition ${
                  step.done ? 'bg-white/10' : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.done ? 'bg-green-400' : 'bg-white/30'
                }`}>
                  {step.done ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <span className={`text-sm ${step.done ? 'line-through text-white/50' : 'font-medium'}`}>{step.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Leads" value={stats?.totalLeads || 0} />
        <StatCard label="New Today" value={stats?.newToday || 0} color="text-blue-600" icon={<TrendIcon />} />
        <StatCard label="Hot Leads" value={stats?.hotLeads || 0} color="text-orange-500" sub="Score 70+" />
        <StatCard label="Booked" value={stats?.booked || 0} color="text-green-600" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Conversations" value={stats?.totalConversations || 0} />
        <StatCard label="Upcoming Appts" value={stats?.upcomingAppointments || 0} color="text-purple-600" />
        <StatCard label="Avg Lead Score" value={stats?.avgScore || 0} color="text-yellow-600" sub="out of 100" />
        <StatCard label="Conversion Rate" value={`${stats?.conversionRate || 0}%`} color="text-green-600" />
      </div>

      {/* Quick win callouts */}
      {stats && stats.hotLeads > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
            </div>
            <div>
              <p className="font-semibold text-orange-800 text-sm">You have {stats.hotLeads} hot lead{stats.hotLeads !== 1 ? 's' : ''}!</p>
              <p className="text-xs text-orange-600">These leads scored 70+ and are ready to book. Reach out now.</p>
            </div>
          </div>
          <Link href="/dashboard/leads" className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition">
            View Leads
          </Link>
        </div>
      )}

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
              <div key={lead.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                <div>
                  <p className="text-sm font-medium">{lead.name || 'Anonymous'}</p>
                  <p className="text-xs text-gray-400">{lead.email || 'No email'} &middot; {lead.source || 'chat'}</p>
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
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">No leads yet</p>
                <p className="text-xs text-gray-400 mb-3">Leads will appear here when customers use the chat widget on your website.</p>
                <Link href="/dashboard/settings" className="text-xs text-brand-purple font-medium hover:underline">Get your widget code &rarr;</Link>
              </div>
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
              <div key={appt.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition">
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
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">No upcoming appointments</p>
                <p className="text-xs text-gray-400">Appointments appear here when customers book via Cal.com.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, sub, icon }: { label: string; value: number | string; color?: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {icon}
      </div>
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

function TrendIcon() {
  return (
    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
