'use client';

import { useEffect, useState } from 'react';
import { fetchDashboardData } from '@/services/dashboard.service';
import { DashboardData } from '@/types/dashboard';
import { LeadsTable } from '@/components/dashboard/leads-table';
import { ConversationsPreview } from '@/components/dashboard/conversations-preview';
import { AppointmentsList } from '@/components/dashboard/appointments-list';
import { ReviewsSummary } from '@/components/dashboard/reviews-summary';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const data = await fetchDashboardData();
        if (!mounted) return;

        setDashboardData(data);
        setErrorMessage(null);
      } catch (error) {
        if (!mounted) return;

        console.error('Failed to load dashboard data:', error);
        setErrorMessage('Unable to load dashboard right now. Please refresh the page.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <DashboardLoading />;
  }

  if (errorMessage || !dashboardData) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {errorMessage || 'Dashboard is unavailable.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{dashboardData.businessName} Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Track leads, conversations, appointments, and reviews in one place.</p>
      </header>

      <LeadsTable leads={dashboardData.leads} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ConversationsPreview conversations={dashboardData.conversations} />
        <AppointmentsList appointments={dashboardData.appointments} />
      </div>

      <ReviewsSummary reviews={dashboardData.reviews} />
    </div>
  );
}
