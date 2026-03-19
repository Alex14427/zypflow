'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Business {
  id: string;
  name: string;
  plan: string;
  trial_ends_at: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  status: string;
  source: string;
  service_interest: string;
  created_at: string;
}

interface Appointment {
  id: string;
  service: string;
  datetime: string;
  status: string;
  leads: { name: string } | null;
}

interface Conversation {
  id: string;
  channel: string;
  messages: { role: string; content: string }[];
  updated_at: string;
  leads: { name: string } | null;
}

export default function DashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tab, setTab] = useState<'leads' | 'conversations' | 'appointments'>('leads');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const { data: biz } = await supabase
          .from('businesses')
          .select('id, name, plan, trial_ends_at')
          .eq('email', user.email)
          .maybeSingle();

        if (!biz) { router.push('/onboarding'); return; }
        setBusiness(biz);

        const [leadsRes, apptRes, convRes] = await Promise.all([
          supabase.from('leads').select('*').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(50),
          supabase.from('appointments').select('id, service, datetime, status, leads(name)').eq('business_id', biz.id).order('datetime', { ascending: false }).limit(20),
          supabase.from('conversations').select('id, channel, messages, updated_at, leads(name)').eq('business_id', biz.id).order('updated_at', { ascending: false }).limit(20),
        ]);

        setLeads((leadsRes.data as Lead[]) || []);
        setAppointments((apptRes.data as unknown as Appointment[]) || []);
        setConversations((convRes.data as unknown as Conversation[]) || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#6c3cff] border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => l.score >= 70).length;
  const bookedCount = leads.filter((l) => l.status === 'booked').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          <span className="text-[#6c3cff]">Zyp</span>flow
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{business?.name}</span>
          <span className="bg-[#6c3cff] text-white text-xs px-2 py-0.5 rounded-full uppercase">
            {business?.plan}
          </span>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Leads" value={totalLeads} />
          <StatCard label="Hot Leads (70+)" value={hotLeads} color="text-orange-500" />
          <StatCard label="Booked" value={bookedCount} color="text-green-500" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {(['leads', 'conversations', 'appointments'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition ${
                tab === t ? 'bg-white shadow text-[#6c3cff]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Leads tab */}
        {tab === 'leads' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{lead.name || '—'}</td>
                    <td className="px-4 py-3">{lead.email || '—'}</td>
                    <td className="px-4 py-3">{lead.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${lead.score >= 70 ? 'text-orange-500' : lead.score >= 40 ? 'text-yellow-500' : 'text-gray-400'}`}>
                        {lead.score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        lead.status === 'booked' ? 'bg-green-100 text-green-700' :
                        lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                        lead.status === 'lost' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{lead.source}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(lead.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No leads yet. Install your chat widget to start capturing leads.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Conversations tab */}
        {tab === 'conversations' && (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <div key={conv.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">{conv.leads?.name || 'Anonymous'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{conv.channel}</span>
                    <span className="text-xs text-gray-400">{new Date(conv.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {conv.messages?.[conv.messages.length - 1]?.content || 'No messages'}
                </p>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-center text-gray-400 py-8">No conversations yet.</p>
            )}
          </div>
        )}

        {/* Appointments tab */}
        {tab === 'appointments' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{appt.leads?.name || '—'}</td>
                    <td className="px-4 py-3">{appt.service}</td>
                    <td className="px-4 py-3">{new Date(appt.datetime).toLocaleString('en-GB')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        appt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No appointments yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
