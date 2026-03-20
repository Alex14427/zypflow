'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const PLAN_PRICES: Record<string, number> = {
  starter: 149,
  growth: 299,
  enterprise: 499,
};

interface Metrics {
  totalBusinesses: number;
  planCounts: Record<string, number>;
  mrr: number;
  totalLeads: number;
  totalConversations: number;
  totalAppointments: number;
  recentSignups: Array<{ name: string; email: string; plan: string; created_at: string }>;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    async function load() {
      const [
        { count: totalBusinesses },
        { data: planData },
        { count: totalLeads },
        { count: totalConversations },
        { count: totalAppointments },
      ] = await Promise.all([
        supabase.from('businesses').select('*', { count: 'exact', head: true }),
        supabase.from('businesses').select('plan'),
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
      ]);

      const planCounts: Record<string, number> = { trial: 0, starter: 0, growth: 0, enterprise: 0, cancelled: 0 };
      for (const row of planData ?? []) {
        const plan = (row.plan ?? 'trial').toLowerCase();
        planCounts[plan] = (planCounts[plan] ?? 0) + 1;
      }

      const mrr = Object.entries(planCounts).reduce((sum, [plan, count]) => sum + (PLAN_PRICES[plan] ?? 0) * count, 0);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: recentSignups } = await supabase
        .from('businesses')
        .select('name, email, plan, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      setMetrics({
        totalBusinesses: totalBusinesses ?? 0,
        planCounts,
        mrr,
        totalLeads: totalLeads ?? 0,
        totalConversations: totalConversations ?? 0,
        totalAppointments: totalAppointments ?? 0,
        recentSignups: recentSignups ?? [],
      });
    }
    load();
  }, []);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Business Metrics</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Total Businesses" value={metrics.totalBusinesses} />
        <MetricCard label="MRR" value={`£${metrics.mrr.toLocaleString()}`} />
        <MetricCard label="Total Leads" value={metrics.totalLeads} />
        <MetricCard label="Total Conversations" value={metrics.totalConversations} />
        <MetricCard label="Total Appointments" value={metrics.totalAppointments} />
        <MetricCard label="Signups (7d)" value={metrics.recentSignups.length} />
      </div>

      {/* Businesses by plan */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Businesses by Plan</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-purple text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(metrics.planCounts).map(([plan, count]) => (
                <tr key={plan} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 capitalize">{plan}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{count}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{PLAN_PRICES[plan] ? `£${PLAN_PRICES[plan]}/mo` : '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{PLAN_PRICES[plan] ? `£${(PLAN_PRICES[plan] * count).toLocaleString()}/mo` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent signups */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Signups (Last 7 Days)</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-purple text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Signed Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.recentSignups.length > 0 ? (
                metrics.recentSignups.map((signup, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{signup.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{signup.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 capitalize">{signup.plan}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(signup.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No signups in the last 7 days.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-brand-purple">{value}</p>
    </div>
  );
}
