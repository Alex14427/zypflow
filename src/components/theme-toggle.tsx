'use client';

import { useTheme } from '@/components/theme-provider';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      data-testid="theme-toggle"
      className={`inline-flex items-center gap-2 rounded-full border transition ${
        compact
          ? 'border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-semibold text-[var(--app-text-muted)] hover:border-brand-purple hover:text-[var(--app-text)]'
          : 'border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--app-text-muted)] hover:border-brand-purple hover:text-[var(--app-text)]'
      }`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--app-text)] text-[var(--app-surface-strong)] dark:bg-[var(--brand-purple-soft)] dark:text-slate-900">
        {isDark ? <SunIcon /> : <MoonIcon />}
      </span>
      <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3c0 .34.02.67.05 1A7 7 0 0020 12c.33.03.66.05 1 .05z" />
    </svg>
  );
}
