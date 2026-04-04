'use client';

import { useParams } from 'next/navigation';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_BRAND_COLOR, normalizeBrandColor } from '@/lib/brand-theme';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BizInfo {
  name: string;
  industry: string;
  ai_personality: string;
  brandColor?: string;
  logoUrl?: string | null;
  bookingUrl?: string | null;
  services: { name: string }[];
}

const QUICK_PROMPTS_BY_INDUSTRY: Record<string, string[]> = {
  dental: ['What services do you offer?', 'How much does a check-up cost?', 'Can I book an appointment?', 'Do you handle emergencies?'],
  aesthetics: ['What treatments do you offer?', 'How much does Botox cost?', 'Can I book a consultation?', 'Do you have any current availability?'],
  physiotherapy: ['I have back pain, can you help?', 'What does a first session involve?', 'Do you accept insurance?', 'Can I book an assessment?'],
  legal: ['I need legal advice', 'How much does a consultation cost?', 'What areas of law do you cover?', 'Can I book a free consultation?'],
  'home services': ['I need a quote', 'What areas do you cover?', 'How quickly can you come?', 'Do you offer free estimates?'],
};

const DEFAULT_PROMPTS = ['What services do you offer?', 'How much does it cost?', 'Can I book an appointment?', 'Tell me more about your business'];

function withAlpha(hex: string, alpha: string) {
  return `${hex}${alpha}`;
}

export default function WidgetPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params?.orgId ?? '';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [bizInfo, setBizInfo] = useState<BizInfo | null>(null);
  const [bootNotice, setBootNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    async function fetchBiz() {
      try {
        const res = await fetch(`/api/widget/info?orgId=${orgId}`);
        if (res.ok) {
          const data = await res.json();
          setBizInfo(data);
          setBootNotice(null);
        } else {
          setBootNotice('The live clinic profile is still loading. You can still ask a question below.');
        }
      } catch {
        setBootNotice('The live clinic profile is still loading. You can still ask a question below.');
      }
    }

    if (orgId) fetchBiz();
  }, [orgId]);

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
          orgId,
          message: userMsg,
          conversationId,
          leadId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.reply) {
        throw new Error(data.error || 'Chat request failed');
      }

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'zyp-unread', count: 1 }, document.referrer || '*');
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
  const brandColor = normalizeBrandColor(bizInfo?.brandColor || DEFAULT_BRAND_COLOR);
  const industry = bizInfo?.industry?.toLowerCase() || '';
  const quickPrompts = QUICK_PROMPTS_BY_INDUSTRY[industry] || DEFAULT_PROMPTS;
  const logoUrl = bizInfo?.logoUrl || null;
  const bookingUrl = bizInfo?.bookingUrl || null;
  const initial = bizInfo?.name?.[0]?.toUpperCase() || 'Z';
  const widgetStyle = useMemo(
    () =>
      ({
        '--widget-brand': brandColor,
        '--widget-brand-soft': withAlpha(brandColor, '14'),
        '--widget-brand-border': withAlpha(brandColor, '2a'),
      } as CSSProperties),
    [brandColor]
  );

  return (
    <div className="flex h-screen flex-col bg-[linear-gradient(180deg,#fff_0%,#fff7f3_100%)]" style={widgetStyle}>
      <div className="border-b border-black/5 px-4 py-3 text-white" style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${withAlpha(brandColor, 'cc')} 100%)` }}>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={`${businessName} logo`} className="h-10 w-10 rounded-full border border-white/20 object-cover bg-white/10" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-sm font-bold">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{businessName}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>Online now</span>
              <span>&middot;</span>
              <span>AI assistant with human handoff when needed</span>
            </div>
          </div>
          <button
            onClick={() => window.parent.postMessage({ type: 'zyp-close' }, document.referrer || '*')}
            className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close chat widget"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {bootNotice ? (
          <div className="mb-4 rounded-[20px] border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-700">
            {bootNotice}
          </div>
        ) : null}
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-black/5 bg-white/90 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
              <p className="text-sm font-semibold text-slate-900">Welcome to {businessName}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ask about services, pricing, booking, or anything a new patient would want to know before taking the next step.
              </p>
              <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
                This assistant is AI-powered. If the question needs a human answer, the clinic team can step in and follow up.
              </div>
            </div>
            <div className="rounded-[24px] border border-[var(--widget-brand-border)] bg-[var(--widget-brand-soft)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Quick questions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border px-3 py-2 text-xs font-semibold transition"
                    style={{
                      borderColor: withAlpha(brandColor, '33'),
                      color: brandColor,
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-black/5 bg-white/90 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Prefer a direct next step?</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Book directly if you are ready, or send a message and the clinic can follow up.
                  </p>
                </div>
                {bookingUrl ? (
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full px-4 py-2 text-sm font-semibold text-white transition"
                    style={{ backgroundColor: brandColor }}
                  >
                    Book now
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={`${msg.role}-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ${
                    msg.role === 'user'
                      ? 'rounded-br-md text-white'
                      : 'rounded-bl-md border border-black/5 bg-white text-slate-700'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: brandColor } : undefined}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="mt-3 flex justify-start">
            <div className="rounded-3xl rounded-bl-md border border-black/5 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0.15s]" />
                <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-black/5 bg-white/90 p-3 backdrop-blur">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400"
            style={{ boxShadow: input ? `0 0 0 2px ${withAlpha(brandColor, '1f')}` : undefined, borderColor: input ? withAlpha(brandColor, '55') : undefined }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-full text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: brandColor }}
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2 text-[10px] text-slate-400">
          <span>AI replies first. The clinic can take over when needed.</span>
          <a
            href="https://zypflow.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-300 transition hover:text-slate-400"
          >
            Powered by Zypflow
          </a>
        </div>
      </form>
    </div>
  );
}
