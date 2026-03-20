'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LeadDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  status: string;
  source: string;
  service_interest: string;
  urgency: string;
  created_at: string;
  last_contact_at: string;
}

interface ConversationSummary {
  id: string;
  channel: string;
  messages: { role: string; content: string; timestamp?: string }[];
  created_at: string;
}

interface AppointmentSummary {
  id: string;
  service: string;
  datetime: string;
  status: string;
}

interface FollowUpSummary {
  step_number: number;
  channel: string;
  sent_at: string;
}

export function LeadDrawer({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'conversations'>('timeline');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [followUpSent, setFollowUpSent] = useState(false);

  useEffect(() => {
    async function load() {
      const [leadRes, convsRes, apptsRes, fuRes] = await Promise.all([
        supabase.from('leads').select('*').eq('id', leadId).single(),
        supabase.from('conversations').select('id, channel, messages, created_at').eq('lead_id', leadId).order('created_at', { ascending: false }),
        supabase.from('appointments').select('id, service, datetime, status').eq('lead_id', leadId).order('datetime', { ascending: false }),
        supabase.from('follow_ups').select('step_number, channel, sent_at').eq('lead_id', leadId).order('sent_at', { ascending: true }),
      ]);

      setLead(leadRes.data as LeadDetail | null);
      setConversations((convsRes.data as unknown as ConversationSummary[]) || []);
      setAppointments((apptsRes.data as unknown as AppointmentSummary[]) || []);
      setFollowUps((fuRes.data as unknown as FollowUpSummary[]) || []);
      setLoading(false);
    }
    load();
  }, [leadId]);

  // Build timeline events
  const timelineEvents = [
    ...(lead ? [{ type: 'created' as const, date: lead.created_at, label: 'Lead captured', detail: `via ${lead.source || 'chat'}` }] : []),
    ...followUps.map(fu => ({
      type: 'followup' as const,
      date: fu.sent_at,
      label: `Follow-up #${fu.step_number} sent`,
      detail: `via ${fu.channel}`,
    })),
    ...appointments.map(appt => ({
      type: 'appointment' as const,
      date: appt.datetime,
      label: `${appt.service} — ${appt.status}`,
      detail: new Date(appt.datetime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const scoreColor = (lead?.score || 0) >= 70 ? 'text-orange-500 bg-orange-50' : (lead?.score || 0) >= 40 ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 bg-gray-50';
  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    booked: 'bg-green-100 text-green-700',
    cold: 'bg-gray-100 text-gray-600',
    lost: 'bg-red-100 text-red-700',
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-[slideInRight_0.2s_ease-out]">
        {/* Header */}
        <div className="p-5 border-b flex items-start justify-between">
          <div>
            {loading ? (
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                <h2 className="text-lg font-bold">{lead?.name || 'Anonymous'}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[lead?.status || ''] || 'bg-gray-100 text-gray-500'}`}>
                    {lead?.status || 'unknown'}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor}`}>
                    Score: {lead?.score || 0}
                  </span>
                </div>
              </>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Contact info */}
        {lead && (
          <div className="px-5 py-3 border-b bg-gray-50 space-y-1.5">
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <a href={`mailto:${lead.email}`} className="text-brand-purple hover:underline">{lead.email}</a>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <a href={`tel:${lead.phone}`} className="text-brand-purple hover:underline">{lead.phone}</a>
              </div>
            )}
            {lead.service_interest && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                <span className="text-gray-700">{lead.service_interest}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
              <span>Source: {lead.source || 'chat'}</span>
              <span>&middot;</span>
              <span>Created: {new Date(lead.created_at).toLocaleDateString('en-GB')}</span>
            </div>
            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              {lead.email && (
                <button
                  onClick={() => { setShowFollowUp(!showFollowUp); setFollowUpSent(false); }}
                  className="text-xs bg-brand-purple text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-purple-dark transition"
                >
                  {showFollowUp ? 'Cancel' : 'Send Follow-up'}
                </button>
              )}
            </div>
            {/* Follow-up form */}
            {showFollowUp && lead.email && (
              <div className="mt-3 space-y-2">
                {followUpSent ? (
                  <p className="text-sm text-green-600 font-medium">Follow-up sent successfully!</p>
                ) : (
                  <>
                    <textarea
                      value={followUpMessage}
                      onChange={e => setFollowUpMessage(e.target.value)}
                      placeholder={`Hi ${lead.name || 'there'}, just following up on your enquiry about ${lead.service_interest || 'our services'}...`}
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none"
                    />
                    <button
                      onClick={async () => {
                        if (!followUpMessage.trim()) return;
                        setSendingFollowUp(true);
                        try {
                          const res = await fetch('/api/email/follow-up', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ leadId, message: followUpMessage }),
                          });
                          if (res.ok) {
                            setFollowUpSent(true);
                            setFollowUpMessage('');
                          }
                        } catch {
                          // Fail silently
                        }
                        setSendingFollowUp(false);
                      }}
                      disabled={sendingFollowUp || !followUpMessage.trim()}
                      className="text-xs bg-brand-purple text-white px-4 py-1.5 rounded-lg font-medium hover:bg-brand-purple-dark transition disabled:opacity-50"
                    >
                      {sendingFollowUp ? 'Sending...' : 'Send Email'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b">
          {(['timeline', 'conversations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition ${
                activeTab === tab ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : activeTab === 'timeline' ? (
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {timelineEvents.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
                ) : (
                  timelineEvents.map((evt, i) => (
                    <div key={i} className="flex gap-3 relative">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        evt.type === 'created' ? 'bg-blue-100 text-blue-600' :
                        evt.type === 'followup' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        <div className="w-2 h-2 rounded-full bg-current" />
                      </div>
                      <div className="pb-2">
                        <p className="text-sm font-medium">{evt.label}</p>
                        <p className="text-xs text-gray-400">{evt.detail} &middot; {new Date(evt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No conversations</p>
              ) : (
                conversations.map(conv => (
                  <div key={conv.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        conv.channel === 'chat' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                      }`}>{conv.channel}</span>
                      <span className="text-[10px] text-gray-400">{new Date(conv.created_at).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {conv.messages.slice(-6).map((msg, i) => (
                        <p key={i} className={`text-xs ${msg.role === 'user' ? 'text-gray-700' : 'text-gray-500'}`}>
                          <span className="font-medium">{msg.role === 'user' ? 'Customer' : 'AI'}:</span> {msg.content.slice(0, 120)}{msg.content.length > 120 ? '...' : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
