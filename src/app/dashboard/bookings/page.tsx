'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Appointment {
  id: string;
  service: string;
  datetime: string;
  duration_minutes: number;
  status: string;
  leads: { name: string; email: string; phone: string } | null;
}

export default function BookingsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase.from('organisations').select('id').eq('email', user.email).maybeSingle();
      if (!biz) return;

      const { data } = await supabase
        .from('appointments')
        .select('id, service, datetime, duration_minutes, status, leads(name, email, phone)')
        .eq('org_id', biz.id)
        .order('datetime', { ascending: false })
        .limit(100);
      setAppointments((data as unknown as Appointment[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  async function updateStatus(apptId: string, newStatus: string) {
    await supabase.from('appointments').update({ status: newStatus }).eq('id', apptId);
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus } : a));
  }

  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.datetime) >= now);
  const past = appointments.filter(a => new Date(a.datetime) < now);
  const shown = tab === 'upcoming' ? upcoming : past;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Bookings</h1>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'upcoming' ? 'bg-white shadow text-brand-purple' : 'text-gray-500'}`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'past' ? 'bg-white shadow text-brand-purple' : 'text-gray-500'}`}
        >
          Past ({past.length})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Date & Time</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(appt => (
              <tr key={appt.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{appt.leads?.name || '\u2014'}</td>
                <td className="px-4 py-3 text-gray-600">
                  <div className="text-xs">{appt.leads?.email || ''}</div>
                  <div className="text-xs text-gray-400">{appt.leads?.phone || ''}</div>
                </td>
                <td className="px-4 py-3">{appt.service}</td>
                <td className="px-4 py-3">
                  <div>{new Date(appt.datetime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                  <div className="text-xs text-gray-400">{new Date(appt.datetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="px-4 py-3 text-gray-500">{appt.duration_minutes ? `${appt.duration_minutes}min` : '\u2014'}</td>
                <td className="px-4 py-3">
                  <select
                    value={appt.status}
                    onChange={e => updateStatus(appt.id, e.target.value)}
                    className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${
                      appt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      appt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      appt.status === 'no_show' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {['confirmed', 'completed', 'cancelled', 'no_show'].map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                {tab === 'upcoming' ? 'No upcoming bookings.' : 'No past bookings.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
