'use client';

import { useEffect, useMemo, useState } from 'react';
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

type TimelineEvent = {
  type: 'created' | 'followup' | 'appointment';
  date: string;
  label: string;
  detail: string;
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/12 text-blue-700 dark:text-blue-200',
  contacted: 'bg-amber-500/12 text-amber-700 dark:text-amber-200',
  booked: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-200',
  cold: 'bg-slate-500/12 text-slate-600 dark:text-slate-300',
  lost: 'bg-rose-500/12 text-rose-700 dark:text-rose-200',
};

function getScoreTone(score: number) {
  if (score >= 70) return 'bg-brand-purple/12 text-brand-purple dark:text-orange-100';
  if (score >= 40) return 'bg-amber-500/12 text-amber-700 dark:text-amber-200';
  return 'bg-slate-500/12 text-slate-600 dark:text-slate-300';
}

function formatTimelineDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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
  const [followUpError, setFollowUpError] = useState('');

  useEffect(() => {
    async function load() {
      const [leadRes, convsRes, apptsRes, fuRes] = await Promise.all([
        supabase.from('leads').select('*').eq('id', leadId).single(),
        supabase
          .from('conversations')
          .select('id, channel, messages, created_at')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false }),
        supabase
          .from('appointments')
          .select('id, service, datetime, status')
          .eq('lead_id', leadId)
          .order('datetime', { ascending: false }),
        supabase
          .from('follow_ups')
          .select('step_number, channel, sent_at')
          .eq('lead_id', leadId)
          .order('sent_at', { ascending: true }),
      ]);

      setLead(leadRes.data as LeadDetail | null);
      setConversations((convsRes.data as unknown as ConversationSummary[]) || []);
      setAppointments((apptsRes.data as unknown as AppointmentSummary[]) || []);
      setFollowUps((fuRes.data as unknown as FollowUpSummary[]) || []);
      setLoading(false);
    }

    load();
  }, [leadId]);

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    if (lead) {
      events.push({
        type: 'created',
        date: lead.created_at,
        label: 'Lead captured',
        detail: `Captured via ${lead.source || 'chat widget'}`,
      });
    }

    followUps.forEach((followUp) => {
      events.push({
        type: 'followup',
        date: followUp.sent_at,
        label: `Follow-up #${followUp.step_number} sent`,
        detail: `Delivered via ${followUp.channel}`,
      });
    });

    appointments.forEach((appointment) => {
      events.push({
        type: 'appointment',
        date: appointment.datetime,
        label: `${appointment.service} - ${appointment.status}`,
        detail: new Date(appointment.datetime).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, followUps, lead]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-[var(--app-border)] bg-[var(--app-bg)] shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
        <div className="border-b border-[var(--app-border)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              {loading ? (
                <div className="h-7 w-44 animate-pulse rounded-full bg-[var(--app-muted)]" />
              ) : (
                <>
                  <p className="page-eyebrow">Lead detail</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--app-text)]">{lead?.name || 'Anonymous lead'}</h2>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] p-2 text-[var(--app-text-muted)] transition hover:border-brand-purple hover:text-brand-purple"
              aria-label="Close lead details"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {lead && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${STATUS_COLORS[lead.status] || STATUS_COLORS.new}`}>
                {lead.status}
              </span>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getScoreTone(lead.score)}`}>
                Score {lead.score}
              </span>
              {lead.urgency && (
                <span className="rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-200">
                  {lead.urgency}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="border-b border-[var(--app-border)] px-6 py-4">
          {lead ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile label="Email" value={lead.email || 'Not captured'} href={lead.email ? `mailto:${lead.email}` : undefined} />
              <InfoTile label="Phone" value={lead.phone || 'Not captured'} href={lead.phone ? `tel:${lead.phone}` : undefined} />
              <InfoTile label="Service interest" value={lead.service_interest || 'General enquiry'} />
              <InfoTile label="Source" value={lead.source || 'Chat widget'} />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-[22px] bg-[var(--app-muted)]" />
              ))}
            </div>
          )}

          {lead?.email && (
            <div className="mt-4 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--app-text)]">Manual follow-up</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                    Send a founder-style nudge without leaving the portal.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowFollowUp((value) => !value);
                    setFollowUpSent(false);
                    setFollowUpError('');
                  }}
                  className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple-dark"
                >
                  {showFollowUp ? 'Hide composer' : 'Send follow-up'}
                </button>
              </div>

              {showFollowUp && (
                <div className="mt-4 space-y-3">
                  {followUpSent ? (
                    <div className="rounded-[20px] border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                      Follow-up sent successfully.
                    </div>
                  ) : (
                    <>
                      {followUpError ? (
                        <div className="rounded-[20px] border border-rose-500/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                          {followUpError}
                        </div>
                      ) : null}
                      <textarea
                        value={followUpMessage}
                        onChange={(e) => setFollowUpMessage(e.target.value)}
                        placeholder={`Hi ${lead.name || 'there'}, just following up on your enquiry about ${lead.service_interest || 'our services'}...`}
                        rows={4}
                        className="w-full rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-brand-purple/40 focus:ring-2 focus:ring-brand-purple/10"
                      />
                      <button
                        onClick={async () => {
                          if (!followUpMessage.trim()) return;
                          setSendingFollowUp(true);
                          setFollowUpError('');
                          try {
                            const res = await fetch('/api/email/follow-up', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ leadId, message: followUpMessage }),
                            });
                            const payload = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              throw new Error(payload.error || 'Unable to send the follow-up email right now.');
                            }
                            setFollowUpSent(true);
                            setFollowUpMessage('');
                          } catch (error) {
                            setFollowUpError(
                              error instanceof Error ? error.message : 'Unable to send the follow-up email right now.'
                            );
                          }
                          setSendingFollowUp(false);
                        }}
                        disabled={sendingFollowUp || !followUpMessage.trim()}
                        className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sendingFollowUp ? 'Sending...' : 'Send email'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-b border-[var(--app-border)] px-6 py-3">
          <div className="flex gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] p-1">
            {(['timeline', 'conversations'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold capitalize transition ${
                  activeTab === tab
                    ? 'bg-brand-purple text-white'
                    : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-[24px] bg-[var(--app-muted)]" />
              ))}
            </div>
          ) : activeTab === 'timeline' ? (
            timelineEvents.length > 0 ? (
              <div className="relative space-y-4">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--app-border)]" />
                {timelineEvents.map((event, index) => (
                  <div key={`${event.type}-${index}`} className="relative flex gap-4">
                    <span
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        event.type === 'created'
                          ? 'bg-blue-500/12 text-blue-600 dark:text-blue-200'
                          : event.type === 'followup'
                            ? 'bg-amber-500/12 text-amber-600 dark:text-amber-200'
                            : 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-200'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                    </span>
                    <div className="flex-1 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--app-text)]">{event.label}</p>
                          <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">{event.detail}</p>
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
                          {formatTimelineDate(event.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No timeline activity yet"
                description="Once this lead gets follow-ups, bookings, or reminders, the event stream will start filling in here."
              />
            )
          ) : conversations.length > 0 ? (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-brand-purple/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-purple dark:text-orange-100">
                      {conversation.channel}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
                      {formatTimelineDate(conversation.created_at)}
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {conversation.messages.slice(-6).map((message, index) => (
                      <div
                        key={index}
                        className={`rounded-[20px] px-4 py-3 text-sm leading-6 ${
                          message.role === 'user'
                            ? 'bg-[var(--app-muted)] text-[var(--app-text)]'
                            : 'border border-[var(--app-border)] bg-white text-[var(--app-text-muted)]'
                        }`}
                      >
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
                          {message.role === 'user' ? 'Customer' : 'Assistant'}
                        </p>
                        <p>{message.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No conversations captured yet"
              description="Once this lead starts chatting with the assistant or receives automated replies, the thread history will appear here."
            />
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}

function InfoTile({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = href ? (
    <a href={href} className="font-semibold text-brand-purple transition hover:text-brand-purple-dark">
      {value}
    </a>
  ) : (
    <span className="font-semibold text-[var(--app-text)]">{value}</span>
  );

  return (
    <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--app-text-soft)]">{label}</p>
      <p className="mt-2 text-sm">{content}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-10 text-center">
      <p className="text-sm font-semibold text-[var(--app-text)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{description}</p>
    </div>
  );
}
