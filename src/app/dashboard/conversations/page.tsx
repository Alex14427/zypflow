'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  role: string;
  content: string;
  timestamp?: string;
}

interface Conversation {
  id: string;
  channel: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  leads: { name: string; email: string; phone: string } | null;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [smsText, setSmsText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase.from('businesses').select('id').eq('email', user.email).maybeSingle();
      if (!biz) return;

      const { data } = await supabase
        .from('conversations')
        .select('id, channel, messages, created_at, updated_at, leads(name, email, phone)')
        .eq('business_id', biz.id)
        .order('updated_at', { ascending: false })
        .limit(100);
      const convs = (data as unknown as Conversation[]) || [];
      setConversations(convs);
      if (convs.length > 0) setSelected(convs[0]);
      setLoading(false);
    }
    load();
  }, []);

  async function sendSms() {
    if (!selected?.leads?.phone || !smsText.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selected.leads.phone,
          body: smsText.trim(),
        }),
      });
      if (res.ok) {
        // Append to conversation messages locally
        const newMsg: Message = { role: 'assistant', content: `[SMS] ${smsText.trim()}`, timestamp: new Date().toISOString() };
        const updatedMessages = [...(selected.messages || []), newMsg];
        setSelected({ ...selected, messages: updatedMessages });
        setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, messages: updatedMessages } : c));
        setSmsText('');
      }
    } catch (err) {
      console.error('SMS send failed:', err);
    }
    setSending(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Conversations</h1>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
          No conversations yet. They will appear here when customers use the chat widget.
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversation list */}
          <div className="bg-white rounded-xl shadow-sm border overflow-y-auto">
            <div className="p-3 border-b bg-gray-50">
              <p className="text-sm font-medium text-gray-500">{conversations.length} conversations</p>
            </div>
            <div className="divide-y">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                    selected?.id === conv.id ? 'bg-brand-purple/5 border-l-2 border-brand-purple' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{conv.leads?.name || 'Anonymous'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      conv.channel === 'chat' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {conv.channel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {conv.messages?.[conv.messages.length - 1]?.content || 'No messages'}
                  </p>
                  <p className="text-[10px] text-gray-300 mt-1">
                    {new Date(conv.updated_at).toLocaleDateString('en-GB')} {new Date(conv.updated_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Message viewer */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border flex flex-col">
            {selected ? (
              <>
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{selected.leads?.name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400">{selected.leads?.email || 'No email'} &middot; {selected.channel}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(selected.created_at).toLocaleDateString('en-GB')}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(selected.messages || []).map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'assistant'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-brand-purple text-white'
                      }`}>
                        <p>{msg.content}</p>
                        {msg.timestamp && (
                          <p className={`text-[10px] mt-1 ${msg.role === 'assistant' ? 'text-gray-400' : 'text-white/60'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {selected.leads?.phone && (
                  <div className="p-3 border-t flex gap-2">
                    <input
                      type="text"
                      value={smsText}
                      onChange={e => setSmsText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendSms()}
                      placeholder={`SMS to ${selected.leads.phone}...`}
                      className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                    />
                    <button
                      onClick={sendSms}
                      disabled={sending || !smsText.trim()}
                      className="bg-brand-purple text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-purple-dark transition disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : 'Send SMS'}
                    </button>
                  </div>
                )}
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
