'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const PLAN_PRICES: Record<string, number> = {
  starter: 149,
  growth: 299,
  enterprise: 499,
};

interface Metrics {
  // Revenue
  totalBusinesses: number;
  planCounts: Record<string, number>;
  mrr: number;
  // Engagement
  totalLeads: number;
  totalConversations: number;
  totalAppointments: number;
  totalReviews: number;
  // Pipeline (last 7d)
  signups7d: number;
  leads7d: number;
  bookings7d: number;
  conversations7d: number;
  // Outreach
  totalProspects: number;
  prospectsByStatus: Record<string, number>;
  // Website
  websiteEnquiries: number;
  enquiries7d: number;
  // Churn
  cancelledCount: number;
  trialExpiring: number;
  // Tables
  recentSignups: Array<{ name: string; email: string; plan: string; created_at: string; active: boolean }>;
  recentEnquiries: Array<{ name: string; email: string; business_name: string; created_at: string; status: string }>;
  topBusinesses: Array<{ name: string; email: string; plan: string; lead_count: number }>;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'pipeline' | 'outreach' | 'customers'>('overview');

  const load = useCallback(async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const [
      { count: totalBusinesses },
      { data: planData },
      { count: totalLeads },
      { count: totalConversations },
      { count: totalAppointments },
      { count: totalReviews },
      { count: leads7d },
      { count: bookings7d },
      { count: conversations7d },
      { count: totalProspects },
      { data: prospectStatusData },
      { count: websiteEnquiries },
      { count: enquiries7d },
      { count: cancelledCount },
      { data: trialExpiringData },
      { data: recentSignups },
      { data: recentEnquiries },
    ] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('businesses').select('plan, active'),
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('conversations').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('reviews').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('prospects').select('*', { count: 'exact', head: true }),
      supabase.from('prospects').select('status'),
      supabase.from('website_enquiries').select('*', { count: 'exact', head: true }),
      supabase.from('website_enquiries').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('plan', 'cancelled'),
      supabase.from('businesses').select('id').eq('plan', 'trial').lte('trial_ends_at', threeDaysFromNow.toISOString()).gte('trial_ends_at', now.toISOString()),
      supabase.from('businesses').select('name, email, plan, created_at, active').order('created_at', { ascending: false }).limit(15),
      supabase.from('website_enquiries').select('name, email, business_name, created_at, status').order('created_at', { ascending: false }).limit(10),
    ]);

    // Plan counts
    const planCounts: Record<string, number> = { trial: 0, starter: 0, growth: 0, enterprise: 0, cancelled: 0 };
    for (const row of planData ?? []) {
      const plan = (row.plan ?? 'trial').toLowerCase();
      planCounts[plan] = (planCounts[plan] ?? 0) + 1;
    }
    const mrr = Object.entries(planCounts).reduce((sum, [plan, count]) => sum + (PLAN_PRICES[plan] ?? 0) * count, 0);

    // Prospect status breakdown
    const prospectsByStatus: Record<string, number> = { new: 0, outreach_sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, unsubscribed: 0 };
    for (const row of prospectStatusData ?? []) {
      const status = (row.status ?? 'new').toLowerCase();
      prospectsByStatus[status] = (prospectsByStatus[status] ?? 0) + 1;
    }

    // Count signups in last 7d
    const signups7d = (recentSignups ?? []).filter((s: { created_at: string }) =>
      new Date(s.created_at) >= sevenDaysAgo
    ).length;

    setMetrics({
      totalBusinesses: totalBusinesses ?? 0,
      planCounts,
      mrr,
      totalLeads: totalLeads ?? 0,
      totalConversations: totalConversations ?? 0,
      totalAppointments: totalAppointments ?? 0,
      totalReviews: totalReviews ?? 0,
      signups7d,
      leads7d: leads7d ?? 0,
      bookings7d: bookings7d ?? 0,
      conversations7d: conversations7d ?? 0,
      totalProspects: totalProspects ?? 0,
      prospectsByStatus,
      websiteEnquiries: websiteEnquiries ?? 0,
      enquiries7d: enquiries7d ?? 0,
      cancelledCount: cancelledCount ?? 0,
      trialExpiring: trialExpiringData?.length ?? 0,
      recentSignups: (recentSignups ?? []) as Metrics['recentSignups'],
      recentEnquiries: (recentEnquiries ?? []) as Metrics['recentEnquiries'],
      topBusinesses: [], // populated separately if needed
    });
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, [load]);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  const paidCustomers = (metrics.planCounts.starter ?? 0) + (metrics.planCounts.growth ?? 0) + (metrics.planCounts.enterprise ?? 0);
  const arr = metrics.mrr * 12;
  const outreachReplyRate = metrics.totalProspects > 0
    ? ((metrics.prospectsByStatus.replied ?? 0) / metrics.totalProspects * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-1 bg-white rounded-lg shadow p-1">
        {(['overview', 'pipeline', 'outreach', 'customers'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition capitalize ${
              activeTab === tab
                ? 'bg-brand-purple text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Revenue hero */}
          <div className="bg-gradient-to-r from-brand-purple to-purple-700 rounded-xl p-6 text-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-purple-200 text-xs font-medium uppercase tracking-wide">MRR</p>
                <p className="text-3xl font-bold mt-1">&pound;{metrics.mrr.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-purple-200 text-xs font-medium uppercase tracking-wide">ARR</p>
                <p className="text-3xl font-bold mt-1">&pound;{arr.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-purple-200 text-xs font-medium uppercase tracking-wide">Paid Customers</p>
                <p className="text-3xl font-bold mt-1">{paidCustomers}</p>
              </div>
              <div>
                <p className="text-purple-200 text-xs font-medium uppercase tracking-wide">Total Signups</p>
                <p className="text-3xl font-bold mt-1">{metrics.totalBusinesses}</p>
              </div>
            </div>
          </div>

          {/* 7-day activity */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Last 7 Days</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard label="New Signups" value={metrics.signups7d} accent={metrics.signups7d > 0} />
              <MetricCard label="Website Enquiries" value={metrics.enquiries7d} accent={metrics.enquiries7d > 0} />
              <MetricCard label="Leads Captured" value={metrics.leads7d} />
              <MetricCard label="Bookings Made" value={metrics.bookings7d} />
              <MetricCard label="Conversations" value={metrics.conversations7d} />
            </div>
          </div>

          {/* Alerts */}
          {(metrics.trialExpiring > 0 || metrics.cancelledCount > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.trialExpiring > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 font-semibold text-sm">Trials Expiring Soon</p>
                  <p className="text-amber-700 text-2xl font-bold mt-1">{metrics.trialExpiring}</p>
                  <p className="text-amber-600 text-xs mt-1">Within next 3 days — consider personal outreach</p>
                </div>
              )}
              {metrics.cancelledCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold text-sm">Cancelled Accounts</p>
                  <p className="text-red-700 text-2xl font-bold mt-1">{metrics.cancelledCount}</p>
                  <p className="text-red-600 text-xs mt-1">Total churned customers</p>
                </div>
              )}
            </div>
          )}

          {/* Platform totals */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Platform Totals</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Total Leads" value={metrics.totalLeads.toLocaleString()} />
              <MetricCard label="Total Bookings" value={metrics.totalAppointments.toLocaleString()} />
              <MetricCard label="Total Conversations" value={metrics.totalConversations.toLocaleString()} />
              <MetricCard label="Review Requests" value={metrics.totalReviews.toLocaleString()} />
            </div>
          </div>

          {/* Revenue breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Revenue by Plan</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customers</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Monthly Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(metrics.planCounts).map(([plan, count]) => (
                    <tr key={plan} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 capitalize">
                        <span className={`inline-flex items-center gap-2 ${plan === 'cancelled' ? 'text-red-600' : ''}`}>
                          <span className={`w-2 h-2 rounded-full ${
                            plan === 'trial' ? 'bg-gray-400' :
                            plan === 'starter' ? 'bg-blue-500' :
                            plan === 'growth' ? 'bg-brand-purple' :
                            plan === 'enterprise' ? 'bg-emerald-500' :
                            'bg-red-400'
                          }`} />
                          {plan}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">{count}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{PLAN_PRICES[plan] ? `£${PLAN_PRICES[plan]}/mo` : '—'}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                        {PLAN_PRICES[plan] ? `£${(PLAN_PRICES[plan] * count).toLocaleString()}/mo` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== PIPELINE TAB ===== */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Sales Pipeline</h2>

          {/* Funnel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Acquisition Funnel</h3>
            <div className="space-y-3">
              <FunnelRow label="Prospects Scraped" value={metrics.totalProspects} max={metrics.totalProspects} color="bg-gray-400" />
              <FunnelRow label="Outreach Sent" value={metrics.prospectsByStatus.outreach_sent ?? 0} max={metrics.totalProspects} color="bg-blue-400" />
              <FunnelRow label="Emails Opened" value={metrics.prospectsByStatus.opened ?? 0} max={metrics.totalProspects} color="bg-indigo-400" />
              <FunnelRow label="Links Clicked" value={metrics.prospectsByStatus.clicked ?? 0} max={metrics.totalProspects} color="bg-purple-400" />
              <FunnelRow label="Replied" value={metrics.prospectsByStatus.replied ?? 0} max={metrics.totalProspects} color="bg-emerald-500" />
              <FunnelRow label="Website Enquiries" value={metrics.websiteEnquiries} max={metrics.totalProspects || 1} color="bg-amber-500" />
              <FunnelRow label="Signed Up" value={metrics.totalBusinesses} max={metrics.totalProspects || 1} color="bg-brand-purple" />
              <FunnelRow label="Paying" value={paidCustomers} max={metrics.totalProspects || 1} color="bg-emerald-600" />
            </div>
          </div>

          {/* Outreach stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Reply Rate" value={`${outreachReplyRate}%`} />
            <MetricCard label="Bounced" value={metrics.prospectsByStatus.bounced ?? 0} />
            <MetricCard label="Unsubscribed" value={metrics.prospectsByStatus.unsubscribed ?? 0} />
            <MetricCard label="Pending (new)" value={metrics.prospectsByStatus.new ?? 0} accent={(metrics.prospectsByStatus.new ?? 0) > 0} />
          </div>

          {/* Website enquiries table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Website Enquiries</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Business</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {metrics.recentEnquiries.length > 0 ? (
                    metrics.recentEnquiries.map((e, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{e.name}</td>
                        <td className="px-6 py-3 text-sm text-gray-700">{e.email}</td>
                        <td className="px-6 py-3 text-sm text-gray-700">{e.business_name || '—'}</td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            e.status === 'new' ? 'bg-blue-100 text-blue-700' :
                            e.status === 'contacted' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{e.status}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No website enquiries yet. Once the lead form gets submissions, they appear here.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== OUTREACH TAB ===== */}
      {activeTab === 'outreach' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Cold Outreach Pipeline</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(metrics.prospectsByStatus).map(([status, count]) => (
              <div key={status} className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs font-medium text-gray-500 capitalize mt-1">{status.replace('_', ' ')}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Outreach Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Prospects</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalProspects}</p>
                <p className="text-xs text-gray-400 mt-1">Scraped from Google Maps via Apify</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reply Rate</p>
                <p className={`text-2xl font-bold ${Number(outreachReplyRate) >= 3 ? 'text-emerald-600' : Number(outreachReplyRate) >= 1 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {outreachReplyRate}%
                </p>
                <p className="text-xs text-gray-400 mt-1">{Number(outreachReplyRate) >= 3 ? 'Healthy' : Number(outreachReplyRate) >= 1 ? 'Average' : 'Warm up emails first'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bounce Rate</p>
                <p className={`text-2xl font-bold ${
                  metrics.totalProspects > 0 && ((metrics.prospectsByStatus.bounced ?? 0) / metrics.totalProspects * 100) > 5
                    ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {metrics.totalProspects > 0 ? ((metrics.prospectsByStatus.bounced ?? 0) / metrics.totalProspects * 100).toFixed(1) : '0'}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Keep below 5% for good deliverability</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-semibold text-sm">Outreach Checklist</p>
            <ul className="mt-2 space-y-1 text-sm text-blue-700">
              <li className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs ${metrics.totalProspects > 0 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-300'}`}>
                  {metrics.totalProspects > 0 ? '✓' : ''}
                </span>
                Prospects scraped ({metrics.totalProspects} total)
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs ${(metrics.prospectsByStatus.outreach_sent ?? 0) > 0 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-300'}`}>
                  {(metrics.prospectsByStatus.outreach_sent ?? 0) > 0 ? '✓' : ''}
                </span>
                Outreach emails sent ({metrics.prospectsByStatus.outreach_sent ?? 0} sent)
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs ${(metrics.prospectsByStatus.replied ?? 0) > 0 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-300'}`}>
                  {(metrics.prospectsByStatus.replied ?? 0) > 0 ? '✓' : ''}
                </span>
                Replies received ({metrics.prospectsByStatus.replied ?? 0} replies)
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs ${paidCustomers > 0 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-300'}`}>
                  {paidCustomers > 0 ? '✓' : ''}
                </span>
                Paying customers ({paidCustomers} active)
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ===== CUSTOMERS TAB ===== */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">All Customers</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Total Signups" value={metrics.totalBusinesses} />
            <MetricCard label="Paying" value={paidCustomers} accent={paidCustomers > 0} />
            <MetricCard label="On Trial" value={metrics.planCounts.trial ?? 0} />
            <MetricCard label="Cancelled" value={metrics.cancelledCount} />
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metrics.recentSignups.length > 0 ? (
                  metrics.recentSignups.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{s.email}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                          s.plan === 'growth' ? 'bg-purple-100 text-purple-700' :
                          s.plan === 'starter' ? 'bg-blue-100 text-blue-700' :
                          s.plan === 'enterprise' ? 'bg-emerald-100 text-emerald-700' :
                          s.plan === 'cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>{s.plan}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`w-2 h-2 rounded-full inline-block mr-1 ${s.active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        <span className="text-xs text-gray-600">{s.active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No customers yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-lg shadow p-5 ${accent ? 'bg-brand-purple text-white' : 'bg-white'}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${accent ? 'text-purple-200' : 'text-gray-500'}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function FunnelRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 2;
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 text-sm text-gray-600 text-right shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
