'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ROIStats {
  leadCount: number;
  appointmentCount: number;
  reviewCount: number;
  conversationCount: number;
}

interface Props {
  orgId: string;
}

export default function ROIDashboard({ orgId }: Props) {
  const [stats, setStats] = useState<ROIStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;

    async function fetchStats() {
      const [leadsRes, apptRes, reviewsRes, convRes] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('org_id', orgId).not('completed_at', 'is', null),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
      ]);

      setStats({
        leadCount: leadsRes.count || 0,
        appointmentCount: apptRes.count || 0,
        reviewCount: reviewsRes.count || 0,
        conversationCount: convRes.count || 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, [orgId]);

  if (loading || !stats) {
    return (
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-brand-purple rounded-full" />
          <h2 className="text-lg font-bold text-gray-900">Your ROI with Zypflow</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border shadow-sm p-5 animate-pulse">
              <div className="w-10 h-10 bg-gray-100 rounded-full mb-3" />
              <div className="h-7 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { leadCount, appointmentCount, reviewCount, conversationCount } = stats;

  // ROI calculations
  const minutesSaved = leadCount * 15 + appointmentCount * 10 + conversationCount * 5;
  const hoursSaved = (minutesSaved / 60).toFixed(1);
  const revenueInfluenced = leadCount * 85;
  const automationsRun = leadCount + appointmentCount + conversationCount;

  const cards = [
    {
      label: 'Time Saved',
      value: `${hoursSaved}h`,
      subtitle: `${minutesSaved.toLocaleString()} minutes automated`,
      icon: <ClockIcon />,
      iconBg: 'bg-purple-50',
      iconColor: 'text-brand-purple',
    },
    {
      label: 'Revenue Influenced',
      value: `£${revenueInfluenced.toLocaleString()}`,
      subtitle: `Based on ${leadCount} lead${leadCount !== 1 ? 's' : ''} at avg £85 value`,
      icon: <TrendingUpIcon />,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Automations Run',
      value: automationsRun.toLocaleString(),
      subtitle: `Across leads, bookings & chats`,
      icon: <ZapIcon />,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      label: 'Cost Per Lead',
      value: '£0',
      subtitle: `vs £35 industry avg`,
      subtitleHighlight: true,
      icon: <PoundIcon />,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  ];

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 bg-brand-purple rounded-full" />
        <h2 className="text-lg font-bold text-gray-900">Your ROI with Zypflow</h2>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          All time
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border shadow-sm p-5">
            <div className={`w-10 h-10 ${card.iconBg} rounded-full flex items-center justify-center mb-3`}>
              <span className={card.iconColor}>{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5 leading-snug">{card.label}</p>
            <p className={`text-xs mt-1 leading-snug ${card.subtitleHighlight ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Completed reviews callout */}
      {reviewCount > 0 && (
        <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-purple/10 rounded-full flex items-center justify-center flex-shrink-0">
            <StarIcon />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {reviewCount} review{reviewCount !== 1 ? 's' : ''} collected automatically
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Zypflow sent review requests on your behalf — each one you didn&apos;t have to chase manually.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function PoundIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 8a4 4 0 118 0c0 1.5-.5 2.5-1 3H8m0 0H6m2 0v2m0 2H6m2 0h4m4 0h2" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-5 h-5 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}
