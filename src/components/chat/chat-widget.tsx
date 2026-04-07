'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm Zypflow's AI assistant. I can answer questions about our clinic revenue system, help you understand our services, or connect you with our team. How can I help?",
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Nudge after 10s if chat hasn't been opened
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) setShowNudge(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationHistory: messages
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const reply =
        data.reply || data.message || "Sorry, I couldn't process that. Please try again.";

      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: 'assistant', content: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            "I'm having trouble connecting right now. You can reach us at hello@zypflow.co.uk.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  return (
    <>
      {/* Floating trigger button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {showNudge && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="absolute -left-52 -top-2 w-48 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3 text-xs text-[var(--app-text-muted)] shadow-lg"
            >
              Have questions about Zypflow?
              <div className="absolute -right-1 top-4 h-2 w-2 rotate-45 border-b border-r border-[var(--app-border)] bg-[var(--app-surface-strong)]" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
          onClick={() => {
            setIsOpen(!isOpen);
            setShowNudge(false);
          }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark text-white shadow-[0_8px_30px_rgba(210,102,69,0.35)] transition-shadow hover:shadow-[0_12px_40px_rgba(210,102,69,0.45)]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showNudge && !isOpen && (
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--app-bg)] bg-emerald-400" />
          )}
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.svg
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </motion.svg>
            ) : (
              <motion.svg
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Chat with Zypflow"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed bottom-24 right-6 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-[var(--app-bg)] shadow-[0_25px_60px_rgba(0,0,0,0.4)]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface-strong)] px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark text-xs font-bold text-white">
                Z
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--app-text)]">Zypflow</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <p className="text-[11px] text-[var(--app-text-soft)]">Online now</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={i > 0 ? { opacity: 0, y: 8 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-brand-purple to-brand-purple-dark text-white'
                          : 'border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-text-muted)]'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="h-2 w-2 animate-bounce rounded-full bg-[var(--app-text-soft)]"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about our services..."
                  className="flex-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-2.5 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-text-soft)] focus:border-brand-purple"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-purple-dark text-white transition-opacity disabled:opacity-40"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
              <p className="mt-2 text-center text-[10px] text-[var(--app-text-soft)]">
                Powered by Zypflow AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
