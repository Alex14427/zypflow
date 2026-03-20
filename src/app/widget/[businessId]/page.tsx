'use client';

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BizInfo {
  name: string;
  industry: string;
  ai_personality: string;
  services: { name: string }[];
}

const QUICK_PROMPTS_BY_INDUSTRY: Record<string, string[]> = {
  dental: ['What services do you offer?', 'How much does a check-up cost?', 'Can I book an appointment?', 'Do you handle emergencies?'],
  aesthetics: ['What treatments do you offer?', 'How much does Botox cost?', 'Can I book a consultation?', 'Do you have any offers?'],
  physiotherapy: ['I have back pain, can you help?', 'What does a first session involve?', 'Do you accept insurance?', 'Can I book an assessment?'],
  legal: ['I need legal advice', 'How much does a consultation cost?', 'What areas of law do you cover?', 'Can I book a free consultation?'],
  'home services': ['I need a quote', 'What areas do you cover?', 'How quickly can you come?', 'Do you offer free estimates?'],
};

const DEFAULT_PROMPTS = ['What services do you offer?', 'How much does it cost?', 'Can I book an appointment?', 'Tell me more about your business'];

export default function WidgetPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [bizInfo, setBizInfo] = useState<BizInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch business info for branding
  useEffect(() => {
    async function fetchBiz() {
      try {
        const res = await fetch(`/api/widget/info?businessId=${businessId}`);
        if (res.ok) {
          const data = await res.json();
          setBizInfo(data);
        }
      } catch {
        // Fail silently — will use defaults
      }
    }
    if (businessId) fetchBiz();
  }, [businessId]);

  async function sendMessage(text?: string) {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          message: userMsg,
          conversationId,
          leadId,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        // Notify parent window of new unread message
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'zyp-unread', count: 1 }, '*');
        }
      }
      if (data.conversationId) setConversationId(data.conversationId);
      if (data.leadId) setLeadId(data.leadId);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  const businessName = bizInfo?.name || 'Chat Assistant';
  const initial = bizInfo?.name?.[0]?.toUpperCase() || 'Z';
  const industry = bizInfo?.industry?.toLowerCase() || '';
  const quickPrompts = QUICK_PROMPTS_BY_INDUSTRY[industry] || DEFAULT_PROMPTS;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header — branded per business */}
      <div className="bg-[#6c3cff] text-white px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{businessName}</p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <p className="text-xs text-white/70">Online now &middot; Replies instantly</p>
          </div>
        </div>
        {/* Close button (sends message to parent iframe) */}
        <button
          onClick={() => window.parent.postMessage({ type: 'zyp-close' }, '*')}
          className="text-white/60 hover:text-white transition p-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-4 mt-4">
            {/* Welcome message */}
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
                <p>Hi there! I&apos;m the AI assistant for <strong>{businessName}</strong>. How can I help you today?</p>
              </div>
            </div>

            {/* Quick prompt buttons */}
            <div className="space-y-2">
              <p className="text-xs text-gray-400 text-center">Quick questions:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-xs bg-white border border-[#6c3cff]/20 text-[#6c3cff] px-3 py-1.5 rounded-full hover:bg-[#6c3cff]/5 transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#6c3cff] text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#6c3cff] focus:ring-1 focus:ring-[#6c3cff]/30"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-[#6c3cff] text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-[#5a2de0] transition flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>

      <div className="text-center pb-2">
        <a
          href="https://zypflow.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-gray-300 hover:text-gray-400 transition"
        >
          Powered by Zypflow
        </a>
      </div>
    </div>
  );
}
