'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
  leads: { name: string; email: string; phone: string; score: number; status: string; service_interest: string } | null;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [channelFilter, setChannelFilter] = useState<'all' | 'chat' | 'sms'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const orgIdRef = useRef<string | null>(null);

  const loadConversations = useCallback(async (isInitial = false) => {
    if (isInitial) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase.from('organisations').select('id, name').eq('email', user.email).maybeSingle();
      if (!biz) return;
      setBusinessName(biz.name || '');
      orgIdRef.current = biz.id;
    }
    if (!orgIdRef.current) return;

    const { data } = await supabase
      .from('conversations')
      .select('id, channel, messages, created_at, updated_at, lead_id, leads(name, email, phone, score, status, service_interest)')
      .eq('org_id', orgIdRef.current)
      .order('updated_at', { ascending: false })
      .limit(200);
    const convs = (data as unknown as Conversation[]) || [];
    setConversations(convs);
    if (isInitial && convs.length > 0) setSelected(convs[0]);
    // Update selected conversation with fresh data (new messages from customers)
    if (!isInitial) {
      setSelected(prev => {
        if (!prev) return prev;
        const updated = convs.find(c => c.id === prev.id);
        return updated || prev;
      });
    }
    if (isInitial) setLoading(false);
  }, []);

  useEffect(() => {
    loadConversations(true);
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => loadConversations(false), 15000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages]);

  // Fetch AI suggestions when conversation changes
  const fetchSuggestions = useCallback(async (conv: Conversation) => {
    if (!conv.messages?.length) return;
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const res = await fetch('/api/ai/suggest-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conv.messages,
          leadName: conv.leads?.name,
          businessName,
          service: conv.leads?.service_interest,
        }),
      });
      if (res.ok) {
        const { suggestions: s } = await res.json();
        setSuggestions(s || []);
      }
    } catch {
      // Fail silently
    }
    setLoadingSuggestions(false);
  }, [businessName]);

  useEffect(() => {
    if (selected) fetchSuggestions(selected);
  }, [selected?.id, fetchSuggestions, selected]);

  async function sendReply() {
    if (!selected || !replyText.trim()) return;
    setSending(true);

    const hasPhone = !!selected.leads?.phone;

    // Send via SMS if phone available
    if (hasPhone) {
      try {
        await fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selected.leads!.phone,
            body: replyText.trim(),
          }),
        });
      } catch (err) {
        console.error('SMS send failed:', err);
      }
    }

    // Append to conversation
    const newMsg: Message = {
      role: 'assistant',
      content: replyText.trim(),
      timestamp: new Date().toISOString(),
      channel: hasPhone ? 'sms' : 'chat',
    };
    const updatedMessages = [...(selected.messages || []), newMsg];

    // Update in DB
    await supabase.from('conversations')
      .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
      .eq('id', selected.id);

    setSelected({ ...selected, messages: updatedMessages });
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, messages: updatedMessages, updated_at: new Date().toISOString() } : c));
    setReplyText('');
    setSending(false);
    setSuggestions([]);
  }

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (c.leads?.name || '').toLowerCase().includes(q) ||
        (c.leads?.email || '').toLowerCase().includes(q) ||
        (c.leads?.phone || '').includes(q) ||
        c.messages?.some(m => m.content.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Conversations</h1>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No conversations yet</h3>
          <p className="text-sm text-gray-400">Conversations will appear here when customers use the chat widget on your website.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversation list */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
            {/* Search and filter */}
            <div className="p-3 border-b space-y-2">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
              <div className="flex gap-1">
                {(['all', 'chat', 'sms'] as const).map(ch => (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(ch)}
                    className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition ${
                      channelFilter === ch ? 'bg-brand-purple text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {ch} {ch === 'all' ? `(${conversations.length})` : `(${conversations.filter(c => c.channel === ch).length})`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y">
              {filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => { setSelected(conv); setSuggestions([]); }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                    selected?.id === conv.id ? 'bg-brand-purple/5 border-l-2 border-brand-purple' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{conv.leads?.name || 'Anonymous'}</span>
                    <div className="flex items-center gap-1.5">
                      {conv.leads?.score !== undefined && conv.leads.score > 0 && (
                        <span className={`text-[10px] font-bold ${conv.leads.score >= 70 ? 'text-orange-500' : 'text-gray-400'}`}>
                          {conv.leads.score}
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        conv.channel === 'chat' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {conv.channel}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {conv.messages?.[conv.messages.length - 1]?.content || 'No messages'}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-gray-300">
                      {new Date(conv.updated_at).toLocaleDateString('en-GB')} {new Date(conv.updated_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {conv.leads?.status && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        conv.leads.status === 'booked' ? 'bg-green-100 text-green-700' :
                        conv.leads.status === 'new' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {conv.leads.status}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {filteredConversations.length === 0 && (
                <p className="p-4 text-sm text-gray-400 text-center">No conversations match your search.</p>
              )}
            </div>
          </div>

          {/* Message viewer */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border flex flex-col">
            {selected ? (
              <>
                {/* Header with lead info */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{selected.leads?.name || 'Anonymous'}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        {selected.leads?.email && <span>{selected.leads.email}</span>}
                        {selected.leads?.phone && <span>{selected.leads.phone}</span>}
                        <span className="capitalize">{selected.channel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selected.leads?.service_interest && (
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                          {selected.leads.service_interest}
                        </span>
                      )}
                      {selected.leads?.score !== undefined && selected.leads.score > 0 && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          selected.leads.score >= 70 ? 'bg-orange-50 text-orange-600' :
                          selected.leads.score >= 40 ? 'bg-yellow-50 text-yellow-600' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          Score: {selected.leads.score}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(selected.messages || []).map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'assistant'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-brand-purple text-white'
                      }`}>
                        {msg.channel && msg.role === 'assistant' && (
                          <span className="text-[10px] font-medium text-gray-400 block mb-1 uppercase">{msg.channel}</span>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.timestamp && (
                          <p className={`text-[10px] mt-1 ${msg.role === 'assistant' ? 'text-gray-400' : 'text-white/60'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* AI Smart Reply Suggestions */}
                {(suggestions.length > 0 || loadingSuggestions) && (
                  <div className="px-4 py-2 border-t bg-purple-50/50">
                    <p className="text-[10px] font-medium text-purple-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                      AI Suggested Replies
                    </p>
                    {loadingSuggestions ? (
                      <div className="flex items-center gap-2 py-1">
                        <span className="animate-spin w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full" />
                        <span className="text-xs text-purple-500">Generating suggestions...</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => setReplyText(s)}
                            className="text-xs bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-50 transition text-left max-w-[280px] truncate"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reply input */}
                <div className="p-3 border-t flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                    placeholder={selected.leads?.phone ? `Reply via SMS to ${selected.leads.phone}...` : 'Type a reply...'}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !replyText.trim()}
                    className="bg-brand-purple text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-purple-dark transition disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Select a conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
