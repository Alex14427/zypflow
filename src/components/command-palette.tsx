'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: Command[] = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: 'home', action: () => router.push('/dashboard'), keywords: ['overview', 'home'] },
    { id: 'leads', label: 'View Leads', icon: 'users', action: () => router.push('/dashboard/leads'), keywords: ['contacts', 'prospects'] },
    { id: 'conversations', label: 'View Conversations', icon: 'chat', action: () => router.push('/dashboard/conversations'), keywords: ['messages', 'inbox'] },
    { id: 'bookings', label: 'View Bookings', icon: 'calendar', action: () => router.push('/dashboard/bookings'), keywords: ['appointments', 'schedule'] },
    { id: 'reviews', label: 'View Reviews', icon: 'star', action: () => router.push('/dashboard/reviews'), keywords: ['ratings', 'feedback'] },
    { id: 'analytics', label: 'View Analytics', icon: 'chart', action: () => router.push('/dashboard/analytics'), keywords: ['stats', 'metrics', 'data'] },
    { id: 'settings', label: 'Open Settings', icon: 'gear', action: () => router.push('/dashboard/settings'), keywords: ['preferences', 'config'] },
    { id: 'export', label: 'Export Leads CSV', description: 'Download all leads as CSV', icon: 'download', action: () => router.push('/dashboard/leads'), keywords: ['download', 'csv'] },
    { id: 'widget', label: 'Get Widget Code', description: 'Copy chat widget embed code', icon: 'code', action: () => router.push('/dashboard/settings'), keywords: ['embed', 'install', 'script'] },
    { id: 'billing', label: 'Manage Billing', description: 'View subscription and invoices', icon: 'card', action: () => router.push('/dashboard/settings'), keywords: ['subscription', 'payment', 'plan'] },
    { id: 'pricing', label: 'View Pricing', icon: 'tag', action: () => router.push('/pricing'), keywords: ['plans', 'upgrade'] },
  ];

  const filtered = query
    ? commands.filter(c => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) ||
               c.description?.toLowerCase().includes(q) ||
               c.keywords?.some(k => k.includes(q));
      })
    : commands;

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
      setOpen(false);
    }
  }, [filtered, selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Palette */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
          />
          <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No commands found</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => { cmd.action(); setOpen(false); }}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition ${
                  i === selectedIndex ? 'bg-brand-purple/5 text-brand-purple' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                  i === selectedIndex ? 'bg-brand-purple/10' : 'bg-gray-100'
                }`}>
                  <CommandIcon icon={cmd.icon} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{cmd.label}</p>
                  {cmd.description && <p className="text-xs text-gray-400">{cmd.description}</p>}
                </div>
                {i === selectedIndex && (
                  <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">Enter</kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-gray-50 flex items-center gap-4 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><kbd className="bg-gray-200 px-1 py-0.5 rounded font-mono">&#8593;&#8595;</kbd> Navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-200 px-1 py-0.5 rounded font-mono">Enter</kbd> Select</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-200 px-1 py-0.5 rounded font-mono">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}

function CommandIcon({ icon }: { icon: string }) {
  const props = { className: 'w-4 h-4', fill: 'none' as const, viewBox: '0 0 24 24', stroke: 'currentColor' };
  switch (icon) {
    case 'home': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case 'users': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case 'chat': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
    case 'calendar': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case 'star': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
    case 'chart': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case 'gear': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    default: return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
  }
}
