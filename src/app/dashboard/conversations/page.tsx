'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveCurrentBusiness } from '@/lib/current-business';
import {
  PortalEmptyState,
  PortalMetricCard,
  PortalMetricGrid,
  PortalPageHeader,
  PortalPanel,
  PortalSegmentedControl,
  PortalStatusPill,
} from '@/components/dashboard/portal-primitives';

interface Message {
  role: string;
  content: string;
  timestamp?: string;
  channel?: string;
}

interface Conversation {
  id: string;
  channel: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  lead_id: string | null;
  leads: {
    name: string;
    email: string;
    phone: string;
    score: number;
    status: string;
    service_interest: string;
  } | null;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [channelFilter, setChannelFilter] = useState<'all' | 'chat' | 'sms'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const businessIdRef = useRef<string | null>(null);

  const loadConversations = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      if (isInitial) {
        const { business } = await resolveCurrentBusiness();
        setBusinessName(business.name || '');
        businessIdRef.current = business.id;
      }

      if (!businessIdRef.current) return;

      const { data, error: conversationsError } = await supabase
        .from('conversations')
        .select('id, channel, messages, created_at, updated_at, lead_id, leads(name, email, phone, score, status, service_interest)')
        .or(`org_id.eq.${businessIdRef.current},business_id.eq.${businessIdRef.current}`)
        .order('updated_at', { ascending: false })
        .limit(200);

      if (conversationsError) throw conversationsError;

      const nextConversations = (data as unknown as Conversation[]) || [];
      setConversations(nextConversations);

      if (nextConversations.length > 0) {
        setSelected((current) => {
          if (!current) return nextConversations[0];
          return nextConversations.find((conversation) => conversation.id === current.id) || nextConversations[0];
        });
      } else {
        setSelected(null);
      }

      setError(null);
    } catch (loadError) {
      console.error('Failed to load conversations:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load conversations right now.');
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadConversations(true);
    const interval = setInterval(() => loadConversations(false), 15000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages]);

  const fetchSuggestions = useCallback(
    async (conversation: Conversation) => {
      if (!conversation.messages?.length) return;

      setLoadingSuggestions(true);
      setSuggestions([]);

      try {
        const response = await fetch('/api/ai/suggest-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversation.messages,
            leadName: conversation.leads?.name,
            businessName,
            service: conversation.leads?.service_interest,
          }),
        });

        if (response.ok) {
          const { suggestions: nextSuggestions } = await response.json();
          setSuggestions(nextSuggestions || []);
        }
      } catch (suggestionError) {
        console.error('Failed to generate suggestions:', suggestionError);
      } finally {
        setLoadingSuggestions(false);
      }
    },
    [businessName]
  );

  useEffect(() => {
    if (selected) {
      fetchSuggestions(selected);
    }
  }, [fetchSuggestions, selected]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      if (channelFilter !== 'all' && conversation.channel !== channelFilter) return false;
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      return (
        (conversation.leads?.name || '').toLowerCase().includes(query) ||
        (conversation.leads?.email || '').toLowerCase().includes(query) ||
        (conversation.leads?.phone || '').includes(query) ||
        conversation.messages?.some((message) => message.content.toLowerCase().includes(query))
      );
    });
  }, [channelFilter, conversations, searchQuery]);

  const smsThreads = useMemo(() => conversations.filter((conversation) => conversation.channel === 'sms').length, [conversations]);
  const replyReady = useMemo(
    () =>
      conversations.filter((conversation) => {
        const lastMessage = conversation.messages?.[conversation.messages.length - 1];
        return lastMessage && lastMessage.role !== 'assistant';
      }).length,
    [conversations]
  );

  async function sendReply() {
    if (!selected || !replyText.trim()) return;

    setSending(true);
    setReplyError(null);

    try {
      const hasPhone = !!selected.leads?.phone;

      if (hasPhone) {
        const smsResponse = await fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selected.leads?.phone,
            body: replyText.trim(),
          }),
        });
        const smsPayload = await smsResponse.json().catch(() => ({}));
        if (!smsResponse.ok) {
          throw new Error(smsPayload.error || 'Unable to send the SMS reply right now.');
        }
      }

      const newMessage: Message = {
        role: 'assistant',
        content: replyText.trim(),
        timestamp: new Date().toISOString(),
        channel: hasPhone ? 'sms' : 'chat',
      };

      const updatedMessages = [...(selected.messages || []), newMessage];

      const { error: updateError } = await supabase
        .from('conversations')
        .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
        .eq('id', selected.id);

      if (updateError) {
        throw updateError;
      }

      const nextConversation = { ...selected, messages: updatedMessages, updated_at: new Date().toISOString() };
      setSelected(nextConversation);
      setConversations((current) =>
        current.map((conversation) => (conversation.id === selected.id ? nextConversation : conversation))
      );
      setReplyText('');
      setSuggestions([]);
    } catch (sendError) {
      console.error('Failed to send reply:', sendError);
      setReplyError(sendError instanceof Error ? sendError.message : 'Unable to send the reply right now.');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <PortalPageHeader
        eyebrow="Inbox"
        title="One command center for every live conversation."
        description="Clients should feel like the system is attentive and controlled here: who messaged, where they came from, what the AI suggested, and what still needs a human reply."
        meta={
          <>
            <PortalStatusPill tone={replyReady > 0 ? 'warning' : 'success'}>
              {replyReady > 0 ? `${replyReady} replies need attention` : 'No waiting customer replies'}
            </PortalStatusPill>
            <PortalStatusPill>{smsThreads} SMS threads</PortalStatusPill>
          </>
        }
        actions={
          <label className="flex min-w-[240px] items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm text-[var(--app-text-muted)]">
            <SearchIcon className="h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search people, messages, or channels..."
              className="w-full bg-transparent text-[var(--app-text)] outline-none placeholder:text-[var(--app-text-soft)]"
            />
          </label>
        }
      />

      <PortalMetricGrid>
        <PortalMetricCard
          label="Open threads"
          value={conversations.length}
          description="Every live conversation attached to this clinic workspace."
          icon={<InboxIcon className="h-5 w-5" />}
        />
        <PortalMetricCard
          label="Reply-ready"
          value={replyReady}
          description="Conversations where the latest message is still from the customer."
          tone={replyReady > 0 ? 'warning' : 'default'}
          icon={<BoltIcon className="h-5 w-5" />}
        />
        <PortalMetricCard
          label="SMS coverage"
          value={smsThreads}
          description="Threads with a phone number available for direct follow-up."
          icon={<PhoneIcon className="h-5 w-5" />}
        />
        <PortalMetricCard
          label="AI suggestions"
          value={selected ? suggestions.length : 0}
          description="Instant draft replies generated for the active thread."
          tone="brand"
          icon={<SparkIcon className="h-5 w-5" />}
        />
      </PortalMetricGrid>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PortalSegmentedControl
          value={channelFilter}
          onChange={setChannelFilter}
          options={[
            { value: 'all', label: 'All channels', count: conversations.length },
            { value: 'chat', label: 'Widget chat', count: conversations.filter((conversation) => conversation.channel === 'chat').length },
            { value: 'sms', label: 'SMS', count: smsThreads },
          ]}
        />
        <div className="text-sm text-[var(--app-text-muted)]">
          Tip: keep this page human-first. The AI should shorten response time, not hide the customer context.
        </div>
      </div>

      {error ? (
        <PortalPanel title="Inbox unavailable" description="We couldn't load the current conversation feed.">
          <PortalEmptyState
            title="The conversation feed is temporarily unavailable."
            description={error}
            action={
              <button
                onClick={() => loadConversations(true)}
                className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple-dark"
              >
                Reload inbox
              </button>
            }
          />
        </PortalPanel>
      ) : conversations.length === 0 ? (
        <PortalPanel title="No conversations yet" description="Once the widget and follow-up automation are live, every inbound message will appear here.">
          <PortalEmptyState
            title="The inbox is waiting for its first real enquiry."
            description="Right after launch, customers will land here with their latest message, contact details, score, and suggested replies so a clinic owner can step in when needed."
            action={
              <a
                href="/dashboard/templates"
                className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple-dark"
              >
                Finish automation setup
              </a>
            }
          />
        </PortalPanel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <PortalPanel
            title="Conversation queue"
            description="Newest threads, recent updates, and channel coverage."
            className="h-[calc(100vh-280px)]"
            contentClassName="flex h-full flex-col"
          >
            <div className="flex-1 divide-y divide-[var(--app-border)] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <PortalEmptyState
                  title="No conversations match these filters."
                  description="Clear the search or switch back to all channels to see the full inbox again."
                  action={
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setChannelFilter('all');
                      }}
                      className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-muted)]"
                    >
                      Reset inbox view
                    </button>
                  }
                />
              ) : (
                filteredConversations.map((conversation) => {
                  const active = selected?.id === conversation.id;
                  const lastMessage = conversation.messages?.[conversation.messages.length - 1];
                  const needsReply = lastMessage?.role !== 'assistant';

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => {
                        setSelected(conversation);
                        setSuggestions([]);
                      }}
                      className={`w-full px-5 py-4 text-left transition ${
                        active ? 'bg-brand-purple/10' : 'hover:bg-[var(--app-muted)]/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-[var(--app-text)]">
                              {conversation.leads?.name || 'Anonymous visitor'}
                            </p>
                            {conversation.leads?.score ? (
                              <PortalStatusPill tone={conversation.leads.score >= 70 ? 'warning' : 'default'}>
                                {conversation.leads.score}
                              </PortalStatusPill>
                            ) : null}
                          </div>
                          <p className="mt-2 truncate text-sm text-[var(--app-text-muted)]">
                            {lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <PortalStatusPill tone={conversation.channel === 'sms' ? 'success' : 'brand'}>
                            {conversation.channel}
                          </PortalStatusPill>
                          {needsReply ? <PortalStatusPill tone="warning">Reply needed</PortalStatusPill> : null}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-[var(--app-text-soft)]">
                        <span>{conversation.leads?.service_interest || 'General enquiry'}</span>
                        <span>
                          {new Date(conversation.updated_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          {new Date(conversation.updated_at).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </PortalPanel>

          <PortalPanel
            title={selected?.leads?.name || 'Select a conversation'}
            description={
              selected
                ? `${selected.leads?.service_interest || 'General enquiry'} • ${selected.channel.toUpperCase()} • ${
                    selected.leads?.email || selected.leads?.phone || 'Anonymous visitor'
                  }`
                : 'Pick a thread to review the history and reply.'
            }
            action={
              selected?.leads?.status ? (
                <PortalStatusPill tone={selected.leads.status === 'booked' ? 'success' : 'brand'}>
                  {selected.leads.status}
                </PortalStatusPill>
              ) : null
            }
            className="h-[calc(100vh-280px)]"
            contentClassName="flex h-full flex-col"
          >
            {!selected ? (
              <PortalEmptyState
                title="Pick a conversation to inspect the full thread."
                description="This panel becomes the command center for that lead: thread history, AI suggestions, and manual replies."
              />
            ) : (
              <>
                <div className="border-b border-[var(--app-border)] px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {selected.leads?.email ? <PortalStatusPill>{selected.leads.email}</PortalStatusPill> : null}
                    {selected.leads?.phone ? <PortalStatusPill tone="success">{selected.leads.phone}</PortalStatusPill> : null}
                    {selected.leads?.score ? (
                      <PortalStatusPill tone={selected.leads.score >= 70 ? 'warning' : 'default'}>
                        Lead score {selected.leads.score}
                      </PortalStatusPill>
                    ) : null}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <div className="space-y-4">
                    {(selected.messages || []).map((message, index) => {
                      const outbound = message.role === 'assistant';
                      return (
                        <div key={`${message.timestamp || message.content}-${index}`} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[78%] rounded-[24px] px-4 py-3 text-sm leading-6 ${
                              outbound
                                ? 'bg-brand-purple text-white shadow-[0_18px_36px_rgba(210,102,69,0.22)]'
                                : 'border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]'
                            }`}
                          >
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">
                              {outbound ? 'Team / AI' : 'Customer'}
                            </p>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            {message.timestamp ? (
                              <p className={`mt-2 text-[11px] ${outbound ? 'text-white/70' : 'text-[var(--app-text-soft)]'}`}>
                                {new Date(message.timestamp).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className="border-t border-[var(--app-border)] bg-[var(--app-muted)]/50 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
                    AI suggested replies
                  </p>
                  {loadingSuggestions ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-[var(--app-text-muted)]">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-purple border-t-transparent" />
                      Generating reply drafts...
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion}-${index}`}
                          onClick={() => setReplyText(suggestion)}
                          className="rounded-full border border-[var(--app-card-border)] bg-[var(--app-surface-strong)] px-4 py-2 text-left text-sm text-[var(--app-text)] transition hover:border-brand-purple/40 hover:bg-brand-purple/5"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--app-text-muted)]">
                      Suggestions will appear here once the selected thread has enough context.
                    </p>
                  )}
                </div>

                <div className="border-t border-[var(--app-border)] px-5 py-4">
                  {replyError ? (
                    <div className="mb-3 rounded-[20px] border border-rose-500/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                      {replyError}
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <textarea
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder={
                        selected.leads?.phone
                          ? `Reply via SMS to ${selected.leads.phone}...`
                          : 'Type a reply back to this lead...'
                      }
                      rows={3}
                      className="min-h-[92px] flex-1 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-brand-purple/50 focus:ring-2 focus:ring-brand-purple/10"
                    />
                    <button
                      onClick={sendReply}
                      disabled={sending || !replyText.trim()}
                      className="rounded-[24px] bg-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-purple-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : 'Send reply'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </PortalPanel>
        </div>
      )}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35m1.85-4.4a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z" /></svg>;
}

function InboxIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5h16v10h-4l-2 3h-4l-2-3H4V5z" /></svg>;
}

function BoltIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg>;
}

function PhoneIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
}

function SparkIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
}
